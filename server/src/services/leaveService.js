import { z } from 'zod';
import { LEAVE_STATUS, MOVEMENT_TYPE, PRESENCE_STATUS, ROLES } from '../config/constants.js';
import { GatePass, LeaveRequest, Movement } from '../models/Leave.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { writeAudit } from '../models/AuditLog.js';
import { hashToken, randomToken } from '../utils/tokens.js';
import { HttpError } from '../utils/http.js';

async function studentForUser(req) {
  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.GATE_SECURITY) {
    return null;
  }
  return StudentProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
}

export async function createLeave(req, res) {
  const body = z
    .object({
      destination: z.string().min(1),
      reason: z.string().min(1),
      departureDate: z.coerce.date(),
      expectedReturnDate: z.coerce.date(),
      emergencyContact: z.object({ name: z.string().min(1), phone: z.string().min(8) }),
    })
    .parse(req.body);
  const student = await studentForUser(req);
  if (!student) throw new HttpError(403, 'Only students may submit leave requests');
  if (body.expectedReturnDate < body.departureDate) {
    throw new HttpError(400, 'Expected return must be on or after departure');
  }
  const leave = await LeaveRequest.create({
    institutionId: req.user.institutionId,
    studentId: student._id,
    ...body,
    status: LEAVE_STATUS.PENDING,
    approvalHistory: [{ action: 'SUBMITTED', actorId: req.user._id, note: '', at: new Date() }],
  });
  res.status(201).json({ leave });
}

export async function listLeaves(req, res) {
  const query = { institutionId: req.user.institutionId };
  if (req.user.role === ROLES.STUDENT || req.user.role === ROLES.MENTOR) {
    const student = await studentForUser(req);
    query.studentId = student?._id;
  } else if (req.query.studentId) {
    query.studentId = req.query.studentId;
  }
  if (req.query.status) query.status = req.query.status;
  const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
  res.json({ leaves });
}

export async function decideLeave(req, res) {
  const body = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), note: z.string().optional().default('') }).parse(req.body);
  const leave = await LeaveRequest.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!leave) throw new HttpError(404, 'Leave request not found');
  if (leave.status !== LEAVE_STATUS.PENDING) throw new HttpError(409, 'Leave is not pending');
  leave.status = body.decision;
  leave.approvalHistory.push({ action: body.decision, actorId: req.user._id, note: body.note, at: new Date() });
  await leave.save();
  let gatePass = null;
  if (body.decision === LEAVE_STATUS.APPROVED) {
    const raw = randomToken();
    const publicCode = randomToken(6).slice(0, 10).toUpperCase();
    const qrPayload = JSON.stringify({
      kind: 'UNIHOSTEL_GATE_PASS',
      code: publicCode,
      institutionId: String(req.user.institutionId),
      studentId: String(leave.studentId),
      leaveRequestId: String(leave._id),
      validFrom: leave.departureDate,
      validUntil: leave.expectedReturnDate,
    });
    gatePass = await GatePass.create({
      institutionId: req.user.institutionId,
      studentId: leave.studentId,
      leaveRequestId: leave._id,
      tokenHash: hashToken(raw),
      publicCode,
      qrPayload,
      validFrom: leave.departureDate,
      validUntil: leave.expectedReturnDate,
      status: 'ACTIVE',
    });
  }
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: `LEAVE_${body.decision}`,
    resourceType: 'LeaveRequest',
    resourceId: leave._id,
    metadata: { decision: body.decision },
  });
  res.json({ leave, gatePass: gatePass ? { id: gatePass._id, publicCode: gatePass.publicCode, qrPayload: gatePass.qrPayload } : null });
}

export async function verifyGatePass(req, res) {
  const body = z.object({ code: z.string().min(4), note: z.string().optional().default('') }).parse(req.body);
  const pass = await GatePass.findOne({
    institutionId: req.user.institutionId,
    publicCode: body.code.trim().toUpperCase(),
  });
  if (!pass) throw new HttpError(404, 'Gate pass not found');
  if (pass.status !== 'ACTIVE') throw new HttpError(409, `Gate pass is ${pass.status.toLowerCase()}`);
  const now = new Date();
  if (now < pass.validFrom || now > pass.validUntil) {
    pass.status = 'EXPIRED';
    await pass.save();
    throw new HttpError(409, 'Gate pass is outside its validity window');
  }
  const student = await StudentProfile.findById(pass.studentId).populate('userId', 'firstName lastName email');
  res.json({
    valid: true,
    gatePass: { id: pass._id, publicCode: pass.publicCode, validFrom: pass.validFrom, validUntil: pass.validUntil },
    student,
  });
}

