import express from "express";
const router = express.Router();
import googleLibPhoneNumber from "google-libphonenumber";

import { config } from "../../config";
import { r } from "../models";

const phoneUtil = googleLibPhoneNumber.PhoneNumberUtil.getInstance();
const PNF = googleLibPhoneNumber.PhoneNumberFormat;

function normalize(rawNumber) {
  const number = phoneUtil.parseAndKeepRawInput(rawNumber, "US");
  return phoneUtil.format(number, PNF.E164);
}

router.post("/remove-number-from-campaign", async (req, res) => {
  if (!req.query.secret || req.query.secret !== config.CONTACT_REMOVAL_SECRET)
    return res.sendStatus(403);

  logger.info(`Removing user matching ${JSON.stringify(req.body)}`);
  const phone = req.body.phone;

  if (!phone) {
    return res.status(400).json({ error: "Missing `phone` in request body" });
  }
  const normalizedPhone = normalize(phone);
  await r
    .knex("campaign_contact")
    .where({ cell: normalizedPhone, message_status: "needsMessage" })
    .del();
  return res.sendStatus(200);
});

export default router;
