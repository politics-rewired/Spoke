import { Task } from "pg-compose";

import logger from "../../logger";
import getDigest from "../lib/templates/digest";
import { sendEmail } from "../mail";
import { r } from "../models";
import { errToObj } from "../utils";

const createDigest = async (userId: number) => {
  const notifications = await r
    .knex("notification")
    .where({ user_id: userId })
    .whereNull("sent_at")
    .select(["notification.id", "email", "subject", "content", "reply_to"])
    .join("user", "user_id", "user.id");

  const html = getDigest(notifications);

  return {
    html,
    notifications
  };
};

export const sendNotificationEmail: Task = async (payload, _helpers) => {
  try {
    const { email, subject, content, replyTo } = payload;
    await sendEmail({
      to: email,
      subject,
      text: content,
      replyTo
    });

    await r
      .knex("notification")
      .where({ id: payload.id })
      .update({ sent_at: new Date() });
  } catch (err) {
    logger.error("Failed to send email notification...", errToObj(err));
  }
};

export const sendNotificationDigest: Task = async (payload, _helpers) => {
  try {
    const { html, notifications } = await createDigest(payload.id);
    const { email } = notifications[0];

    await sendEmail({
      to: email,
      subject: "Notification Digest",
      html
    });

    await r
      .knex("notification")
      .whereIn(
        "id",
        notifications.map((n) => n.id)
      )
      .update({ sent_at: new Date() });
  } catch (err) {
    logger.error("Failed to send email notification...", errToObj(err));
  }
};
