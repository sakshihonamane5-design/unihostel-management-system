import mongoose from 'mongoose';
import { BED_STATUS, ROOM_TYPES } from '../config/constants.js';

const roomSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
    number: { type: String, required: true, trim: true },
    type: { type: String, enum: ROOM_TYPES, required: true },
    capacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

roomSchema.index({ floorId: 1, number: 1 }, { unique: true });

export const Room = mongoose.model('Room', roomSchema);

const bedSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    code: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(BED_STATUS), default: BED_STATUS.AVAILABLE },
    occupantId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', default: null },
  },
  { timestamps: true },
);

bedSchema.index({ roomId: 1, code: 1 }, { unique: true });
bedSchema.index(
  { occupantId: 1 },
  { unique: true, partialFilterExpression: { occupantId: { $type: 'objectId' } } },
);

export const Bed = mongoose.model('Bed', bedSchema);
