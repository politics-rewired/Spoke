import groupBy from "lodash/groupBy";
import { Task } from "pg-compose";

import logger from "../../logger";
import {
  getDigestNotificationContent,
  getSingleNotificationContent
} from "../api/notification";
import { sendEmail } from "../mail";
import { r } from "../models";
import { errToObj } from "../utils";

const notificationsByOrg = async (userId: number) => {
  const notifications = await r
    .knex("notification")
    .where({ user_id: userId })
    .whereNull("sent_at")
    .select([
      "notification.id",
      "user_id",
      "email",
      "organization_id",
      "campaign_id",
      "notification_type"
    ])
    .join("user", "user_id", "user.id");

  return groupBy(notifications, "organization_id");
};

export const sendNotificationEmail: Task = async (payload, _helpers) => {
  const { email } = payload;
  const { subject, content } = await getSingleNotificationContent(payload);

  await r.knex.transaction(async (trx) => {
    await trx("notification")
      .where({ id: payload.id })
      .update({ sent_at: new Date() });

    try {
      await sendEmail({
        to: email,
        subject,
        html: content
      });
    } catch (err) {
      logger.error("Failed to send email notification...", errToObj(err));
      throw err;
    }
  });
};

export const sendNotificationDigestForUser: Task = async (
  payload,
  _helpers
) => {
  const notificationsGrouped = await notificationsByOrg(payload.id);

  for (const [organizationId, notifications] of Object.entries(
    notificationsGrouped
  )) {
    const { email } = notifications[0];
    const { subject, content } = await getDigestNotificationContent(
      organizationId,
      payload.id,
      notifications
    );

    await r.knex.transaction(async (trx) => {
      await trx("notification")
        .whereIn(
          "id",
          notifications.map((n) => n.id)
        )
        .update({ sent_at: new Date() });

      try {
        await sendEmail({
          to: email,
          subject,
          html: content
        });
      } catch (err) {
        logger.error("Failed to send email notification...", errToObj(err));
        throw err;
      }
    });
  }
};
