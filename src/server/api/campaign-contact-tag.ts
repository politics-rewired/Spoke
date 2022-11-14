import { r } from "../models";
import { sqlResolvers } from "./lib/utils";

interface CampaignContactTagRecord {
  campaign_contact_id: number;
  tag_id: number;
  tagger_id: number;
}

export const resolvers = {
  CampaignContactTag: {
    ...sqlResolvers(["createdAt", "updatedAt"]),
    tag: async (cct: CampaignContactTagRecord) =>
      r.reader("tag").where({ id: cct.tag_id }).first(),
    tagger: async (cct: CampaignContactTagRecord) =>
      r.reader("user").where({ id: cct.tagger_id }).first()
  }
};

export default resolvers;
