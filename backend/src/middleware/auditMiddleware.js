// Use the writeAudit service explicitly in security-sensitive controllers/services.
// This middleware is intentionally a no-op placeholder for route-level audit extensions.
export function auditMiddleware(_req, _res, next) {
  next();
}
