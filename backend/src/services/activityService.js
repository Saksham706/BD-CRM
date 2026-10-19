import LeadActivity from "../models/LeadActivity.js";
export function recordActivity({
  leadId,
  actorId,
  eventType,
  summary,
  payload = {},
}) {
  return LeadActivity.create({ leadId, actorId, eventType, summary, payload });
}
