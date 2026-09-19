import { z } from 'zod';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITY, COMPLAINT_STATUS, NOTICE_SCOPE, ROLES } from '../config/constants.js';
import { Complaint } from '../models/Complaint.js';
import { Notice } from '../models/Notice.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { HttpError } from '../utils/http.js';

const STATUS_ORDER = [
  COMPLAINT_STATUS.OPEN,
  COMPLAINT_STATUS.ACKNOWLEDGED,
  COMPLAINT_STATUS.IN_PROGRESS,
  COMPLAINT_STATUS.RESOLVED,
  COMPLAINT_STATUS.CLOSED,
];

export async function createComplaint(req, res) {
  const body = z
    .object({
      category: z.enum(COMPLAINT_CATEGORIES),
      priority: z.enum(COMPLAINT_PRIORITY).default('MEDIUM'),
      description: z.string().min(5),
      imageUrl: z.string().url().optional().or(z.literal('')),
      hostelId: z.string().optional(),
    })
    .parse(req.body);
  const student = await StudentProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
  if (!student) throw new HttpError(403, 'Student profile required');
  const complaint = await Complaint.create({
    institutionId: req.user.institutionId,
    studentId: student._id,
    hostelId: body.hostelId || null,
    category: body.category,
    priority: body.priority,
    description: body.description,
    imageUrl: body.imageUrl || '',
    status: COMPLAINT_STATUS.OPEN,
    timeline: [{ status: COMPLAINT_STATUS.OPEN, actorId: req.user._id, note: 'Opened', at: new Date() }],
  });
  res.status(201).json({ complaint });
}

export async function listComplaints(req, res) {
  const query = { institutionId: req.user.institutionId };
  if (req.user.role === ROLES.STUDENT || req.user.role === ROLES.MENTOR) {
    const student = await StudentProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
    query.studentId = student?._id;
  }
  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  const complaints = await Complaint.find(query).sort({ createdAt: -1 });
  res.json({ complaints });
}

export async function updateComplaint(req, res) {
  const body = z
    .object({
      status: z.enum(Object.values(COMPLAINT_STATUS)).optional(),
      assignedTo: z.string().optional().nullable(),
      comment: z.string().optional(),
      resolution: z.string().optional(),
    })
    .parse(req.body);
  const complaint = await Complaint.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!complaint) throw new HttpError(404, 'Complaint not found');
  if (body.status) {
    const current = STATUS_ORDER.indexOf(complaint.status);
    const next = STATUS_ORDER.indexOf(body.status);
    if (next < current) throw new HttpError(400, 'Complaint status cannot move backwards');
    if (next > current + 1) throw new HttpError(400, 'Complaint status must follow the defined workflow');
    complaint.status = body.status;
    complaint.timeline.push({ status: body.status, actorId: req.user._id, note: body.comment || '', at: new Date() });
  }
  if (body.assignedTo !== undefined) complaint.assignedTo = body.assignedTo;
  if (body.resolution) complaint.resolution = body.resolution;
  if (body.comment && !body.status) {
    complaint.comments.push({ authorId: req.user._id, body: body.comment, at: new Date() });
  }
  await complaint.save();
  res.json({ complaint });
}

export async function createNotice(req, res) {
  const body = z
    .object({
      title: z.string().min(3),
      body: z.string().min(3),
      scope: z.enum(Object.values(NOTICE_SCOPE)),
      hostelId: z.string().optional().nullable(),
      roles: z.array(z.enum(Object.values(ROLES))).optional().default([]),
      important: z.boolean().optional().default(false),
      expiresAt: z.coerce.date().optional().nullable(),
    })
    .parse(req.body);
  if (body.scope === NOTICE_SCOPE.HOSTEL && !body.hostelId) {
    throw new HttpError(400, 'Hostel notices require a hostelId');
  }
  const notice = await Notice.create({
    ...body,
    institutionId: req.user.institutionId,
    createdBy: req.user._id,
  });
  res.status(201).json({ notice });
}

export async function listNotices(req, res) {
  const now = new Date();
  const query = {
    institutionId: req.user.institutionId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
  const notices = await Notice.find(query).sort({ important: -1, createdAt: -1 });
  const visible = notices.filter((notice) => {
    if (notice.scope === NOTICE_SCOPE.INSTITUTION) return true;
    if (notice.scope === NOTICE_SCOPE.ROLE) return notice.roles.includes(req.user.role);
    return true;
  });
  res.json({ notices: visible });
}

export async function acknowledgeNotice(req, res) {
  const notice = await Notice.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
  if (!notice) throw new HttpError(404, 'Notice not found');
  const already = notice.acknowledgements.some((a) => String(a.userId) === String(req.user._id));
  if (!already) {
    notice.acknowledgements.push({ userId: req.user._id, at: new Date() });
    await notice.save();
  }
  res.json({ notice });
}
