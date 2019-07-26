import { mapFieldsToModel } from "./lib/utils";
import { r, Organization } from "../models";
import { accessRequired } from "./errors";
import { buildCampaignQuery, getCampaigns } from "./campaign";
import { buildUserOrganizationQuery } from "./user";
import { currentAssignmentTarget, countLeft } from "./assignment";

import { TextRequestType } from "../../api/organization";

export const getEscalationUserId = async organizationId => {
  let escalationUserId;
  try {
    const organization = await r
      .knex("organization")
      .where({ id: organizationId })
      .first("organization.features");
    const features = JSON.parse(organization.features);
    escalationUserId = parseInt(features.escalationUserId);
  } catch (error) {
    // no-op
  }
  return escalationUserId;
};

export const resolvers = {
  Organization: {
    ...mapFieldsToModel(["id", "name"], Organization),
    campaigns: async (organization, { cursor, campaignsFilter }, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return getCampaigns(organization.id, cursor, campaignsFilter);
    },
    uuid: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      const result = await r
        .knex("organization")
        .column("uuid")
        .where("id", organization.id);
      return result[0].uuid;
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "ADMIN");
      return r
        .table("opt_out")
        .getAll(organization.id, { index: "organization_id" });
    },
    people: async (organization, { role, campaignId, offset }, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      const query = buildUserOrganizationQuery(
        r.knex.select("user.*"),
        organization.id,
        role,
        campaignId,
        offset
      ).orderBy(["first_name", "last_name", "id"]);
      if (typeof offset === "number") {
        return query.limit(200);
      }
      return query;
    },
    peopleCount: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return r.getCount(
        r
          .knex("user")
          .join("user_organization", "user.id", "user_organization.user_id")
          .where("user_organization.organization_id", organization.id)
      );
    },
    threeClickEnabled: organization =>
      organization.features.indexOf("threeClick") !== -1,
    textingHoursEnforced: organization => organization.texting_hours_enforced,
    optOutMessage: organization =>
      (organization.features &&
      organization.features.indexOf("opt_out_message") !== -1
        ? JSON.parse(organization.features).opt_out_message
        : process.env.OPT_OUT_MESSAGE) ||
      "I'm opting you out of texts immediately. Have a great day.",
    textingHoursStart: organization => organization.texting_hours_start,
    textingHoursEnd: organization => organization.texting_hours_end,
    textRequestFormEnabled: organization => {
      try {
        const features = JSON.parse(organization.features);
        return features.textRequestFormEnabled || false;
      } catch (ex) {
        return false;
      }
    },
    textRequestType: organization => {
      const defaultValue = TextRequestType.UNSENT;
      try {
        const features = JSON.parse(organization.features);
        return features.textRequestType || defaultValue;
      } catch (ex) {
        return defaultValue;
      }
    },
    textRequestMaxCount: organization => {
      try {
        const features = JSON.parse(organization.features);
        return parseInt(features.textRequestMaxCount);
      } catch (ex) {
        return null;
      }
    },
    textsAvailable: async organization => {
      const assignmentTarget = await currentAssignmentTarget(organization.id);
      return !!assignmentTarget;
    },
    currentAssignmentTarget: async organization => {
      const cat = await currentAssignmentTarget(organization.id);

      if (cat) {
        const cl = await countLeft(cat.type, cat.campaign.id);
        return Object.assign({}, cat, { countLeft: cl });
      } else {
        return cat;
      }
    },
    escalatedConversationCount: async organization => {
      const subQuery = r.knex
        .select("campaign_contact_tag.campaign_contact_id")
        .from("campaign_contact_tag")
        .join("tag", "tag.id", "=", "campaign_contact_tag.tag_id")
        .where({
          "tag.title": "Escalated",
          "tag.organization_id": organization.id
        })
        .whereRaw(
          "campaign_contact_tag.campaign_contact_id = campaign_contact.id"
        );

      const countQuery = r
        .knex("campaign_contact")
        .join("assignment", "assignment.id", "campaign_contact.assignment_id")
        .whereExists(subQuery)
        .count("*");

      const escalatedCount = await r.parseCount(countQuery);
      return escalatedCount;
    },
    numbersApiKey: async organization => {
      let numbersApiKey;
      try {
        const features = JSON.parse(organization.features);
        numbersApiKey = features.numbersApiKey.slice(0, 4) + "****************";
      } catch (ex) {
        // no-op
      }
      return numbersApiKey;
    },
    pendingAssignmentRequestCount: async organization => {
      const count = await r.parseCount(
        r
          .knex("assignment_request")
          .count("*")
          .where({
            status: "pending",
            organization_id: organization.id
          })
      );
      return count;
    },
    linkDomains: async organization => {
      const rawResult = await r.knex.raw(
        `
        select
          link_domain.*,
          (is_unhealthy is null or not is_unhealthy) as is_healthy
        from
          link_domain
        left join
          (
            select
              domain,
              (healthy_again_at is null or healthy_again_at > now()) as is_unhealthy
            from
              unhealthy_link_domain
            order by
              created_at desc
            limit 1
          ) unhealthy_domains
          on
            unhealthy_domains.domain = link_domain.domain
        where
          link_domain.organization_id = ?
        order by created_at asc
        ;
      `,
        [organization.id]
      );
      return rawResult.rows;
    },
    unhealthyLinkDomains: async _ => {
      const rawResult = await r.knex.raw(`
        select
          distinct on (domain) *
        from
          unhealthy_link_domain
        order by
          domain,
          created_at desc
        ;
      `);
      return rawResult.rows;
    },
    tagList: async organization =>
      r
        .knex("tag")
        .where({ organization_id: organization.id })
        .orderBy([
          { column: "is_system", order: "asc" },
          { column: "title", order: "asc" }
        ])
  }
};
