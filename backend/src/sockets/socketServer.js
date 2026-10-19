import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/appConfig.js";
import { getUserPermissionKeys } from "../services/permissionService.js";

let io;
export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.allowedOrigins, credentials: true },
    transports: ["websocket", "polling"]
  });
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = Object.fromEntries(cookieHeader.split(";").map((part) => part.trim()).filter(Boolean).map((part) => { const i = part.indexOf("="); return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))]; }));
      const token = socket.handshake.auth?.token || cookies[config.accessCookieName];
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, config.jwtAccessSecret, { issuer: "lead-management-crm", audience: "crm-client" });
      const user = await User.findById(payload.sub);
      if (!user || user.accountStatus !== "active" || !user.emailVerifiedAt || user.approvalStatus !== "approved") return next(new Error("Account unavailable"));
      socket.data.user = { id: String(user._id), accountType: user.accountType };
      socket.data.permissions = await getUserPermissionKeys(user);
      next();
    } catch { next(new Error("Invalid or expired session")); }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);
    socket.on("subscribe:lead", async (leadId, ack) => {
      // Lead rooms are intentionally not joined client-side; sensitive events are sent to user rooms only.
      if (typeof ack === "function") ack({ ok: false, message: "Lead room subscriptions are not available; use authorized REST endpoints." });
    });
  });
  return io;
}
export function getIO() { return io; }
export function emitToUser(userId, event, payload) { io?.to(`user:${String(userId)}`).emit(event, payload); }
export function emitToUsers(userIds, event, payload) { for (const id of new Set((userIds || []).filter(Boolean).map(String))) emitToUser(id, event, payload); }
