import "dotenv/config";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { config } from "../config/appConfig.js";
import { sendViaAppsScript } from "../integrations/googleAppsScript/appsScriptClient.js";
if (!config.redisUrl) throw new Error("REDIS_URL is required.");
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
const worker = new Worker(
  "crm-email",
  async (job) => sendViaAppsScript(job.data),
  { connection, concurrency: 3 },
);
worker.on("failed", (j, e) =>
  console.error("Email job failed", j?.id, e.message),
);
console.log("Email worker running");
const stop = async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
