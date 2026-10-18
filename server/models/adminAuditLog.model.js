import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ actorUserId: 1, createdAt: -1 });

const AdminAuditLogModel = mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLogModel;
