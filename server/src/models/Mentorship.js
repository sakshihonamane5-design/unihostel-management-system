import mongoose from 'mongoose';
import { ASSIGNMENT_STATUS } from '../config/constants.js';

const mentorProfileSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    capacity: { type: Number, required: true, min: 1, default: 8 },
    currentLoad: { type: Number, required: true, min: 0, default: 0 },
    eligibleHostelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);

const mentorAssignmentSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true, index: true },
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', default: null },
    status: { type: String, enum: Object.values(ASSIGNMENT_STATUS), default: ASSIGNMENT_STATUS.ACTIVE },
    assignedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

mentorAssignmentSchema.index(
  { menteeId: 1 },
  { unique: true, partialFilterExpression: { status: ASSIGNMENT_STATUS.ACTIVE } },
);

export const MentorAssignment = mongoose.model('MentorAssignment', mentorAssignmentSchema);

const mentorCheckInSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorAssignment', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const MentorCheckIn = mongoose.model('MentorCheckIn', mentorCheckInSchema);

const escalationSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorAssignment', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    reason: { type: String, required: true },
    privateNotes: { type: String, default: '' },
    status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'CLOSED'], default: 'OPEN' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Escalation = mongoose.model('Escalation', escalationSchema);
