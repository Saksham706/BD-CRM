import { Queue } from "bullmq";
import { getQueueConnection } from "./queueConnection.js";
let queue;
export function getEmailQueue() {
  if (!queue)
    queue = new Queue("crm-email", {
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
export async function closeEmailQueue() {
  if (queue) await queue.close();
  queue = undefined;
}
