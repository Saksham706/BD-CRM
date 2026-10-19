import "dotenv/config";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import mongoose from "mongoose";
import { config } from "../config/appConfig.js";
import { connectDatabase } from "../config/database.js";
import FollowUp from "../models/FollowUp.js";
import Lead from "../models/Lead.js";
import { createNotification } from "../services/notificationService.js";

if (!config.redisUrl)
  throw new Error("REDIS_URL is required to run the reminder worker.");
await connectDatabase();
const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
connection.on("error", (error) =>
  console.error("Worker Redis error:", error.message),
);
const worker = new Worker(
  "crm-followup-reminders",
  async (job) => {
    if (job.name !== "send-followup-reminder") return;
    const followup = await FollowUp.findById(job.data.followupId);
    if (!followup || !["Pending", "Rescheduled"].includes(followup.status))
      return { skipped: true, reason: "follow-up no longer active" };
    const lead = await Lead.findById(followup.leadId).select(
      "leadCode displayName archivedAt",
    );
    if (!lead || lead.archivedAt)
      return { skipped: true, reason: "lead unavailable" };
    const mins = Number(job.data.reminderMinutes) || 0;
    const label =
      mins === 0
        ? "is due now"
        : `is due in ${mins} minute${mins === 1 ? "" : "s"}`;
    await createNotification({
      userId: followup.ownerId,
      type: "followup.reminder",
      title: "Follow-up reminder",
      message: `Follow-up for ${lead.displayName} (${lead.leadCode}) ${label}.`,
      link: `/follow-ups?leadId=${lead._id}`,
      entityType: "FollowUp",
      entityId: followup._id,
      dedupeKey: `followup:${followup._id}:reminder:${mins}:${new Date(followup.dueAt).getTime()}`,
    });
    return { notified: true, followupId: String(followup._id) };
  },
  { connection, concurrency: 5 },
);
worker.on("completed", (job) =>
  console.log(`Reminder job ${job.id} completed`),
);
worker.on("failed", (job, error) =>
  console.error(`Reminder job ${job?.id} failed:`, error.message),
);
console.log("CRM follow-up reminder worker is running.");
async function shutdown() {
  await worker.close();
  await connection.quit();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
