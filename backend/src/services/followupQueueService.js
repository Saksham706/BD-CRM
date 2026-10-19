import { getReminderQueue } from "../queues/reminderQueue.js";

/**
 * Schedule follow-up reminder jobs in BullMQ.
 */
export async function scheduleFollowupReminders(followup) {
  const queue = getReminderQueue();

  if (!queue) {
    return [];
  }

  const ids = [];

  const reminderMinutes = followup.reminderMinutes || [0];

  for (const minutes of reminderMinutes) {
    const delay = Math.max(
      0,
      new Date(followup.dueAt).getTime() -
        Number(minutes) * 60_000 -
        Date.now(),
    );

    const jobId = `followup-${followup._id}-reminder-${minutes}`;

    await queue.add(
      "send-followup-reminder",
      {
        followupId: String(followup._id),
        reminderMinutes: Number(minutes),
      },
      {
        jobId,
        delay,
      },
    );

    ids.push(jobId);
  }

  followup.reminderJobIds = ids;

  await followup.save();

  return ids;
}

/**
 * Cancel previously scheduled follow-up reminders.
 */
export async function cancelFollowupReminders(followup) {
  const queue = getReminderQueue();

  if (!queue) {
    return;
  }

  for (const id of followup.reminderJobIds || []) {
    const job = await queue.getJob(id);

    if (job) {
      await job.remove().catch(() => {});
    }
  }

  followup.reminderJobIds = [];
}
