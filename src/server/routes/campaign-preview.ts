import express from "express";

import { symmetricDecrypt } from "../api/lib/crypto";
import type {
  CampaignContactRecord,
  CampaignRecord,
  CampaignVariableRecord,
  CannedResponseRecord,
  InteractionStepRecord
} from "../api/types";
import renderCampaignPreview from "../lib/templates/pages/campaign-preview";
import { r } from "../models";

const router = express.Router();

router.get("/preview/:campaignId", async (req, res) => {
  const token = req.params.campaignId;

  let campaignId;
  try {
    campaignId = symmetricDecrypt(token);
  } catch {
    return res.status(400).send("bad token");
  }

  const campaign = await r
    .reader<CampaignRecord>("all_campaign")
    .where({ id: campaignId })
    .first("*");

  const customFields = await r
    .reader<CampaignContactRecord>("campaign_contact")
    .where({ campaign_id: campaignId })
    .first("custom_fields")
    .then((record) =>
      record ? Object.keys(JSON.parse(record.custom_fields)) : []
    );

  const campaignVariables = await r
    .reader<CampaignVariableRecord>("campaign_variable")
    .where({ campaign_id: campaignId })
    .whereNull("deleted_at")
    .select(["name", "value"]);

  const interactionSteps = await r
    .reader<InteractionStepRecord>("interaction_step")
    .where({
      campaign_id: campaignId,
      is_deleted: false
    });

  const cannedResponses = await r
    .reader<CannedResponseRecord>("canned_response")
    .where({ campaign_id: campaignId });

  const page = await renderCampaignPreview({
    campaign,
    campaignVariables,
    customFields,
    interactionSteps,
    cannedResponses
  });

  return res.send(page);
});

export default router;
