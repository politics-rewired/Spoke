import { Task } from "pg-compose";

import { r } from "../models";

const getUserIdsForDigest = (frequency: string) => {
  return r
    .knex("notification")
    .whereNull("sent_at")
    .where("user.notification_frequency", frequency)
    .select(["user.id"])
    .join("user", "user_id", "user.id");
};

export const queuePendingNotifications: Task = async (_payload, helpers) => {
  const notificationsToSend = await r
    .knex("notification")
    .whereNull("sent_at")
    .where("notification_frequency", "ALL")
    .select(["notification.id", "email", "subject", "content", "reply_to"])
    .join("user", "user_id", "user.id");

  for (const notification of notificationsToSend) {
    await helpers.addJob("send-notification-email", notification, {
      jobKey: `send-notification-email-${notification.id}`
    });
  }
};

export const queuePeriodicNotifications: Task = async (_payload, helpers) => {
  const usersToNotify = await getUserIdsForDigest("PERIODIC");

  for (const user of usersToNotify) {
    await helpers.addJob("send-notification-digest", user, {
      jobKey: `send-notification-periodic-${user.id}`
    });
  }
};

export const queueDailyNotifications: Task = async (_payload, helpers) => {
  const usersToNotify = await getUserIdsForDigest("DAILY");

  for (const user of usersToNotify) {
    await helpers.addJob("send-notification-digest", user, {
      jobKey: `send-notification-daily-${user.id}`
    });
  }
};
