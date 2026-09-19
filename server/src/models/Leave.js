import mongoose from 'mongoose';
import { LEAVE_STATUS, MOVEMENT_TYPE } from '../config/constants.js';

const leaveRequestSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    destination: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    departureDate: { type: Date, required: true },
    expectedReturnDate: { type: Date, required: true },
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: { type: String, enum: Object.values(LEAVE_STATUS), default: LEAVE_STATUS.PENDING },
    approvalHistory: [
      {
        action: { type: String, required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, default: '' },
        at: { type: Date, default: Date.now },
      },
    ],
    actualDeparture: { type: Date, default: null },
    actualReturn: { type: Date, default: null },
    lateReturn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

const gatePassSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', default: null },
    tokenHash: { type: String, required: true, unique: true },
    publicCode: { type: String, required: true, unique: true },
    qrPayload: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED', 'REVOKED'], default: 'ACTIVE' },
  },
  { timestamps: true },
);

export const GatePass = mongoose.model('GatePass', gatePassSchema);

const movementSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    type: { type: String, enum: Object.values(MOVEMENT_TYPE), required: true },
    gatePassId: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

movementSchema.index({ institutionId: 1, studentId: 1, occurredAt: -1 });

export const Movement = mongoose.model('Movement', movementSchema);
