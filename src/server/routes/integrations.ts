import {
  handleCompletedExport,
  ExportJob,
  VanPhoneType,
  ListHandlerConfig
} from "pgc-ngp-van";
import express from "express";
const router = express.Router();

import logger from "../../logger";
import { errToObj } from "../utils";
import { workerPool } from "../worker";

const makeConfig = (campaignId: number): ListHandlerConfig => ({
  column_config: {
    first_name: "FirstName",
    last_name: "LastName",
    zip: "ZipOrPostal",
    custom_fields: [
      "CongressionalDistrict",
      "StateHouse",
      "StateSenate",
      "Party",
      "PollingLocation",
      "PollingAddress",
      "PollingCity",
      "Email",
      "phone_id"
    ],
    cell: "cell"
  },
  extract_phone_type: VanPhoneType.Cell,
  first_n_rows: 10,
  handler: "insert_van_contact_batch_to_campaign_contact",
  row_merge: { campaign_id: campaignId }
});

router.post("/van/:spokeJobId", async (req, res) => {
  const spokeJobId = parseInt(req.params.spokeJobId);
  const exportJob: ExportJob = req.body;

  logger.info("Got VAN webhook", {
    spokeJobId,
    body: req.body
  });

  // TODO: use real campaign ID
  const campaignId = 5;
  const config = makeConfig(campaignId);

  const client = await workerPool.connect();
  try {
    await handleCompletedExport(client, exportJob, config);
    return res.status(200).send({ success: true });
  } catch (err) {
    logger.error("Error handling VAN export: ", {
      ...errToObj(err),
      body: req.body
    });
    return res.status(500).send({ success: false });
  } finally {
    client.release();
  }
});

export default router;
