import { z } from 'zod';
import { ASSIGNMENT_STATUS, ROLES } from '../config/constants.js';
import { MentorAssignment, MentorCheckIn, MentorProfile, Escalation } from '../models/Mentorship.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { Allocation } from '../models/Residency.js';
import { writeAudit } from '../models/AuditLog.js';
import { HttpError } from '../utils/http.js';

/**
 * Deterministic mentor selection:
 * same institution, eligible hostel, active, below capacity, least load, then ObjectId.
 */
export function selectLeastLoadedMentor(mentors, hostelId) {
  const eligible = mentors.filter((mentor) => {
    if (!mentor.active) return false;
    if (mentor.currentLoad >= mentor.capacity) return false;
    const allowed = mentor.eligibleHostelIds?.map((id) => String(id)) || [];
    if (allowed.length && hostelId && !allowed.includes(String(hostelId))) return false;
    return true;
  });
  eligible.sort((a, b) => {
    if (a.currentLoad !== b.currentLoad) return a.currentLoad - b.currentLoad;
    const created = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (created !== 0) return created;
    return String(a._id).localeCompare(String(b._id));
  });
  return eligible[0] || null;
}

export async function designateMentor(req, res) {
  const body = z
    .object({
      userId: z.string(),
      capacity: z.number().int().positive().default(8),
      eligibleHostelIds: z.array(z.string()).default([]),
    })
    .parse(req.body);
  const user = await User.findOne({ _id: body.userId, institutionId: req.user.institutionId });
  if (!user) throw new HttpError(404, 'User not found');
  const student = await StudentProfile.findOne({ userId: user._id, institutionId: req.user.institutionId });
  if (!student) throw new HttpError(400, 'Only students with profiles can become mentors');
  user.role = ROLES.MENTOR;
  if (user.status === 'PENDING') user.status = 'ACTIVE';
  await user.save();
  const mentor = await MentorProfile.findOneAndUpdate(
    { userId: user._id, institutionId: req.user.institutionId },
    {
      $set: {
        studentId: student._id,
        capacity: body.capacity,
        eligibleHostelIds: body.eligibleHostelIds,
        active: true,
      },
      $setOnInsert: { currentLoad: 0, institutionId: req.user.institutionId },
    },
    { new: true, upsert: true },
  );
  res.status(201).json({ mentor, user });
}

async function hostelForStudent(studentId) {
  const allocation = await Allocation.findOne({ studentId, status: 'ACTIVE' });
  return allocation?.hostelId || null;
}

export async function assignMentor(req, res) {
  const body = z.object({ menteeId: z.string(), mentorId: z.string().optional() }).parse(req.body);
  const mentee = await StudentProfile.findOne({ _id: body.menteeId, institutionId: req.user.institutionId });
  if (!mentee) throw new HttpError(404, 'Mentee not found');
  const existing = await MentorAssignment.findOne({ menteeId: mentee._id, status: ASSIGNMENT_STATUS.ACTIVE });
  if (existing) throw new HttpError(409, 'Mentee already has an active mentor');
  const hostelId = await hostelForStudent(mentee._id);
  let mentor;
  if (body.mentorId) {
    mentor = await MentorProfile.findOne({ _id: body.mentorId, institutionId: req.user.institutionId, active: true });
    if (!mentor) throw new HttpError(404, 'Mentor not found');
    if (mentor.currentLoad >= mentor.capacity) throw new HttpError(409, 'Mentor is at capacity');
  } else {
    const mentors = await MentorProfile.find({ institutionId: req.user.institutionId });
    mentor = selectLeastLoadedMentor(mentors, hostelId);
    if (!mentor) throw new HttpError(409, 'No eligible mentor is available');
  }
  const assignment = await MentorAssignment.create({
    institutionId: req.user.institutionId,
    mentorId: mentor._id,
    menteeId: mentee._id,
    hostelId,
    status: ASSIGNMENT_STATUS.ACTIVE,
  });
  mentor.currentLoad += 1;
  await mentor.save();
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: 'MENTOR_ASSIGNED',
    resourceType: 'MentorAssignment',
    resourceId: assignment._id,
    metadata: { mentorId: mentor._id, menteeId: mentee._id },
  });
  res.status(201).json({ assignment, mentor });
}

