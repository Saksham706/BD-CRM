import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config/appConfig.js";

import { generalLimiter } from "./middleware/rateLimiter.js";
import { originProtection } from "./middleware/originProtection.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Authentication and user management
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";

// Lead management
import leadRoutes from "./routes/leadRoutes.js";
import leadSourceRoutes from "./routes/leadSourceRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import leadFieldRoutes from "./routes/leadFieldRoutes.js";

// Follow-ups and notifications
import followUpRoutes from "./routes/followUpRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Dashboard, reports, imports, and auditing
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

const app = express();

// Hide Express technology information.
app.disable("x-powered-by");

// Configure proxy trust only when explicitly enabled.
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

// Security headers.
app.use(helmet());

// CORS configuration.
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-to-server
      // requests and certain development tools.
      if (!origin || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "X-Requested-With"],
  }),
);

// Parse incoming request bodies.
app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  }),
);

// Parse cookies used by authentication.
app.use(cookieParser());

// Apply origin/CSRF protection middleware.
app.use(originProtection);

// Apply general API rate limiting.
app.use("/api/v1", generalLimiter);

// Health-check endpoint.
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "lead-management-crm-api",
  });
});

// Authentication routes.
app.use("/api/v1/auth", authRoutes);

// Admin and user management.
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/permissions", permissionRoutes);

// Lead management routes.
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/lead-sources", leadSourceRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/lead-fields", leadFieldRoutes);

// Follow-ups and notifications.
app.use("/api/v1/follow-ups", followUpRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Dashboard and reporting.
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportRoutes);

// Import and audit routes.
app.use("/api/v1/imports", importRoutes);
app.use("/api/v1/audit-logs", auditRoutes);

// Handle unknown routes.
app.use(notFound);

// Centralized error handler.
// Keep this after all routes and the not-found middleware.
app.use(errorHandler);

export default app;
