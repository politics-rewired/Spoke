import { r } from "../models";
import { accessRequired } from "./errors";
import { formatPage } from "./lib/pagination";
import { sqlResolvers } from "./lib/utils";

interface TagRecord {
  id: number;
  organization_id: number;
  title: string;
  description: string;
  text_color: string;
  background_color: string;
  author_id: number | null;
  confirmation_steps: string[][];
  on_apply_script: string;
  webhook_url: string;
  is_assignable: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const resolvers = {
  Tag: {
    ...sqlResolvers([
      "id",
      "title",
      "description",
      "textColor",
      "backgroundColor",
      "confirmationSteps",
      "onApplyScript",
      "webhookUrl",
      "isAssignable",
      "isSystem"
    ]),

    createdAt: async (tag: TagRecord) => {
      // this needs to be explicitly formatted as a date
      // when fetched via row_to_json in campaign_contact.tags
      const rawDate = tag.created_at;
      const formattedDate =
        typeof rawDate === "string" ? new Date(rawDate) : rawDate;
      return formattedDate;
    },

    author: async (tag: TagRecord) =>
      r.reader("user").where({ id: tag.author_id }).first("*"),

    contacts: async (
      tag: TagRecord,
      { campaignId }: { campaignId: string },
      { user }: { user: any }
    ) => {
      await accessRequired(user, tag.organization_id, "SUPERVOLUNTEER");

      let query = r
        .reader("campaign_contact")
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
    },
    externalSyncConfigurations: async (
      tag: TagRecord,
      { after, first }: { after: string; first: number }
    ) => {
      const query = r
        .reader("external_sync_tag_configuration")
        .where({ tag_id: tag.id });
      return formatPage(query, { after, first, primaryColumn: "compound_id" });
    }
  }
};

export default resolvers;
