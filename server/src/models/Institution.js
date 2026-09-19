import mongoose from 'mongoose';
import { INSTITUTION_STATUS } from '../config/constants.js';

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    allowedEmailDomains: { type: [String], required: true, default: [] },
    logoUrl: { type: String, default: '' },
    loginBannerUrl: { type: String, default: '' },
    primaryColour: { type: String, default: '#2563EB' },
    accentColour: { type: String, default: '#0F766E' },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    supportPhone: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(INSTITUTION_STATUS), default: INSTITUTION_STATUS.ACTIVE },
  },
  { timestamps: true },
);

export const Institution = mongoose.model('Institution', institutionSchema);
