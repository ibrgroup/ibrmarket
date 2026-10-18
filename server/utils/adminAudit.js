import AdminAuditLogModel from '../models/adminAuditLog.model.js';

/**
 * Best-effort audit append (never throws to caller).
 */
export async function appendAdminAudit(actorUserId, action, { entityType = '', entityId = '', metadata = {} } = {}) {
  try {
    if (!actorUserId) return;
    await AdminAuditLogModel.create({
      actorUserId,
      action,
      entityType,
      entityId: String(entityId || ''),
      metadata,
    });
  } catch (e) {
    console.error('[adminAudit] failed to write log', e?.message || e);
  }
}
