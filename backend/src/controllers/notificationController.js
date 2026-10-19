import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = { userId: req.user._id };
  if (req.query.unread === "true") filter.readAt = null;
  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, readAt: null }),
  ]);
  return success(res, "Notifications retrieved", {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    unreadCount: unread,
  });
});
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  if (!notification)
    throw new AppError(
      "Notification not found.",
      404,
      "NOTIFICATION_NOT_FOUND",
    );
  return success(res, "Notification marked as read", notification);
});
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return success(res, "Notifications marked as read", {
    modifiedCount: result.modifiedCount,
  });
});
