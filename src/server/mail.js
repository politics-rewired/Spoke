import mailgunConstructor from "mailgun-js";
import nodemailer from "nodemailer";

import { config } from "../config";
import logger from "../logger";

const mailgun =
  config.MAILGUN_API_KEY &&
  config.MAILGUN_DOMAIN &&
  mailgunConstructor({
    apiKey: config.MAILGUN_API_KEY,
    domain: config.MAILGUN_DOMAIN
  });

const sender =
  config.MAILGUN_API_KEY && config.MAILGUN_DOMAIN
    ? {
        sendMail: ({ from, to, subject, replyTo, text }) =>
          mailgun.messages().send({
            from,
            "h:Reply-To": replyTo,
            to,
            subject,
            text
          })
      }
    : nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: config.EMAIL_HOST_PORT,
        secure: config.EMAIL_HOST_SECURE,
        auth: {
          user: config.EMAIL_HOST_USER,
          pass: config.EMAIL_HOST_PASSWORD
        }
      });

export const sendEmail = async ({ to, subject, text, replyTo }) => {
  if (config.isDevelopment) {
    logger.info(`Would send e-mail with subject ${subject} and text ${text}.`);
    return null;
  }

  logger.info(`Sending e-mail to ${to} with subject ${subject}.`);

  const params = {
    from: config.EMAIL_FROM,
    to,
    subject,
    text
  };

  if (replyTo) {
    params.replyTo = replyTo;
  }

  return sender.sendMail(params);
};
