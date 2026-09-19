import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true },
);

hostelSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export const Hostel = mongoose.model('Hostel', hostelSchema);

const blockSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

blockSchema.index({ hostelId: 1, code: 1 }, { unique: true });

export const Block = mongoose.model('Block', blockSchema);

const floorSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true, index: true },
    number: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

floorSchema.index({ blockId: 1, number: 1 }, { unique: true });

export const Floor = mongoose.model('Floor', floorSchema);
