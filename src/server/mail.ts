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
  text?: string;
  html?: string;
  replyTo?: string;
}

export const sendEmail = async (options: SendMailOptions) => {
  const { to, subject, text, html, replyTo } = options;

  logger.info(`Sending e-mail to ${to} with subject ${subject}.`);

  const params: nodemailer.SendMailOptions = {
    from: config.EMAIL_FROM,
    to,
    subject
  };

  if (text) {
    params.text = text;
  }

  if (html) {
    params.html = html;
  }

  if (replyTo) {
    params.replyTo = replyTo;
  }

  if (config.isDevelopment) {
    logger.info(`Would send e-mail with params`, { params });
    return null;
  }

  if (!params.text && !params.html) {
    throw new Error("Empty email body!");
  }

  return sender.sendMail(params);
};

export default sendEmail;
