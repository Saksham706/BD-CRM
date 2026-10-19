import Lead from "../models/Lead.js";
import FollowUp from "../models/FollowUp.js";
import Activity from "../models/Activity.js";
import { leadScope } from "./leadService.js";

function dateRange(query = {}) {
  const range = {};
  if (query.from && !Number.isNaN(Date.parse(query.from))) range.$gte = new Date(query.from);
  if (query.to && !Number.isNaN(Date.parse(query.to))) range.$lte = new Date(query.to);
  return Object.keys(range).length ? range : null;
}
export async function getDashboardSummary(user, query = {}) {
  const leadFilter = leadScope(user);
  const range = dateRange(query);
  const followupFilter = user.accountType === "admin" ? {} : { ownerId: user._id };
  if (range) { leadFilter.createdAt = range; followupFilter.dueAt = range; }
  const now = new Date();
  const [totalLeads, byStatus, assigned, due, overdue, completed, activities] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.aggregate([{ $match: leadFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Lead.countDocuments({ ...leadScope(user), ownerId: user._id }),
    FollowUp.countDocuments({ ...followupFilter, status: { $in: ["Pending", "Rescheduled"] }, dueAt: { $gte: new Date(now.setHours(0,0,0,0)), $lt: new Date(new Date().setHours(24,0,0,0)) } }),
    FollowUp.countDocuments({ ...followupFilter, status: { $in: ["Pending", "Rescheduled"] }, dueAt: { $lt: new Date() } }),
    FollowUp.countDocuments({ ...followupFilter, status: "Completed", ...(range ? { completedAt: range } : {}) }),
    Activity.countDocuments({ actorId: user._id, ...(range ? { createdAt: range } : {}) })
  ]);
  const statusCounts = Object.fromEntries(byStatus.map(x => [x._id, x.count]));
  return { generatedAt: new Date().toISOString(), range: { from: query.from || null, to: query.to || null }, totals: { leads: totalLeads, currentlyAssigned: assigned, dueFollowUps: due, overdueFollowUps: overdue, completedFollowUps: completed, activitiesRecorded: activities }, leadsByStatus: statusCounts };
}
export async function getAuthorizedLeadRows(user, query = {}) {
  const filter = leadScope(user);
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.ownerId && user.accountType === "admin") filter.ownerId = query.ownerId;
  const range = dateRange(query); if (range) filter.createdAt = range;
  return Lead.find(filter).sort({ createdAt: -1 }).populate("ownerId", "fullName loginId email").populate("createdBy", "fullName loginId").lean();
}
