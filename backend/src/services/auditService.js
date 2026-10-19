import AuditLog from "../models/AuditLog.js";

export async function writeAudit(req, { action, targetType, targetId = null, metadata = {} }) {
  try {
    await AuditLog.create({
      actorId: req?.user?._id || null,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      metadata,
      ipAddress: req?.ip || "",
      userAgent: req?.get?.("user-agent") || ""
    });
  } catch (error) {
    // Do not silently swallow audit failure for security-critical actions in production.
    console.error("Audit log write failed:", error.message);
    if (process.env.NODE_ENV === "production") throw error;
  }
}
