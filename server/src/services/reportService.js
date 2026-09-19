import { z } from 'zod';
import { MESS_STATUS, PRESENCE_STATUS, ROLES } from '../config/constants.js';
import { MessEnrolment } from '../models/MessEnrolment.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Bed } from '../models/Room.js';
import { LeaveRequest } from '../models/Leave.js';
import { Complaint } from '../models/Complaint.js';
import { MentorAssignment, MentorProfile } from '../models/Mentorship.js';
import { Residency } from '../models/Residency.js';
import { AuditLog } from '../models/AuditLog.js';
import { HttpError } from '../utils/http.js';

export async function upsertMess(req, res) {
  const body = z
    .object({
      studentId: z.string(),
      messName: z.string().min(1),
      plan: z.string().min(1),
      startDate: z.coerce.date(),
      endDate: z.coerce.date().optional().nullable(),
      status: z.enum(Object.values(MESS_STATUS)).default(MESS_STATUS.ENROLLED),
    })
    .parse(req.body);
  const student = await StudentProfile.findOne({ _id: body.studentId, institutionId: req.user.institutionId });
  if (!student) throw new HttpError(404, 'Student not found');
  const enrolment = await MessEnrolment.findOneAndUpdate(
    { studentId: student._id, institutionId: req.user.institutionId, status: MESS_STATUS.ENROLLED },
    {
      $set: {
        messName: body.messName,
        plan: body.plan,
        startDate: body.startDate,
        endDate: body.endDate || null,
        status: body.status,
      },
      $setOnInsert: { institutionId: req.user.institutionId, studentId: student._id },
    },
    { new: true, upsert: true },
  );
  res.status(201).json({ enrolment });
}

export async function listMess(req, res) {
  const query = { institutionId: req.user.institutionId };
  if (req.user.role === ROLES.STUDENT || req.user.role === ROLES.MENTOR) {
    const student = await StudentProfile.findOne({ userId: req.user._id });
    query.studentId = student?._id;
  }
  const enrolments = await MessEnrolment.find(query).sort({ startDate: -1 });
  res.json({ enrolments });
}

export async function reports(req, res) {
  const institutionId = req.user.institutionId;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [
    totalResidents,
    occupiedBeds,
    vacantBeds,
    residentsOutside,
    approvedLeaveToday,
    overdueReturns,
    complaints,
    mentors,
    assignments,
    messEnrolled,
    recentCheckouts,
  ] = await Promise.all([
    StudentProfile.countDocuments({ institutionId, residencyStatus: 'ACTIVE' }),
    Bed.countDocuments({ institutionId, status: 'OCCUPIED' }),
    Bed.countDocuments({ institutionId, status: 'AVAILABLE' }),
    StudentProfile.countDocuments({ institutionId, presenceStatus: PRESENCE_STATUS.OUTSIDE }),
    LeaveRequest.countDocuments({
      institutionId,
      status: 'APPROVED',
      departureDate: { $lte: end },
      expectedReturnDate: { $gte: start },
    }),
    LeaveRequest.countDocuments({
      institutionId,
      status: 'APPROVED',
      expectedReturnDate: { $lt: new Date() },
      actualReturn: null,
    }),
    Complaint.aggregate([
      { $match: { institutionId } },
      { $group: { _id: { category: '$category', status: '$status' }, count: { $sum: 1 } } },
    ]),
    MentorProfile.find({ institutionId }),
    MentorAssignment.countDocuments({ institutionId, status: 'ACTIVE' }),
    MessEnrolment.countDocuments({ institutionId, status: MESS_STATUS.ENROLLED }),
    Residency.find({ institutionId, status: 'CHECKED_OUT' }).sort({ checkOutAt: -1 }).limit(10),
  ]);

  res.json({
    totalResidents,
    occupiedBeds,
    vacantBeds,
    residentsCurrentlyOutside: residentsOutside,
    approvedLeaveToday,
    overdueReturns,
    complaintsByCategoryAndStatus: complaints,
    mentorCoverage: {
      activeMentors: mentors.filter((m) => m.active).length,
      assignedMentees: assignments,
    },
    mentorWorkload: mentors.map((m) => ({
      mentorId: m._id,
      currentLoad: m.currentLoad,
      capacity: m.capacity,
    })),
    messEnrolledResidents: messEnrolled,
    recentCheckouts,
  });
}

export async function listAudit(req, res) {
  const logs = await AuditLog.find({ institutionId: req.user.institutionId }).sort({ createdAt: -1 }).limit(200);
  res.json({ logs });
}

export async function createEmergencyAssist(req, res) {
  const body = z.object({ message: z.string().min(3) }).parse(req.body);
  const student = await StudentProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
  const { Escalation } = await import('../models/Mentorship.js');
  const escalation = await Escalation.create({
    institutionId: req.user.institutionId,
    assignmentId: student?._id,
    mentorId: student?._id,
    menteeId: student?._id,
    reason: 'EMERGENCY_ASSISTANCE',
    privateNotes: body.message,
    createdBy: req.user._id,
  });
  res.status(201).json({ escalation, message: 'Private assistance request sent to the warden.' });
}
