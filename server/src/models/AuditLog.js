import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

auditLogSchema.index({ institutionId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const SENSITIVE_KEYS = /password|token|secret|cookie|authorization|hash/i;

export function sanitizeMetadata(metadata = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

export async function writeAudit({ institutionId, actorId, action, resourceType, resourceId, metadata }) {
  await AuditLog.create({
    institutionId,
    actorId,
    action,
    resourceType,
    resourceId: String(resourceId),
    metadata: sanitizeMetadata(metadata),
  });
}
