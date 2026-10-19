import "dotenv/config";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { config } from "../config/appConfig.js";
import { connectDatabase } from "../config/database.js";
if (!config.redisUrl) throw new Error("REDIS_URL is required.");
await connectDatabase();
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
const worker = new Worker(
  "crm-imports",
  async (job) => {
    throw new Error(
      `Import job ${job.id} has no registered handler. Use POST /api/v1/imports/csv for the synchronous import API in this release.`,
    );
  },
  { connection, concurrency: 1 },
);
worker.on("failed", (j, e) =>
  console.error("Import worker job failed", j?.id, e.message),
);
console.log(
  "Import worker running (CSV endpoint is synchronous in this release)",
);
const stop = async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
