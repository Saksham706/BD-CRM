import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis.js";
import { config } from "../config/appConfig.js";

function storeIfRedisAvailable(prefix) {
  if (!redis) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args) => redis.call(...args)
  });
}

export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: storeIfRedisAvailable("rl:general:"),
  message: { success: false, message: "Too many requests. Please try again later." }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: storeIfRedisAvailable("rl:auth:"),
  message: { success: false, message: "Too many authentication attempts. Please try again later." }
});
