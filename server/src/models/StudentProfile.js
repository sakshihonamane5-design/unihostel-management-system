import mongoose from 'mongoose';
import { PRESENCE_STATUS, RESIDENCY_STATUS } from '../config/constants.js';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const studentProfileSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rollNumber: { type: String, required: true, trim: true },
    programme: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    emergencyContact: { type: emergencyContactSchema, required: true },
    residencyStatus: {
      type: String,
      enum: Object.values(RESIDENCY_STATUS),
      default: RESIDENCY_STATUS.NOT_ALLOCATED,
    },
    presenceStatus: {
      type: String,
      enum: Object.values(PRESENCE_STATUS),
      default: PRESENCE_STATUS.UNKNOWN,
    },
    accessibilityRequirement: { type: String, default: '' },
    allergyNote: { type: String, default: '' },
    allergyConsented: { type: Boolean, default: false },
  },
  { timestamps: true },
);

studentProfileSchema.index({ institutionId: 1, rollNumber: 1 }, { unique: true });

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
