import Redis from "ioredis";
import { config } from "./appConfig.js";

export let redis = null;

export async function connectRedis() {
  if (!config.redisUrl) {
    if (config.nodeEnv === "production") throw new Error("REDIS_URL is required in production.");
    console.warn("REDIS_URL not set; Redis-backed features will be unavailable in development.");
    return null;
  }
  redis = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true
  });
  redis.on("error", (error) => console.error("Redis error:", error.message));
  await redis.connect();
  console.log("Redis connected");
  return redis;
}

export async function closeRedis() {
  if (redis) await redis.quit();
}
