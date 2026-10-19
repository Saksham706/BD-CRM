import http from "node:http";
import { config, assertProductionConfig } from "./config/appConfig.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis, closeRedis } from "./config/redis.js";

let server;

async function start() {
  assertProductionConfig();
  await connectDatabase();
  await connectRedis();
  // Import after Redis connects so rate-limit middleware can select the Redis store.
  const { default: app } = await import("./app.js");
  server = http.createServer(app);
  server.listen(config.port, () => console.log(`CRM API listening on port ${config.port}`));
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down...`);
  if (server) server.close();
  await closeRedis().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
