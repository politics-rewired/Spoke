import { Task } from "pg-compose";

import logger from "../../logger";
import { sendEmail } from "../mail";
import { r } from "../models";
import { errToObj } from "../utils";

const sendNotificationEmail: Task = async (payload, _helpers) => {
  try {
    const { email, subject, text, replyTo } = payload;
    await sendEmail({
      to: email,
      subject,
      text,
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

export default sendNotificationEmail;
