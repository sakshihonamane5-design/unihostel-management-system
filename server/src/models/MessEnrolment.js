import mongoose from 'mongoose';
import { MESS_STATUS } from '../config/constants.js';

const messEnrolmentSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    status: { type: String, enum: Object.values(MESS_STATUS), default: MESS_STATUS.ENROLLED },
    messName: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
  },
  { timestamps: true },
);

messEnrolmentSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: MESS_STATUS.ENROLLED } },
);

export const MessEnrolment = mongoose.model('MessEnrolment', messEnrolmentSchema);
