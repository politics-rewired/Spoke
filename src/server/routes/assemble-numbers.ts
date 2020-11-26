import express from "express";

import logger from "../../logger";
import assembleNumbers from "../api/lib/assemble-numbers";
import { errToObj } from "../utils";

const router = express.Router();

router.post(
  "/assemble-numbers",
  // TODO: reenable header validation once Numbers moves to bcrypt
  // assembleNumbers.inboundMessageValidator(),
  async (req, res) => {
    try {
      await assembleNumbers.handleIncomingMessage(req.body);
      return res.status(200).send({ success: true });
    } catch (err) {
      logger.error("Error handling incoming assemble numbers message: ", {
        ...errToObj(err),
        body: req.body
      });
      res.status(500).send({ error: err.message });
    }
  }
);

router.post(
  "/assemble-numbers-message-report",
  // TODO: reenable header validation once Numbers moves to bcrypt
  // assembleNumbers.deliveryReportValidator(),
  async (req, res) => {
    try {
      await assembleNumbers.handleDeliveryReport(req.body);
      return res.status(200).send({ success: true });
    } catch (err) {
      logger.error("Error handling assemble numbers message report: ", err);
      res.status(500).send({ error: err.message });
    }
  }
);

export default router;
