/* eslint-disable import/prefer-default-export */
import { GraphQLError } from "graphql/error";
import { Knex } from "knex";
import escapeRegExp from "lodash/escapeRegExp";
import request from "superagent";

import { UserRoleType } from "../../../api/organization-membership";
import { MessageInput } from "../../../api/types";
import { config } from "../../../config";
import { replaceCurlyApostrophes } from "../../../lib/charset-utils";
import { DateTime } from "../../../lib/datetime";
import { hasRole } from "../../../lib/permissions";
import { isNowBetween } from "../../../lib/timezones";
import { getSendBeforeUtc } from "../../../lib/tz-helpers";
import logger from "../../../logger";
import { eventBus, EventType } from "../../event-bus";
import { r } from "../../models";
import { UserRecord } from "../types";
import { getContactMessagingService } from "./message-sending";
import serviceMap from "./services";

const replaceShortLinkDomains = async (
  organizationId: number,
  messageText: string
) => {
  const domains = await r
    .knex("link_domain")
    .where({ organization_id: organizationId })
    .pluck("domain");

  const checkerReducer = (
    doesContainShortlink: boolean,
    linkDomain: string
  ) => {
    const containsLinkDomain = messageText.indexOf(linkDomain) > -1;
    return doesContainShortlink || containsLinkDomain;
  };
  const doesContainShortLink = domains.reduce(checkerReducer, false);

  if (!doesContainShortLink) {
    return messageText;
  }

  // Get next domain
  const domainRaw = await r.knex.raw(
    `
    update
      link_domain
    set
      current_usage_count = (current_usage_count + 1) % max_usage_count,
      cycled_out_at = case when (current_usage_count + 1) % max_usage_count = 0 then now() else cycled_out_at end
    where
      id = (
        select
          id
        from
          link_domain
        where
          is_manually_disabled = false
          and organization_id = ?
        and not exists (
          select 1
          from unhealthy_link_domain
          where unhealthy_link_domain.domain = link_domain.domain
        )
        order by
          cycled_out_at asc,
          current_usage_count asc
        limit 1
        for update
        skip locked
      )
    returning link_domain.domain;
  `,
    [organizationId]
  );
  const targetDomain = domainRaw.rows[0] && domainRaw.rows[0].domain;

  // Skip updating the message text if no healthy target domain was found
  if (!targetDomain) {
    return messageText;
  }

  const replacerReducer = (text: string, domain: string) => {
    const safeDomain = escapeRegExp(domain);
    const domainRegex = RegExp(`(https?://)${safeDomain}(:*)`, "g");
    return text.replace(domainRegex, `$1${targetDomain}$2`);
  };
  const finalMessageText = domains.reduce(replacerReducer, messageText);
  return finalMessageText;
};

