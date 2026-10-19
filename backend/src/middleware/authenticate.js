import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/appConfig.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[config.accessCookieName];
  if (!token) throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");

  let payload;
  try {
    payload = jwt.verify(token, config.jwtAccessSecret, {
      issuer: "lead-management-crm",
      audience: "crm-client"
    });
  } catch {
    throw new AppError("Session expired or invalid. Please log in again.", 401, "INVALID_SESSION");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.accountStatus !== "active") throw new AppError("Account is inactive or unavailable.", 401, "ACCOUNT_UNAVAILABLE");
  req.user = user;
  next();
});
