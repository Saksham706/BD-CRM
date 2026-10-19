import IORedis from "ioredis";
import { config } from "../config/appConfig.js";
let connection;
export function getQueueConnection() {
  if (!config.redisUrl)
    throw new Error("REDIS_URL is required for queue workers.");
  if (!connection) {
    connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    connection.on("error", (e) =>
      console.error("Queue Redis error:", e.message),
    );
  }
  return connection;
}
export async function closeQueueConnection() {
  if (connection) {
    await connection.quit();
    connection = undefined;
  }
}
