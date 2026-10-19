import { Queue } from "bullmq";
import { getQueueConnection } from "./queueConnection.js";
let queue;
export function getImportQueue() {
  if (!queue)
    queue = new Queue("crm-imports", {
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
export async function closeImportQueue() {
  if (queue) await queue.close();
  queue = undefined;
}
