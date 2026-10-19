import { config } from "../config/appConfig.js";
import AppError from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function originProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  // Requests without Origin are allowed for server-to-server clients; browser requests with Origin must be allow-listed.
  if (origin && !config.allowedOrigins.includes(origin)) {
    return next(new AppError("Request origin is not allowed.", 403, "ORIGIN_NOT_ALLOWED"));
  }
  next();
}
