import { config } from "../../config";
import { parseIanaZone } from "../../lib/datetime";
import logger from "../../logger";
import { cacheableData, r } from "../models";
import { errToObj } from "../utils";
import { accessRequired } from "./errors";
import { sqlResolvers } from "./lib/utils";

const contactFieldsToHide = config.CONTACT_FIELDS_TO_HIDE.split(",");

export const resolvers = {
  Location: {
    city: (zipCode) => zipCode.city || "",
    state: (zipCode) => zipCode.state || ""
  },
  CampaignContact: {
    ...sqlResolvers([
      "id",
      "firstName",
      "zip",
      "customFields",
      "messageStatus",
      "assignmentId"
    ]),
    lastName: async (campaignContact) => {
      if (contactFieldsToHide.includes("lastName")) {
        return "";
      }
      return campaignContact.last_name;
    },
    cell: async (campaignContact) => {
      if (contactFieldsToHide.includes("cell")) {
        return "";
      }
      return campaignContact.cell;
    },
    external_id: async (campaignContact) => {
      if (contactFieldsToHide.includes("external_id")) {
        return "";
      }
      return campaignContact.external_id;
    },
    updatedAt: async (campaignContact) => {
      let updatedAt;
      if (
        campaignContact.updated_at &&
        campaignContact.updated_at !== "0000-00-00 00:00:00"
      ) {
        updatedAt = campaignContact.updated_at;
      } else if (Array.isArray(campaignContact.messages)) {
        const latestMessage =
          campaignContact.messages[campaignContact.messages.length - 1];
        updatedAt = latestMessage.created_at;
      } else {
        updatedAt = campaignContact.created_at;
      }

      return updatedAt;
    },
    messageStatus: async (campaignContact) => {
      if (campaignContact.message_status) {
        return campaignContact.message_status;
      }
      // TODO: look it up via cacheing
    },
    campaign: async (campaignContact, _, { loaders }) =>
      loaders.campaign.load(campaignContact.campaign_id),
    // To get that result to look like what the original code returned
    // without using the outgoing answer_options array field, try this:
    //
    questionResponseValues: async (campaignContact) => {
      if ("questionResponseValues" in campaignContact) {
        return campaignContact.questionResponseValues;
      }

      if (campaignContact.message_status === "needsMessage") {
        return []; // it's the beginning, so there won't be any
      }

      const qr_results = await r
        .reader("question_response")
        .join(
          "interaction_step as istep",
          "question_response.interaction_step_id",
          "istep.id"
        )
        .where("question_response.campaign_contact_id", campaignContact.id)
        .select(
          "value",
          "interaction_step_id",
          "istep.question as istep_question",
          "istep.id as istep_id"
        );

      return qr_results.map((qr_result) => {
        const question = {
          id: qr_result.istep_id,
          question: qr_result.istep_question
        };
        return { ...qr_result, question };
      });
    },
    questionResponses: async (campaignContact) => {
      const results = await r
        .reader("question_response as qres")
        .where("qres.campaign_contact_id", campaignContact.id)
        .join(
          "interaction_step",
          "qres.interaction_step_id",
          "interaction_step.id"
        )
        .join(
          "interaction_step as child",
          "qres.interaction_step_id",
          "child.parent_interaction_id"
        )
        .select(
          "child.answer_option",
          "child.id",
          "child.parent_interaction_id",
          "child.created_at",
          "interaction_step.interaction_step_id",
          "interaction_step.campaign_id",
          "interaction_step.question",
          "interaction_step.script_options",
          "qres.id",
          "qres.value",
          "qres.created_at",
          "qres.interaction_step_id"
        )
        .catch((err) =>
          logger.error("Error fetching question responses: ", {
            ...errToObj(err)
          })
        );

      const formatted = {};

      for (let i = 0; i < results.length; i += 1) {
        const res = results[i];

        const responseId = res["qres.id"];
        const responseValue = res["qres.value"];
        const answerValue = res["child.answer_option"];
        const interactionStepId = res["child.id"];

        if (responseId in formatted) {
          formatted[responseId].parent_interaction_step.answer_options.push({
            value: answerValue,
            interaction_step_id: interactionStepId
          });
          if (responseValue === answerValue) {
            formatted[responseId].interaction_step_id = interactionStepId;
          }
        } else {
          formatted[responseId] = {
            contact_response_value: responseValue,
            interaction_step_id: interactionStepId,
            parent_interaction_step: {
              answer_option: "",
              answer_options: [
                { value: answerValue, interaction_step_id: interactionStepId }
              ],
              campaign_id: res["interaction_step.campaign_id"],
              created_at: res["child.created_at"],
              id: responseId,
              parent_interaction_id:
                res["interaction_step.parent_interaction_id"],
              question: res["interaction_step.question"],
              scriptOptions: res["interaction_step.script_options"]
            },
            value: responseValue
          };
        }
      }
      return Object.values(formatted);
    },
    location: async (campaignContact, _, { loaders }) =>
      loaders.zipCode.load(campaignContact.zip.split("-")[0]),
    messages: async (campaignContact) => {
      if ("messages" in campaignContact) {
        return campaignContact.messages;
      }

      const messages = await r
        .reader("message")
        .where({ campaign_contact_id: campaignContact.id })
        .orderBy("created_at");

      return messages;
    },
    optOut: async (campaignContact, _, { loaders }) => {
      // `opt_out_cell` is a non-standard property from the conversations query
      if ("opt_out_cell" in campaignContact) {
        return {
          cell: campaignContact.opt_out_cell
        };
      }
      let isOptedOut = false;
      if (campaignContact.is_opted_out !== undefined) {
        isOptedOut = Boolean(campaignContact.is_opted_out);
      } else {
        let organizationId = campaignContact.organization_id;
        if (!organizationId) {
          const campaign = await loaders.campaign.load(
            campaignContact.campaign_id
          );
          organizationId = campaign.organization_id;
        }

        isOptedOut = await cacheableData.optOut.query({
          cell: campaignContact.cell,
          organizationId
        });
      }

      if (isOptedOut) {
        // fake ID so we don't need to look up existance
        return {
          id: "optout",
          cell: campaignContact.cell
        };
      }
      return null;
    },
    tags: async (campaignContact, _, { user }) => {
      // conversations reader pulls this as cmp_id
      // other loaders resolve it as campaign_id
      // grab both, and pick the one available

      const { cmp_id, campaign_id } = campaignContact;

      const campaignId = cmp_id ?? campaign_id;

      const { organization_id } = await r
        .reader("campaign")
        .where({ id: campaignId })
        .first("organization_id");

      await accessRequired(user, organization_id, "TEXTER");
      return r
        .reader("campaign_contact_tag")
        .where({ campaign_contact_id: campaignContact.id })
        .join("tag", "tag.id", "campaign_contact_tag.tag_id")
        .join("user", "user.id", "campaign_contact_tag.tagger_id")
        .select([
          "campaign_contact_tag.*",
          r.knex.raw("row_to_json(tag.*) as tag"),
          r.knex.raw("row_to_json(public.user.*) as tagger")
        ]);
    },
    timezone: (campaignContact) =>
      campaignContact.timezone ? parseIanaZone(campaignContact.timezone) : null
  }
};

export default resolvers;