export async function recordMovement(req, res) {
  const body = z
    .object({
      studentId: z.string().optional(),
      code: z.string().optional(),
      type: z.enum([MOVEMENT_TYPE.ENTRY, MOVEMENT_TYPE.EXIT]),
      note: z.string().optional().default(''),
    })
    .parse(req.body);
  let student;
  let gatePass = null;
  if (body.code) {
    gatePass = await GatePass.findOne({
      institutionId: req.user.institutionId,
      publicCode: body.code.trim().toUpperCase(),
    });
    if (!gatePass) throw new HttpError(404, 'Gate pass not found');
    student = await StudentProfile.findOne({ _id: gatePass.studentId, institutionId: req.user.institutionId });
  } else if (body.studentId) {
    student = await StudentProfile.findOne({ _id: body.studentId, institutionId: req.user.institutionId });
  }
  if (!student) throw new HttpError(404, 'Student not found');
  const last = await Movement.findOne({ studentId: student._id, institutionId: req.user.institutionId }).sort({
    occurredAt: -1,
  });
  if (last && last.type === body.type) {
    throw new HttpError(409, `Consecutive duplicate ${body.type.toLowerCase()} is not allowed`);
  }
  const movement = await Movement.create({
    institutionId: req.user.institutionId,
    studentId: student._id,
    type: body.type,
    gatePassId: gatePass?._id || null,
    verifiedBy: req.user._id,
    note: body.note,
  });
  student.presenceStatus = body.type === MOVEMENT_TYPE.EXIT ? PRESENCE_STATUS.OUTSIDE : PRESENCE_STATUS.INSIDE;
  await student.save();
  if (gatePass && body.type === MOVEMENT_TYPE.EXIT) {
    const leave = await LeaveRequest.findById(gatePass.leaveRequestId);
    if (leave && !leave.actualDeparture) {
      leave.actualDeparture = new Date();
      await leave.save();
    }
  }
  if (body.type === MOVEMENT_TYPE.ENTRY) {
    const leave = await LeaveRequest.findOne({
      studentId: student._id,
      status: LEAVE_STATUS.APPROVED,
      actualReturn: null,
    }).sort({ expectedReturnDate: -1 });
    if (leave) {
      leave.actualReturn = new Date();
      leave.lateReturn = leave.actualReturn > leave.expectedReturnDate;
      await leave.save();
    }
  }
  res.status(201).json({ movement, presenceStatus: student.presenceStatus });
}

export async function lookupStudent(req, res) {
  const q = z.object({ rollNumber: z.string().optional(), email: z.string().optional() }).parse(req.query);
  const filter = { institutionId: req.user.institutionId };
  if (q.rollNumber) filter.rollNumber = q.rollNumber;
  if (!q.rollNumber && !q.email) throw new HttpError(400, 'Provide rollNumber or email');
  let student = q.rollNumber ? await StudentProfile.findOne(filter).populate('userId', 'email firstName lastName') : null;
  if (!student && q.email) {
    const { User } = await import('../models/User.js');
    const user = await User.findOne({ institutionId: req.user.institutionId, email: q.email.toLowerCase() });
    if (user) student = await StudentProfile.findOne({ userId: user._id }).populate('userId', 'email firstName lastName');
  }
  if (!student) throw new HttpError(404, 'Student not found');
  res.json({ student });
}

export async function listMovements(req, res) {
  const query = { institutionId: req.user.institutionId };
  if (req.query.studentId) query.studentId = req.query.studentId;
  const movements = await Movement.find(query).sort({ occurredAt: -1 }).limit(200);
  res.json({ movements });
}

export async function myGatePasses(req, res) {
  const student = await studentForUser(req);
  if (!student) throw new HttpError(403, 'Student profile required');
  const passes = await GatePass.find({ studentId: student._id, institutionId: req.user.institutionId }).sort({
    createdAt: -1,
  });
  res.json({
    gatePasses: passes.map((p) => ({
      id: p._id,
      publicCode: p.publicCode,
      qrPayload: p.qrPayload,
      validFrom: p.validFrom,
      validUntil: p.validUntil,
      status: p.status,
    })),
  });
}
