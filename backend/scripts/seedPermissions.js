import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { seedPermissionDefinitions } from "../src/services/permissionService.js";

try {
  await connectDatabase();
  await seedPermissionDefinitions();
  console.log("Permission catalog seeded.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
