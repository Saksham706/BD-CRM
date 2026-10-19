import "dotenv/config";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { config } from "../config/appConfig.js";
import { connectDatabase } from "../config/database.js";
import { createNotification } from "../services/notificationService.js";
if (!config.redisUrl) throw new Error("REDIS_URL is required.");
await connectDatabase();
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
const worker = new Worker(
  "crm-notifications",
  async (job) => createNotification(job.data),
  { connection, concurrency: 5 },
);
worker.on("failed", (j, e) =>
  console.error("Notification job failed", j?.id, e.message),
);
console.log("Notification worker running");
const stop = async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
