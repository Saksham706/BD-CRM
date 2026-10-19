import bcrypt from "bcryptjs";
import { config } from "../config/appConfig.js";

export async function hashPassword(password) {
  return bcrypt.hash(password, config.bcryptRounds);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return "Password must be between 12 and 128 characters.";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, number, and special character.";
  }
  return null;
}
