import { r } from "../models";
import { chunk } from "lodash";

const CONCURRENCY = 2;

export const releaseStaleReplies = async (_payload, _helpers) => {
  const campaignsToReleaseStaleRepliesFrom = await r
    .knex("campaign")
    .select(["id", "replies_stale_after_minutes"])
    .whereNotNull("replies_stale_after_minutes")
    .where({ is_archived: false });

  const batches = chunk(campaignsToReleaseStaleRepliesFrom, CONCURRENCY);

  for (const batch of batches) {
    await Promise.all(
      batch.map(c =>
        releaseStaleRepliesOnCampaign(c.id, c.replies_stale_after_minutes)
      )
    );
  }
};

const releaseStaleRepliesOnCampaign = async (campaignId, afterStaleMinutes) => {
  await r
    .knex("campaign_contact")
    .update({ assignment_id: null })
    .where({
      campaign_id: campaignId,
      message_status: "needsResponse"
    })
    .whereNotNull("assignment_id")
    .whereRaw(
      `campaign_contact.updated_at < now() - ('1 minute'::interval * ?)`,
      [afterStaleMinutes]
    );
};
