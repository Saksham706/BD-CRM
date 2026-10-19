import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../src/models/User.js";
import UserPermission from "../src/models/UserPermission.js";
import { connectDatabase } from "../src/config/database.js";
import { hashPassword, validatePasswordStrength } from "../src/utils/passwordUtils.js";
import { seedPermissionDefinitions } from "../src/services/permissionService.js";

try {
  await connectDatabase();
  await seedPermissionDefinitions();

  const loginId = process.env.INITIAL_ADMIN_LOGIN_ID?.trim().toLowerCase();
  const fullName = process.env.INITIAL_ADMIN_NAME?.trim() || "Super Admin";
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!loginId || !email || !password) {
    throw new Error("Set INITIAL_ADMIN_LOGIN_ID, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD before running this script.");
  }
  const strengthError = validatePasswordStrength(password);
  if (strengthError) throw new Error(strengthError);

  const existing = await User.findOne({ $or: [{ loginId }, { email }] });
  if (existing) {
    if (existing.accountType !== "admin") throw new Error("The supplied Login ID/email already belongs to a non-admin account.");
    console.log("An Admin account already exists for these credentials; no changes made.");
  } else {
    const admin = await User.create({
      fullName, loginId, email,
      passwordHash: await hashPassword(password),
      accountType: "admin",
      emailVerifiedAt: new Date(),
      approvalStatus: "approved",
      approvedAt: new Date(),
      accountStatus: "active"
    });
    await UserPermission.create({ userId: admin._id, permissions: [], updatedBy: admin._id });
    console.log(`Initial Admin created: ${loginId}. Remove INITIAL_ADMIN_PASSWORD from the environment after setup.`);
  }
} catch (error) {
  console.error("Admin bootstrap failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
