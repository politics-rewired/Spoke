import nodemailer from "nodemailer";

import { config } from "../config";
import logger from "../logger";

const sender = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_HOST_PORT,
  secure: config.EMAIL_HOST_SECURE,
  auth: {
    user: config.EMAIL_HOST_USER,
    pass: config.EMAIL_HOST_PASSWORD
  }
});

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export const sendEmail = async (options: SendMailOptions) => {
  const { to, subject, text, replyTo } = options;

  if (config.isDevelopment) {
    logger.info(`Would send e-mail with subject ${subject} and text ${text}.`);
    return null;
  }

  logger.info(`Sending e-mail to ${to} with subject ${subject}.`);

  const params: nodemailer.SendMailOptions = {
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

export default sendEmail;
