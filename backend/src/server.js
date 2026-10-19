import http from "node:http";

import {
  config,
  assertProductionConfig,
} from "./config/appConfig.js";

import { connectDatabase } from "./config/database.js";

import {
  connectRedis,
  closeRedis,
} from "./config/redis.js";

async function startServer() {
  try {
    console.log("🚀 Starting Lead Management CRM backend...");

    // Validate environment configuration
    assertProductionConfig();

    // Connect MongoDB first
    console.log("⏳ Connecting to MongoDB...");
    await connectDatabase();

    // Connect Redis second
    console.log("⏳ Connecting to Redis...");
    await connectRedis();

    // Import Express app after successful connections
    const { default: app } = await import("./app.js");

    const server = http.createServer(app);

    server.listen(config.port, () => {
      console.log(
        `✅ CRM API running on port ${config.port}`
      );
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nShutting down CRM backend...");

      server.close();

      await closeRedis();

      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();