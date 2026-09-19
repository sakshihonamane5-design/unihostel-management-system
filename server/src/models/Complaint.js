import mongoose from 'mongoose';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITY, COMPLAINT_STATUS } from '../config/constants.js';

const complaintSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', default: null },
    category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
    priority: { type: String, enum: COMPLAINT_PRIORITY, default: 'MEDIUM' },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: Object.values(COMPLAINT_STATUS), default: COMPLAINT_STATUS.OPEN },
    timeline: [
      {
        status: { type: String, required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, default: '' },
        at: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        body: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    resolution: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
