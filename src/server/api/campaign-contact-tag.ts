import { r } from "../models";
import { sqlResolvers } from "./lib/utils";
import type { TagRecord, UserRecord } from "./types";

interface CampaignContactTagRecord {
  campaign_contact_id: number;
  tag_id: number;
  tagger_id: number;
}

interface CampaignContactTagRecordPreloaded extends CampaignContactTagRecord {
  tagger: UserRecord;
  tag: TagRecord;
}

export const resolvers = {
  CampaignContactTag: {
    ...sqlResolvers(["createdAt", "updatedAt"]),
    tag: async (cct: CampaignContactTagRecordPreloaded) =>
      cct.tag ? cct.tag : r.reader("tag").where({ id: cct.tag_id }).first(),
    tagger: async (cct: CampaignContactTagRecordPreloaded) =>
      cct.tagger
        ? cct.tagger
        : r.reader("user").where({ id: cct.tagger_id }).first(),
    id: async (cct: CampaignContactTagRecordPreloaded) =>
      `${cct.campaign_contact_id}-${cct.tag_id}`
  }
};

export default resolvers;
