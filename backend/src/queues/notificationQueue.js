import { Queue } from "bullmq";
import { getQueueConnection } from "./queueConnection.js";
let queue;
export function getNotificationQueue() {
  if (!queue)
    queue = new Queue("crm-notifications", {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    });
  return queue;
}
export async function closeNotificationQueue() {
  if (queue) await queue.close();
  queue = undefined;
}
