import { Task } from "pg-compose";

import { r } from "../models";

const queuePendingNotifications: Task = async (_payload, helpers) => {
  const notificationsToSend = await r
    .knex("notification")
    .whereNull("sent_at")
    .select(["notification.id", "email", "subject", "content", "reply_to"])
    .join("user", "user_id", "user.id");

  for (const notification of notificationsToSend) {
    await helpers.addJob("send-notification-email", notification, {
      jobKey: `send-notification-email-${notification.id}`
    });
  }
};

export default queuePendingNotifications;
