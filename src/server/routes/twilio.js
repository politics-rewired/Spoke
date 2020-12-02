import express from "express";
import { TwimlResponse } from "twilio";

import logger from "../../logger";
import twilio from "../api/lib/twilio";

const router = express.Router();

const headerValidator = twilio.headerValidator();

router.post("/twilio", headerValidator, async (req, res) => {
  try {
    await twilio.handleIncomingMessage(req.body);
    const resp = new TwimlResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(resp.toString());
  } catch (ex) {
    logger.error("Error handling incoming twilio message: ", ex);
    res.status(500).send(ex.message);
  }
});

router.post("/twilio-message-report", headerValidator, async (req, res) => {
  try {
    await twilio.handleDeliveryReport(req.body);
    const resp = new TwimlResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    return res.end(resp.toString());
  } catch (exc) {
    logger.error("Error handling twilio message report: ", exc);
    res.status(500).send(exc.message);
  }
});

export default router;
