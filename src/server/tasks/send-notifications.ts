import { Task } from "pg-compose";

import { sendEmail } from "../mail";
import { r } from "../models";

const sendNotifications: Task = async (_payload, _helpers) => {
  const notificationsToSend = await r
    .knex("notification")
    .whereNull("sent_at")
    .join("user", "user_id", "user.id");

  for (const notification of notificationsToSend) {
    try {
      await sendEmail({
        to: notification.email,
        subject: notification.subject,
        text: notification.content,
        replyTo: notification.replyTo
      });

      await r
        .knex("notification")
        .where({ id: notification.id })
        .update({ sent_at: new Date() });
    } catch (e) {
      console.log(e);
      console.log("Failed to send email notification...");
    }
  }
};

export default sendNotifications;
