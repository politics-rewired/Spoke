import { Task } from "pg-compose";

import { NotificationFrequencyType } from "../../api/user";
import { r } from "../models";

const getUserIdsForDigest = (frequency: NotificationFrequencyType) => {
  return r
    .knex("notification")
    .whereNull("sent_at")
    .where("user.notification_frequency", frequency)
    .distinct("user.id")
    .join("user", "user_id", "user.id");
};

export const queuePendingNotifications: Task = async (_payload, helpers) => {
  const notificationsToSend = await r
    .knex("notification")
    .whereNull("sent_at")
    .where("notification_frequency", "ALL")
    .select([
      "notification.id",
      "user_id",
      "email",
      "organization_id",
      "campaign_id",
      "category"
    ])
    .join("user", "user_id", "user.id");

  for (const notification of notificationsToSend) {
    await helpers.addJob("send-notification-email", notification, {
      jobKey: `send-notification-email-${notification.id}`
    });
  }
};

export const queuePeriodicNotifications: Task = async (_payload, helpers) => {
  const usersToNotify = await getUserIdsForDigest(
    NotificationFrequencyType.Periodic
  );

  for (const user of usersToNotify) {
    await helpers.addJob("send-notification-digest", user, {
      jobKey: `send-notification-periodic-${user.id}`
    });
  }
};

export const queueDailyNotifications: Task = async (_payload, helpers) => {
  const usersToNotify = await getUserIdsForDigest(
    NotificationFrequencyType.Daily
  );

  for (const user of usersToNotify) {
    await helpers.addJob("send-notification-digest", user, {
      jobKey: `send-notification-daily-${user.id}`
    });
  }
};
