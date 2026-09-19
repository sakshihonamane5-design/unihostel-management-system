import mongoose from 'mongoose';
import { NOTICE_SCOPE, ROLES } from '../config/constants.js';

const noticeSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    scope: { type: String, enum: Object.values(NOTICE_SCOPE), required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', default: null },
    roles: [{ type: String, enum: Object.values(ROLES) }],
    important: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    acknowledgements: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Notice = mongoose.model('Notice', noticeSchema);
