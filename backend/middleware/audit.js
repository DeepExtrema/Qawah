const AuditLog = require("../models/AuditLog");

async function writeAudit(req, { action, entity, entityId, meta } = {}) {
  try {
    await AuditLog.create({
      actorId: req.user?.userId || null,
      action: action || req.method,
      entity: entity || "unknown",
      entityId: entityId ? String(entityId) : "",
      meta: meta || {},
    });
  } catch (error) {
    console.error("[audit]", error.message);
  }
}

function audit(action, entity) {
  return async function auditMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function patchedJson(body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId =
          (body && (body.product?._id || body.order?._id || body.data?._id || body.data?.id)) ||
          req.params.id;
        writeAudit(req, {
          action,
          entity,
          entityId,
          meta: { path: req.originalUrl, method: req.method },
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { writeAudit, audit };