export const sendMessage = async (
  trx: Knex.Transaction,
  user: UserRecord,
  campaignContactId: string,
  message: MessageInput,
  checkOptOut = true,
  checkAssignment = true,
  skipUpdatingMessageStatus = false
) => {
  // Scope opt-outs to organization if we are not sharing across all organizations
  const optOutCondition = !config.OPTOUTS_SHARE_ALL_ORGS
    ? "and opt_out.organization_id = campaign.organization_id"
    : "";

  const recordQuery = trx("campaign_contact")
    .join("campaign", "campaign_contact.campaign_id", "campaign.id")
    .where({ "campaign_contact.id": parseInt(campaignContactId, 10) })
    .whereRaw("campaign_contact.archived = false")
    .where({ "campaign.is_archived": false })
    .leftJoin("assignment", "campaign_contact.assignment_id", "assignment.id");

  if (config.ENABLE_MONTHLY_ORG_MESSAGE_LIMITS) {
    recordQuery
      .join("organization", "organization.id", "=", "campaign.organization_id")
      .leftJoin(
        "monthly_organization_message_usages",
        "monthly_organization_message_usages.organization_id",
        "=",
        "organization.id"
      )
      .whereRaw(
        `monthly_organization_message_usages.month = date_trunc('month', now())`
      );
  }

  const record = await recordQuery.first(
    ...[
      "campaign_contact.id as cc_id",
      "campaign_contact.assignment_id as assignment_id",
      "campaign_contact.message_status as cc_message_status",
      "campaign.id as campaign_id",
      "campaign.is_archived as is_archived",
      "campaign.organization_id as organization_id",
      "campaign.timezone as c_timezone",
      "campaign.texting_hours_start as c_texting_hours_start",
      "campaign.texting_hours_end as c_texting_hours_end",
      "assignment.user_id as a_assignment_user_id",
      trx.raw(
        `exists (
          select 1
          from opt_out
          where
            opt_out.cell = campaign_contact.cell
              ${optOutCondition}
        ) as is_opted_out`
      ),
      "campaign_contact.timezone as contact_timezone"
    ].concat(
      config.ENABLE_MONTHLY_ORG_MESSAGE_LIMITS
        ? [
            "organization.monthly_message_limit",
            "monthly_organization_message_usages.sent_message_count"
          ]
        : []
    )
  );

  const { role } = await r
    .knex("user_organization")
    .where({
      user_id: user.id,
      organization_id: record.organization_id
    })
    .first(["role"]);

  if (role === UserRoleType.SUSPENDED) {
    throw new GraphQLError("You don't have the permission to send messages");
  }

  if (
    record.monthly_message_limit !== undefined &&
    record.sent_message_count !== undefined &&
    parseInt(record.sent_message_count, 10) >
      parseInt(record.monthly_message_limit, 10) &&
    record.cc_message_status === "needsMessage"
  ) {
    throw new GraphQLError("Monthly message limit exceeded");
  }

  // If the conversation is unassigned, create an assignment. This assignment will be applied to
  // the message only, and not the campaign contact. We don't use message.assignment_id and the
  // cleaner solution would be to remove the column entirely. I object to this workaround!!
  // - @bchrobot
  const isConversationUnassigned =
    record.assignment_id === null && message.assignmentId === null;
  if (isConversationUnassigned) {
    // Check for existing assignment
    const assignment = await trx("assignment")
      .where({
        user_id: user.id,
        campaign_id: record.campaign_id
      })
      .first("id");
    if (assignment && assignment.id) {
      record.assignment_id = assignment.id;
    } else {
      // Create assignment if no exisiting
      const [newAssignment] = await trx("assignment")
        .insert({
          user_id: user.id,
          campaign_id: record.campaign_id
        })
        .returning("*");
      eventBus.emit(EventType.AssignmentCreated, newAssignment);
      record.assignment_id = newAssignment.id;
    }
    message.assignmentId = record.assignment_id;
  }

  const assignmentIdsMatch =
    record.assignment_id === parseInt(message.assignmentId!, 10);
  if (checkAssignment && !assignmentIdsMatch) {
    throw new GraphQLError("Your assignment has changed");
  }

  // setting defaults based on new forced conditions
  record.o_texting_hours_enforced = true;
  record.o_texting_hours_end = 21;

  // This block will only need to be evaluated if message is sent from admin Message Review
  if (record.a_assignment_user_id !== user.id) {
    const currentRoles = await trx("user_organization")
      .where({
        user_id: user.id,
        organization_id: record.organization_id
      })
      .pluck("role");
    const isSupervol = hasRole(UserRoleType.SUPERVOLUNTEER, currentRoles);
    if (!isSupervol) {
      throw new GraphQLError(
        "You are not authorized to send a message for this assignment!"
      );
    }
  }

  if (checkOptOut && !!record.is_opted_out) {
    throw new GraphQLError(
      "Skipped sending because this contact was already opted out"
    );
  }

  const {
    contact_timezone: contactTimezone,
    c_timezone: campaignTimezone,
    c_texting_hours_start: startHour,
    c_texting_hours_end: endHour
  } = record;
  const timezone = contactTimezone || campaignTimezone;
  const isValidSendTime = isNowBetween(timezone, startHour, endHour);

  if (!isValidSendTime) {
    throw new GraphQLError("Outside permitted texting time for this recipient");
  }

  const sendBefore = getSendBeforeUtc(timezone, endHour, DateTime.local());
  const { contactNumber, text } = message;

  if (text!.length > (config.MAX_MESSAGE_LENGTH || 99999)) {
    throw new GraphQLError("Message was longer than the limit");
  }

  const escapedApostrophes = replaceCurlyApostrophes(text!);
  const replacedDomainsText = config.ENABLE_SHORTLINK_DOMAINS
    ? await replaceShortLinkDomains(record.organization_id, escapedApostrophes)
    : escapedApostrophes;

  const { service_type } = await getContactMessagingService(
    campaignContactId,
    record.organization_id
  );

  const toInsert = {
    id: undefined as string | undefined,
    user_id: user.id,
    campaign_contact_id: campaignContactId,
    text: replacedDomainsText,
    contact_number: contactNumber,
    user_number: "",
    assignment_id: message.assignmentId,
    send_status: config.JOBS_SAME_PROCESS ? "SENDING" : "QUEUED",
    service: service_type,
    is_from_contact: false,
    queued_at: new Date(),
    send_before: sendBefore,
    script_version_hash: message.versionHash,
    campaign_variable_ids: message.campaignVariableIds
  };

  const messageSavePromise = trx("message")
    .insert(toInsert)
    .returning(Object.keys(toInsert).concat(["id"]));

  const { cc_message_status } = record;
  const contactSavePromise = (async () => {
    if (!skipUpdatingMessageStatus) {
      await trx("campaign_contact")
        .update({
          message_status:
            cc_message_status === "needsResponse" ||
            cc_message_status === "convo"
              ? "convo"
              : "messaged"
        })
        .where({ id: record.cc_id });
    }

    const contact = await trx("campaign_contact")
      .select("*")
      .where({ id: record.cc_id })
      .first();
    return contact;
  })();

  const [messageInsertResult, contactUpdateResult] = await Promise.all([
    messageSavePromise,
    contactSavePromise
  ]);
  const messageInstance = Array.isArray(messageInsertResult)
    ? messageInsertResult[0]
    : messageInsertResult;
  toInsert.id = messageInstance.id || messageInstance;

  // Send message after we are sure messageInstance has been persisted
  const service = serviceMap[service_type];
  service.sendMessage(toInsert, record.organization_id);

  // Send message to BernieSMS to be checked for bad words
  const badWordUrl = config.BAD_WORD_URL;
  if (badWordUrl) {
    request
      .post(badWordUrl)
      .timeout(5000)
      .set("Authorization", `Token ${config.BAD_WORD_TOKEN}`)
      .send({ user_id: user.auth0_id, message: toInsert.text })
      .end((err, _res) => {
        if (err) {
          logger.error("Error submitting message to bad word service: ", err);
        }
      });
  }

  return contactUpdateResult;
};
