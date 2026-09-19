import { z } from 'zod';
import { ALLOCATION_STATUS, BED_STATUS, PRESENCE_STATUS, RESIDENCY_STATUS } from '../config/constants.js';
import { Bed, Room } from '../models/Room.js';
import { Hostel } from '../models/Hostel.js';
import { Allocation, Residency } from '../models/Residency.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { writeAudit } from '../models/AuditLog.js';
import { HttpError } from '../utils/http.js';

export async function checkIn(req, res) {
  const body = z.object({ studentId: z.string(), hostelId: z.string(), bedId: z.string() }).parse(req.body);
  const institutionId = req.user.institutionId;
  const student = await StudentProfile.findOne({ _id: body.studentId, institutionId });
  if (!student) throw new HttpError(404, 'Student not found');
  if (student.residencyStatus === RESIDENCY_STATUS.ARCHIVED) {
    throw new HttpError(400, 'Archived students cannot check in');
  }
  const existingResidency = await Residency.findOne({ studentId: student._id, status: 'ACTIVE' });
  if (existingResidency) throw new HttpError(409, 'Student already has an active residency');
  const existingAlloc = await Allocation.findOne({ studentId: student._id, status: ALLOCATION_STATUS.ACTIVE });
  if (existingAlloc) throw new HttpError(409, 'Student already has an active bed allocation');
  const hostel = await Hostel.findOne({ _id: body.hostelId, institutionId });
  if (!hostel) throw new HttpError(404, 'Hostel not found');

  const bed = await Bed.findOne({ _id: body.bedId, institutionId });
  if (!bed) throw new HttpError(404, 'Bed not found');
  if (String(bed.hostelId) !== String(hostel._id)) throw new HttpError(400, 'Bed does not belong to the selected hostel');
  if (bed.status !== BED_STATUS.AVAILABLE || bed.occupantId) {
    throw new HttpError(409, 'Bed is not available');
  }
  const room = await Room.findById(bed.roomId);
  const occupied = await Allocation.countDocuments({ roomId: room._id, status: ALLOCATION_STATUS.ACTIVE });
  if (occupied >= room.capacity) throw new HttpError(409, 'Room capacity would be exceeded');

  const claimed = await Bed.findOneAndUpdate(
    { _id: bed._id, occupantId: null, status: BED_STATUS.AVAILABLE },
    { $set: { occupantId: student._id, status: BED_STATUS.OCCUPIED } },
    { new: true },
  );
  if (!claimed) throw new HttpError(409, 'Bed was allocated to another student');

  try {
    const residency = await Residency.create({
      institutionId,
      studentId: student._id,
      hostelId: hostel._id,
      status: 'ACTIVE',
      checkInAt: new Date(),
    });
    const allocation = await Allocation.create({
      institutionId,
      studentId: student._id,
      residencyId: residency._id,
      hostelId: hostel._id,
      roomId: room._id,
      bedId: claimed._id,
      status: ALLOCATION_STATUS.ACTIVE,
      allocatedAt: new Date(),
    });
    student.residencyStatus = RESIDENCY_STATUS.ACTIVE;
    student.presenceStatus = PRESENCE_STATUS.INSIDE;
    await student.save();
    await writeAudit({
      institutionId,
      actorId: req.user._id,
      action: 'STUDENT_CHECKED_IN',
      resourceType: 'Residency',
      resourceId: residency._id,
      metadata: { studentId: student._id, bedId: claimed._id },
    });
    res.status(201).json({ residency, allocation });
  } catch (err) {
    await Bed.findByIdAndUpdate(claimed._id, { occupantId: null, status: BED_STATUS.AVAILABLE });
    throw err;
  }
}

