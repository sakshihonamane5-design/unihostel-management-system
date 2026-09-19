import mongoose from 'mongoose';
import { ALLOCATION_STATUS } from '../config/constants.js';

const residencySchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    status: { type: String, enum: ['ACTIVE', 'CHECKED_OUT'], default: 'ACTIVE' },
    checkInAt: { type: Date, default: Date.now },
    checkOutAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

residencySchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } },
);

export const Residency = mongoose.model('Residency', residencySchema);

const allocationSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    residencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Residency', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
    status: { type: String, enum: Object.values(ALLOCATION_STATUS), default: ALLOCATION_STATUS.ACTIVE },
    allocatedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    closeReason: { type: String, default: '' },
  },
  { timestamps: true },
);

allocationSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: ALLOCATION_STATUS.ACTIVE } },
);
allocationSchema.index(
  { bedId: 1 },
  { unique: true, partialFilterExpression: { status: ALLOCATION_STATUS.ACTIVE } },
);

export const Allocation = mongoose.model('Allocation', allocationSchema);
