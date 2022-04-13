import groupBy from "lodash/groupBy";
import { Task } from "pg-compose";

import logger from "../../logger";
import getDigestContent from "../lib/templates/digest";
import getNotificationContent from "../lib/templates/notification";
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
      "category"
    ])
    .join("user", "user_id", "user.id");

  return groupBy(notifications, "organization_id");
};

export const sendNotificationEmail: Task = async (payload, _helpers) => {
  const { email } = payload;
  const { subject, content } = await getNotificationContent(payload);

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

      trx.commit();
    } catch (err) {
      logger.error("Failed to send email notification...", errToObj(err));
      trx.rollback();
    }
  });
};

export const sendNotificationDigest: Task = async (payload, _helpers) => {
  const notificationsGrouped = await notificationsByOrg(payload.id);

  for (const [organizationId, notifications] of Object.entries(
    notificationsGrouped
  )) {
    const { email } = notifications[0];
    const { subject, content } = await getDigestContent(
      organizationId,
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
        trx.commit();
      } catch (err) {
        logger.error("Failed to send email notification...", errToObj(err));
        trx.rollback();
      }
    });
  }
};
