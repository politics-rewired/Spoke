import { r } from "../models";
import { accessRequired } from "./errors";

export const resolvers = {
  Tag: {
    id: async tag => tag.id,
    title: async tag => tag.title,
    description: async tag => tag.description,
    textColor: async tag => tag.text_color,
    backgroundColor: async tag => tag.background_color,
    author: async tag =>
      r
        .knex("user")
        .where({ id: tag.author_id })
        .first("*"),
    confirmationSteps: async tag => tag.confirmation_steps,
    onApplyScript: async tag => tag.on_apply_script,
    webhookUrl: async tag => tag.webhook_url,
    isAssignable: async tag => tag.is_assignable,
    isSystem: async tag => tag.is_system,
    createdAt: async tag => tag.created_at,

    contacts: async (tag, { campaignId }, { user }) => {
      await accessRequired(user, tag.organization_id, "SUPERVOLUNTEER");

      let query = r
        .knex("campaign_contact")
        .select("campaign_contact.*")
        .join(
          "campaign_contact_tag",
          "campaign_contact_tag.campaign_contact_id",
          "=",
          "campaign_contact.id"
        )
        .where("campaign_contact_tag.tag_id", "=", tag.id);
      if (campaignId) {
        query = query.where("campaign_contact.campaign_id", "=", campaignId);
      }
      return query;
    }
  }
};