export async function reassignMentor(req, res) {
  const body = z.object({ menteeId: z.string(), mentorId: z.string().optional() }).parse(req.body);
  const current = await MentorAssignment.findOne({
    menteeId: body.menteeId,
    institutionId: req.user.institutionId,
    status: ASSIGNMENT_STATUS.ACTIVE,
  });
  if (!current) throw new HttpError(404, 'No active assignment to reassign');
  const previousMentor = await MentorProfile.findById(current.mentorId);
  if (previousMentor && previousMentor.currentLoad > 0) {
    previousMentor.currentLoad -= 1;
    await previousMentor.save();
  }
  current.status = ASSIGNMENT_STATUS.REASSIGNED;
  current.closedAt = new Date();
  await current.save();
  req.body = { menteeId: body.menteeId, mentorId: body.mentorId };
  return assignMentor(req, res);
}

export async function createCheckIn(req, res) {
  const body = z.object({ assignmentId: z.string(), notes: z.string().optional().default('') }).parse(req.body);
  const assignment = await MentorAssignment.findOne({
    _id: body.assignmentId,
    institutionId: req.user.institutionId,
    status: ASSIGNMENT_STATUS.ACTIVE,
  });
  if (!assignment) throw new HttpError(404, 'Assignment not found');
  const mentor = await MentorProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
  if (req.user.role === ROLES.MENTOR && (!mentor || String(mentor._id) !== String(assignment.mentorId))) {
    throw new HttpError(403, 'Mentors may only record check-ins for their own mentees');
  }
  const checkIn = await MentorCheckIn.create({
    institutionId: req.user.institutionId,
    assignmentId: assignment._id,
    mentorId: assignment.mentorId,
    menteeId: assignment.menteeId,
    notes: body.notes,
    createdBy: req.user._id,
  });
  res.status(201).json({ checkIn });
}

export async function escalateToWarden(req, res) {
  const body = z
    .object({ assignmentId: z.string(), reason: z.string().min(3), privateNotes: z.string().optional().default('') })
    .parse(req.body);
  const assignment = await MentorAssignment.findOne({
    _id: body.assignmentId,
    institutionId: req.user.institutionId,
    status: ASSIGNMENT_STATUS.ACTIVE,
  });
  if (!assignment) throw new HttpError(404, 'Assignment not found');
  const escalation = await Escalation.create({
    institutionId: req.user.institutionId,
    assignmentId: assignment._id,
    mentorId: assignment.mentorId,
    menteeId: assignment.menteeId,
    reason: body.reason,
    privateNotes: body.privateNotes,
    createdBy: req.user._id,
  });
  await writeAudit({
    institutionId: req.user.institutionId,
    actorId: req.user._id,
    action: 'MENTOR_ESCALATION',
    resourceType: 'Escalation',
    resourceId: escalation._id,
    metadata: { assignmentId: assignment._id },
  });
  res.status(201).json({ escalation });
}

export async function mentorDashboard(req, res) {
  const institutionId = req.user.institutionId;
  const mentors = await MentorProfile.find({ institutionId }).populate('userId', 'firstName lastName email');
  const assignments = await MentorAssignment.find({ institutionId, status: ASSIGNMENT_STATUS.ACTIVE }).populate(
    'menteeId',
    'rollNumber userId',
  );
  const mine =
    req.user.role === ROLES.MENTOR
      ? mentors.find((m) => String(m.userId?._id || m.userId) === String(req.user._id))
      : null;
  const myAssignments = mine ? assignments.filter((a) => String(a.mentorId) === String(mine._id)) : assignments;
  const coverage = {
    activeMentors: mentors.filter((m) => m.active).length,
    assignedMentees: assignments.length,
    remainingCapacity: mentors.reduce((sum, m) => sum + Math.max(0, m.capacity - m.currentLoad), 0),
  };
  res.json({ mentors, assignments: myAssignments, coverage });
}

export async function listCheckIns(req, res) {
  const query = { institutionId: req.user.institutionId };
  if (req.query.assignmentId) query.assignmentId = req.query.assignmentId;
  if (req.user.role === ROLES.STUDENT) {
    const student = await StudentProfile.findOne({ userId: req.user._id });
    query.menteeId = student?._id;
  }
  const items = await MentorCheckIn.find(query).sort({ createdAt: -1 });
  const sanitized = items.map((item) => {
    const json = item.toObject();
    if (req.user.role === ROLES.STUDENT) {
      delete json.notes;
    }
    return json;
  });
  res.json({ checkIns: sanitized });
}

export async function listEscalations(req, res) {
  const items = await Escalation.find({ institutionId: req.user.institutionId }).sort({ createdAt: -1 });
  res.json({ escalations: items });
}
