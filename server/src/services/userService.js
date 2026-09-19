import { z } from 'zod';
import { ACCOUNT_STATUS, ROLES } from '../config/constants.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { writeAudit } from '../models/AuditLog.js';
import { HttpError } from '../utils/http.js';

export async function listUsers(req, res) {
  const users = await User.find({ institutionId: req.user.institutionId }).sort({ createdAt: -1 }).lean();
  res.json({ users });
}

export async function approveUser(req, res) {
  const user = await User.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!user) throw new HttpError(404, 'User not found');
  user.status = ACCOUNT_STATUS.ACTIVE;
  await user.save();
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: 'USER_APPROVED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { email: user.email },
  });
  res.json({ user });
}

export async function setUserStatus(req, res) {
  const body = z.object({ status: z.enum(Object.values(ACCOUNT_STATUS)) }).parse(req.body);
  const user = await User.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!user) throw new HttpError(404, 'User not found');
  if (String(user._id) === String(req.user._id) && body.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new HttpError(400, 'You cannot deactivate your own account');
  }
  user.status = body.status;
  await user.save();
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: 'USER_STATUS_CHANGED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { status: user.status },
  });
  res.json({ user });
}

export async function assignRole(req, res) {
  const body = z.object({ role: z.enum(Object.values(ROLES)) }).parse(req.body);
  const user = await User.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!user) throw new HttpError(404, 'User not found');
  user.role = body.role;
  if (body.role !== ROLES.STUDENT && user.status === ACCOUNT_STATUS.PENDING) {
    user.status = ACCOUNT_STATUS.ACTIVE;
  }
  await user.save();
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: 'USER_ROLE_ASSIGNED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { role: user.role },
  });
  res.json({ user });
}

export async function listStudents(req, res) {
  const students = await StudentProfile.find({ institutionId: req.user.institutionId })
    .populate('userId', 'email firstName lastName role status')
    .sort({ rollNumber: 1 });
  res.json({ students });
}

export async function getOwnStudent(req, res) {
  const student = await StudentProfile.findOne({
    userId: req.user._id,
    institutionId: req.user.institutionId,
  }).populate('userId', 'email firstName lastName role status');
  if (!student) throw new HttpError(404, 'Student not found');
  res.json({ student });
}

export async function getStudent(req, res) {
  if (req.user.role !== ROLES.ADMIN && String(req.params.id) !== String(req.user._id)) {
    const own = await StudentProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
    if (!own || String(own._id) !== String(req.params.id)) {
      throw new HttpError(403, 'You may only view your own student record');
    }
  }
  const student = await StudentProfile.findOne({
    _id: req.params.id,
    institutionId: req.user.institutionId,
  }).populate('userId', 'email firstName lastName role status');
  if (!student) throw new HttpError(404, 'Student not found');
  res.json({ student });
}

export async function updateStudent(req, res) {
  const body = z
    .object({
      programme: z.string().min(1).optional(),
      department: z.string().min(1).optional(),
      academicYear: z.string().min(1).optional(),
      phone: z.string().min(8).optional(),
      emergencyContact: z
        .object({
          name: z.string().min(1),
          phone: z.string().min(8),
          relation: z.string().min(1),
        })
        .optional(),
      accessibilityRequirement: z.string().optional(),
      allergyNote: z.string().optional(),
      allergyConsented: z.boolean().optional(),
    })
    .parse(req.body);
  const isSelf = req.user.role === ROLES.STUDENT || req.user.role === ROLES.MENTOR;
  const query = isSelf
    ? { userId: req.user._id, institutionId: req.user.institutionId }
    : { _id: req.params.id, institutionId: req.user.institutionId };
  const student = await StudentProfile.findOne(query);
  if (!student) throw new HttpError(404, 'Student not found');
  Object.assign(student, body);
  if (body.allergyConsented === false) student.allergyNote = '';
  await student.save();
  res.json({ student });
}

export async function archiveStudent(req, res) {
  const student = await StudentProfile.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!student) throw new HttpError(404, 'Student not found');
  student.residencyStatus = 'ARCHIVED';
  await student.save();
  const user = await User.findById(student.userId);
  if (user) {
    user.status = ACCOUNT_STATUS.ARCHIVED;
    await user.save();
  }
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: 'STUDENT_ARCHIVED',
    resourceType: 'StudentProfile',
    resourceId: student._id,
    metadata: { rollNumber: student.rollNumber },
  });
  res.json({ student, message: 'Student archived. Historical records are retained.' });
}
