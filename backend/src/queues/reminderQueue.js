import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config/appConfig.js";
let connection;
let reminderQueue;
export function getReminderQueue() {
  if (!config.redisUrl) return null;
  if (!reminderQueue) {
    connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: true });
    connection.on("error", (error) => console.error("Reminder queue Redis error:", error.message));
    reminderQueue = new Queue("crm-followup-reminders", { connection, defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 30000 }, removeOnComplete: 1000, removeOnFail: 5000 } });
  }
  return reminderQueue;
}
export async function closeReminderQueue() {
  if (reminderQueue) await reminderQueue.close();
  if (connection) await connection.quit();
  reminderQueue = undefined; connection = undefined;
}
