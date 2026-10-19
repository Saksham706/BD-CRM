import http from "node:http";
import { config, assertProductionConfig } from "./config/appConfig.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis, closeRedis } from "./config/redis.js";
import { initSocketServer } from "./config/socket.js";
import { closeReminderQueue } from "./queues/reminderQueue.js";

let server;
let io;
let isShuttingDown = false;

async function startServer() {

  assertProductionConfig();
  console.log("Starting Lead Management CRM backend...");
  console.log("Connecting to MongoDB...");
  await connectDatabase();
  console.log("Connecting to Redis...");
  await connectRedis();
  const { default: app } = await import("./app.js");
  server = http.createServer(app);
  io = initSocketServer(server);
  await new Promise((resolve, reject) => {
    server.once("error", reject);

    server.listen(config.port, () => {
      server.removeListener("error", reject);

      console.log(`CRM API listening on port ${config.port}`);

      console.log(`Environment: ${config.nodeEnv}`);

      resolve();
    });
  });

  console.log("Socket.IO initialized successfully.");
}
async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down CRM backend...`);

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    if (io) {
      await new Promise((resolve) => {
        io.close(resolve);
      });
    }

    await closeReminderQueue().catch((error) => {
      console.error("Error closing reminder queue:", error.message);
    });

    await closeRedis().catch((error) => {
      console.error("Error closing Redis:", error.message);
    });

    console.log("CRM backend shut down successfully.");

    process.exitCode = 0;
  } catch (error) {
    console.error("Error during server shutdown:", error);

    process.exitCode = 1;
  }
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

startServer().catch(async (error) => {
  console.error("Failed to start CRM backend:", error);

  await closeRedis().catch(() => {});

  process.exitCode = 1;
});
