import express from "express";

import logger from "../../logger";
import nexmo from "../api/lib/nexmo";

const router = express.Router();

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
    const { body } = req;
    await nexmo.handleDeliveryReport(body);
    res.send("done");
  } catch (ex) {
    logger.error("Error handling incoming nexmo message report", ex);
    res.status(500).send(ex.message);
  }
});

export default router;
