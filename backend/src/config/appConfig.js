import dotenv from "dotenv";
dotenv.config();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",").map((v) => v.trim()).filter(Boolean),
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lead_management_crm",
  redisUrl: process.env.REDIS_URL || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  accessCookieName: process.env.ACCESS_COOKIE_NAME || "crm_access",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || "crm_refresh",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",
  appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || "",
  appsScriptSecret: process.env.GOOGLE_APPS_SCRIPT_SECRET || "",
  emailFromName: process.env.EMAIL_FROM_NAME || "Lead Management CRM",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || "",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  verificationMinutes: Number(process.env.EMAIL_VERIFICATION_TOKEN_MINUTES || 30),
  resetMinutes: Number(process.env.PASSWORD_RESET_TOKEN_MINUTES || 15),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100)
};

export function assertProductionConfig() {
  if (config.nodeEnv !== "production") return;
  if (config.jwtAccessSecret.length < 32) throw new Error("JWT_ACCESS_SECRET must be at least 32 characters in production.");
  if (!config.cookieSecure) throw new Error("COOKIE_SECURE must be true in production.");
  if (!config.appsScriptUrl || !config.appsScriptSecret) {
    console.warn("Google Apps Script email is not configured; email delivery will be unavailable.");
  }
}