export async function transferBed(req, res) {
  const body = z.object({ studentId: z.string(), newBedId: z.string() }).parse(req.body);
  const institutionId = req.user.institutionId;
  const student = await StudentProfile.findOne({ _id: body.studentId, institutionId });
  if (!student) throw new HttpError(404, 'Student not found');
  const current = await Allocation.findOne({ studentId: student._id, status: ALLOCATION_STATUS.ACTIVE });
  if (!current) throw new HttpError(409, 'Student has no active allocation to transfer');
  const residency = await Residency.findOne({ _id: current.residencyId, status: 'ACTIVE' });
  if (!residency) throw new HttpError(409, 'Student has no active residency');

  const newBed = await Bed.findOne({ _id: body.newBedId, institutionId });
  if (!newBed) throw new HttpError(404, 'Bed not found');
  if (String(newBed._id) === String(current.bedId)) throw new HttpError(400, 'Student is already on this bed');
  const newRoom = await Room.findById(newBed.roomId);
  const occupied = await Allocation.countDocuments({ roomId: newRoom._id, status: ALLOCATION_STATUS.ACTIVE });
  if (occupied >= newRoom.capacity) throw new HttpError(409, 'Room capacity would be exceeded');

  const claimed = await Bed.findOneAndUpdate(
    { _id: newBed._id, occupantId: null, status: BED_STATUS.AVAILABLE },
    { $set: { occupantId: student._id, status: BED_STATUS.OCCUPIED } },
    { new: true },
  );
  if (!claimed) throw new HttpError(409, 'New bed is not available');

  current.status = ALLOCATION_STATUS.TRANSFERRED;
  current.closedAt = new Date();
  current.closeReason = 'TRANSFER';
  await current.save();
  await Bed.findByIdAndUpdate(current.bedId, { occupantId: null, status: BED_STATUS.AVAILABLE });

  if (String(residency.hostelId) !== String(claimed.hostelId)) {
    residency.hostelId = claimed.hostelId;
    await residency.save();
  }

  const allocation = await Allocation.create({
    institutionId,
    studentId: student._id,
    residencyId: residency._id,
    hostelId: claimed.hostelId,
    roomId: claimed.roomId,
    bedId: claimed._id,
    status: ALLOCATION_STATUS.ACTIVE,
  });
  await writeAudit({
    institutionId,
    actorId: req.user._id,
    action: 'BED_TRANSFERRED',
    resourceType: 'Allocation',
    resourceId: allocation._id,
    metadata: { fromBedId: current.bedId, toBedId: claimed._id },
  });
  res.json({ previous: current, allocation });
}

export async function checkOut(req, res) {
  const body = z.object({ studentId: z.string(), notes: z.string().optional() }).parse(req.body);
  const institutionId = req.user.institutionId;
  const student = await StudentProfile.findOne({ _id: body.studentId, institutionId });
  if (!student) throw new HttpError(404, 'Student not found');
  const residency = await Residency.findOne({ studentId: student._id, status: 'ACTIVE' });
  if (!residency) throw new HttpError(409, 'Student has no active residency');
  const allocation = await Allocation.findOne({ studentId: student._id, status: ALLOCATION_STATUS.ACTIVE });
  const now = new Date();
  if (allocation) {
    allocation.status = ALLOCATION_STATUS.CHECKED_OUT;
    allocation.closedAt = now;
    allocation.closeReason = 'CHECKOUT';
    await allocation.save();
    await Bed.findByIdAndUpdate(allocation.bedId, { occupantId: null, status: BED_STATUS.AVAILABLE });
  }
  residency.status = 'CHECKED_OUT';
  residency.checkOutAt = now;
  residency.notes = body.notes || residency.notes;
  await residency.save();
  student.residencyStatus = RESIDENCY_STATUS.CHECKED_OUT;
  student.presenceStatus = PRESENCE_STATUS.UNKNOWN;
  await student.save();
  await writeAudit({
    institutionId,
    actorId: req.user._id,
    action: 'STUDENT_CHECKED_OUT',
    resourceType: 'Residency',
    resourceId: residency._id,
    metadata: { studentId: student._id },
  });
  res.json({ residency, allocation });
}

export async function allocationHistory(req, res) {
  const query = { institutionId: req.user.institutionId };
  if (req.query.studentId) query.studentId = req.query.studentId;
  const allocations = await Allocation.find(query).sort({ allocatedAt: -1 });
  const residencies = await Residency.find(query.studentId ? query : { institutionId: req.user.institutionId }).sort({
    checkInAt: -1,
  });
  res.json({ allocations, residencies });
}
