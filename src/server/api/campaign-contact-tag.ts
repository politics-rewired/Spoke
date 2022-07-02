import { r } from "../models";

export const resolvers = {
  CampaignContactTag: {
    id: (campaignContactTag) =>
      `${campaignContactTag.campaign_contact_id}-${campaignContactTag.tag_id}`,
    tag: (campaignContactTag) =>
      campaignContactTag.tag ?? r.knex("tag").where({ id: 1 }).first(),
    applier: (campaignContactTag) =>
      campaignContactTag.applier ?? r.knex("user").where({ id: 1 }).first()
  }
};

export default resolvers;
