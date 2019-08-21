import express from "express";
const router = express.Router();

import logger from "../../logger";
import nexmo from "../api/lib/nexmo";

router.post("/nexmo", async (req, res) => {
  try {
    const messageId = await nexmo.handleIncomingMessage(req.body);
    res.send(messageId);
  } catch (ex) {
    logger.error("Error handling incoming nexmo message", ex);
    res.status(500).send(ex.message);
  }
});

router.post("/nexmo-message-report", async (req, res) => {
  try {
    const body = req.body;
    await nexmo.handleDeliveryReport(body);
    res.send("done");
  } catch (ex) {
    logger.error("Error handling incoming nexmo message report", ex);
    res.status(500).send(ex.message);
  }
});

export default router;
