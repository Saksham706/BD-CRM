import mongoose from "mongoose";
import { config } from "./appConfig.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri, { autoIndex: config.nodeEnv !== "production" });
  console.log("MongoDB connected");
}
