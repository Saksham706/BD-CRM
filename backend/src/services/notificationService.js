import Notification from "../models/Notification.js";
import { emitToUser } from "../sockets/socketServer.js";
export async function createNotification({ userId, type, title, message, link = "", entityType = "", entityId = "", dedupeKey = null }) {
  if (!userId) return null;
  let notification;
  try {
    notification = await Notification.create({ userId, type, title, message, link, entityType, entityId: String(entityId || ""), dedupeKey });
  } catch (error) {
    if (error.code === 11000 && dedupeKey) return Notification.findOne({ dedupeKey });
    throw error;
  }
  emitToUser(userId, "notification.created", { notification: notification.toObject() });
  return notification;
}
