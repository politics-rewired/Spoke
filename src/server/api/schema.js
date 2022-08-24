import { ForbiddenError } from "apollo-server-errors";
import camelCaseKeys from "camelcase-keys";
import GraphQLDate from "graphql-date";
import GraphQLJSON from "graphql-type-json";
import { GraphQLUpload } from "graphql-upload";
import { GraphQLError } from "graphql/error";
import _ from "lodash";
import groupBy from "lodash/groupBy";

import { VanOperationMode } from "../../api/external-system";
import {
  RequestAutoApproveType,
  UserRoleType
} from "../../api/organization-membership";
import { CampaignExportType, TextRequestType } from "../../api/types";
import { config } from "../../config";
import { parseIanaZone } from "../../lib/datetime";
import { hasRole } from "../../lib/permissions";
import { applyScript } from "../../lib/scripts";
import { replaceAll } from "../../lib/utils";
import logger from "../../logger";
import { eventBus, EventType } from "../event-bus";
import { refreshExternalSystem } from "../lib/external-systems";
import {
  getInstanceNotifications,
  getOrgLevelNotifications
} from "../lib/notices";
import { change } from "../local-auth-helpers";
import { cacheOpts, memoizer } from "../memoredis";
import { cacheableData, r } from "../models";
import { getUserById } from "../models/cacheable_queries";
import { Notifications, sendUserNotification } from "../notifications";
import { addExportCampaign } from "../tasks/export-campaign";
import { addExportForVan } from "../tasks/export-for-van";
import { addFilterLandlines } from "../tasks/filter-landlines";
import { errToObj } from "../utils";
import { getWorker } from "../worker";
import {
  giveUserMoreTexts,
  myCurrentAssignmentTarget,
  resolvers as assignmentResolvers
} from "./assignment";
import { resolvers as assignmentRequestResolvers } from "./assignment-request";
import { getCampaigns, resolvers as campaignResolvers } from "./campaign";
import { resolvers as campaignContactResolvers } from "./campaign-contact";
import { resolvers as campaignGroupResolvers } from "./campaign-group";
import {
  queryCampaignOverlapCount,
  queryCampaignOverlaps
} from "./campaign-overlap";
import { resolvers as campaignVariableResolvers } from "./campaign-variable";
import { resolvers as cannedResponseResolvers } from "./canned-response";
import {
  getCampaignIdMessageIdsAndCampaignIdContactIdsMapsChunked,
  getConversations,
  reassignConversations,
  resolvers as conversationsResolver
} from "./conversations";
import {
  accessRequired,
  assignmentRequired,
  assignmentRequiredOrHasOrgRoleForCampaign,
  authRequired,
  superAdminRequired,
  userRoleRequired
} from "./errors";
import { resolvers as externalActivistCodeResolvers } from "./external-activist-code";
import { resolvers as externalListResolvers } from "./external-list";
import { resolvers as externalResultCodeResolvers } from "./external-result-code";
import { resolvers as externalSurveyQuestionResolvers } from "./external-survey-question";
import { resolvers as externalResponseOptionResolvers } from "./external-survey-question-response-option";
import { resolvers as externalSyncConfigResolvers } from "./external-sync-config";
import { resolvers as externalSystemResolvers } from "./external-system";
import { resolvers as interactionStepResolvers } from "./interaction-step";
import { resolvers as inviteResolvers } from "./invite";
import { notifyAssignmentCreated, notifyOnTagConversation } from "./lib/alerts";
import { getStepsToUpdate } from "./lib/bulk-script-editor";
import { copyCampaign, editCampaign } from "./lib/campaign";
import { saveNewIncomingMessage } from "./lib/message-sending";
import { formatPage } from "./lib/pagination";
import { sendMessage } from "./lib/send-message";
import { graphileSecretRef } from "./lib/utils";
import { resolvers as linkDomainResolvers } from "./link-domain";
import { resolvers as messageResolvers } from "./message";
import { resolvers as messagingServiceResolvers } from "./messaging-service";
import { resolvers as noticeResolvers } from "./notice";
import { resolvers as optOutResolvers } from "./opt-out";
import { resolvers as organizationResolvers } from "./organization";
import { resolvers as membershipSchema } from "./organization-membership";
import {
  getOrgFeature,
  resolvers as settingsSchema,
  updateOrganizationSettings,
  writePermissionRequired
} from "./organization-settings";
import { GraphQLPhone } from "./phone";
import { resolvers as questionResolvers } from "./question";
import { resolvers as questionResponseResolvers } from "./question-response";
import { resolvers as tagResolvers } from "./tag";
import { resolvers as teamResolvers } from "./team";
import { resolvers as trollbotResolvers } from "./trollbot";
import { getUsers, getUsersById, resolvers as userResolvers } from "./user";

const uuidv4 = require("uuid").v4;

async function updateQuestionResponses(
  trx,
  campaignContactId,
  questionResponses,
  loaders
) {
  // TODO: wrap in transaction
  // TODO - batch insert / delete
  const count = questionResponses.length;

  for (let i = 0; i < count; i += 1) {
    const questionResponse = questionResponses[i];
    const { interactionStepId, value } = questionResponse;
    await trx("question_response")
      .where({
        campaign_contact_id: campaignContactId,
        interaction_step_id: interactionStepId
      })
      .del();

    // TODO: maybe undo action_handler if updated answer

    const [qr] = await trx("question_response")
      .insert({
        campaign_contact_id: campaignContactId,
        interaction_step_id: interactionStepId,
        value
      })
      .returning("*");

    const interactionStepResult = await trx("interaction_step")
      // TODO: is this really parent_interaction_id or just interaction_id?
      .where({
        parent_interaction_id: interactionStepId,
        answer_option: value
      })
      .whereNot("answer_actions", "")
      .whereNotNull("answer_actions");

    const interactionStepAction =
      interactionStepResult.length && interactionStepResult[0].answer_actions;
    if (interactionStepAction) {
      // run interaction step handler
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const handler = require(`../action_handlers/${interactionStepAction}.js`);
        handler.processAction(qr, interactionStepResult[0], campaignContactId);
      } catch (err) {
        logger.error("Handler for InteractionStep does not exist", {
          error: errToObj(err),
          interactionStepId,
          interactionStepAction
        });
      }
    }
  }

  const contact = loaders.campaignContact.load(campaignContactId);
  return contact;
}

async function deleteQuestionResponses(
  trx,
  campaignContactId,
  interactionStepIds,
  loaders,
  user
) {
  const contact = await loaders.campaignContact.load(campaignContactId);
  try {
    await assignmentRequired(user, contact.assignment_id);
  } catch (error) {
    const campaign = await r
      .knex("campaign")
      .where({ id: contact.campaign_id })
      .first();
    const organizationId = campaign.organization_id;
    await accessRequired(user, organizationId, "SUPERVOLUNTEER");
  }
  // TODO: maybe undo action_handler
  await trx("question_response")
    .where({ campaign_contact_id: campaignContactId })
    .whereIn("interaction_step_id", interactionStepIds)
    .del();

  return contact;
}

async function createOptOut(trx, campaignContactId, optOut, loaders, user) {
  const contact = await loaders.campaignContact.load(campaignContactId);
  let organizationId = contact.organization_id;
  if (!organizationId) {
    const campaign = await loaders.campaign.load(contact.campaign_id);
    organizationId = campaign.organization_id;
  }
  try {
    await assignmentRequired(user, contact.assignment_id);
  } catch (error) {
    await accessRequired(user, organizationId, "SUPERVOLUNTEER");
  }

  const { cell, message, reason } = optOut;
  let { assignmentId } = optOut;
  if (!assignmentId) {
    // Check for existing assignment
    const assignment = await trx("assignment")
      .where({
        user_id: user.id,
        campaign_id: contact.campaign_id
      })
      .first("id");
    if (assignment && assignment.id) {
      assignmentId = assignment.id;
    } else {
      // Create assignment if no exisiting
      const [newAssignment] = await trx("assignment")
        .insert({
          user_id: user.id,
          campaign_id: contact.campaign_id
        })
        .returning("*");
      eventBus.emit(EventType.AssignmentCreated, newAssignment);
      assignmentId = newAssignment.id;
    }
  }

  await cacheableData.optOut.save(trx, {
    cell,
    reason,
    assignmentId,
    organizationId
  });

  if (message) {
    const checkOptOut = false;
    try {
      await sendMessage(trx, user, campaignContactId, message, checkOptOut);
    } catch (error) {
      // Log the sendMessage error, but return successful opt out creation
      logger.error("Error sending message for opt-out", error);
    }
  }

  // Force reload with updated `is_opted_out` status
  loaders.campaignContact.clear(campaignContactId);
  return loaders.campaignContact.load(campaignContactId);
}

async function editCampaignContactMessageStatus(
  trx,
  campaignContactId,
  messageStatus,
  loaders,
  user
) {
  const contact = await loaders.campaignContact.load(campaignContactId);

  await assignmentRequiredOrHasOrgRoleForCampaign(
    user,
    contact.assignment_id,
    contact.campaign_id,
    "SUPERVOLUNTEER"
  );

  const [campaign] = await trx("campaign_contact")
    .update({ message_status: messageStatus })
    .where({ id: campaignContactId })
    .returning("*");

  return campaign;
}

const rootMutations = {
  RootMutation: {
    userAgreeTerms: async (_root, { userId }, { user: _user }) => {
      // TODO: permissions check needed -- user.id === userId
      const [currentUser] = await r
        .knex("user")
        .where({ id: userId })
        .update({ terms: true })
        .returning("*");
      return currentUser;
    },

    sendReply: async (_root, { id, message }, { user, loaders }) => {
      const contact = await loaders.campaignContact.load(id);
      const campaign = await loaders.campaign.load(contact.campaign_id);

      await accessRequired(user, campaign.organization_id, "ADMIN");

      const lastMessage = await r
        .knex("message")
        .where({
          assignment_id: contact.assignment_id,
          contact_number: contact.cell
        })
        .first();

      if (!lastMessage) {
        throw new GraphQLError(
          "Cannot fake a reply to a contact that has no existing thread yet"
        );
      }

      const userNumber = lastMessage.user_number;
      const contactNumber = contact.cell;
      const mockId = `mocked_${Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, "")}`;
      await saveNewIncomingMessage({
        campaign_contact_id: contact.id,
        contact_number: contactNumber,
        user_number: userNumber,
        is_from_contact: true,
        text: message,
        service_response: JSON.stringify([
          {
            fakeMessage: true,
            userId: user.id,
            userFirstName: user.first_name
          }
        ]),
        service_id: mockId,
        assignment_id: lastMessage.assignment_id,
        service: lastMessage.service,
        send_status: "DELIVERED"
      });
      return loaders.campaignContact.load(id);
    },

    exportCampaign: async (_root, { options }, { user, loaders }) => {
      const { campaignId, exportType, vanOptions, spokeOptions } = options;

      if (exportType === CampaignExportType.VAN && !vanOptions) {
        throw new Error("Input must include vanOptions when exporting as VAN!");
      }

      if (exportType === CampaignExportType.SPOKE && !spokeOptions) {
        throw new Error("Input must include valid spokeOptions when exporting");
      }

      const campaign = await loaders.campaign.load(campaignId);
      const organizationId = campaign.organization_id;
      await accessRequired(user, organizationId, "ADMIN");

      if (exportType === CampaignExportType.SPOKE) {
        return addExportCampaign({
          campaignId,
          requesterId: user.id,
          spokeOptions
        });
      }

      if (exportType === CampaignExportType.VAN) {
        return addExportForVan({
          ...vanOptions,
          campaignId,
          requesterId: user.id
        });
      }
    },

    editOrganizationMembership: async (
      _root,
      { id, level, role },
      { user: authUser }
    ) => {
      const membership = await r
        .knex("user_organization")
        .where({ id: parseInt(id, 10) })
        .first();
      if (!membership) throw new Error("No such org membership");

      let roleRequired = UserRoleType.ADMIN;
      if (
        role &&
        (membership.role === UserRoleType.OWNER || role === UserRoleType.OWNER)
      ) {
        roleRequired = UserRoleType.OWNER;
      }

      if (
        role &&
        (membership.role === UserRoleType.SUPERADMIN ||
          role === UserRoleType.SUPERADMIN)
      ) {
        roleRequired = UserRoleType.SUPERADMIN;
      }

      await accessRequired(
        authUser,
        membership.organization_id,
        roleRequired,
        true
      );

      // get user to update is_superadmin on role change
      const userUpdateQuery = r.knex("user").where({ id: membership.user_id });
      const updateQuery = r
        .knex("user_organization")
        .where({
          user_id: membership.user_id,
          organization_id: membership.organization_id
        })
        .returning("*");

      if (level) updateQuery.update({ request_status: level.toLowerCase() });
      if (role) {
        // update both tables if role change
        userUpdateQuery.update({
          is_superadmin: role === UserRoleType.SUPERADMIN
        });
        updateQuery.update({
          role: role === UserRoleType.SUPERADMIN ? UserRoleType.OWNER : role
        });
      }

      const [[orgMembership], _result] = await Promise.all([
        updateQuery,
        userUpdateQuery
      ]);

      memoizer.invalidate(cacheOpts.UserOrganizations.key, {
        userId: membership.user_id
      });
      memoizer.invalidate(cacheOpts.UserOrganizationRoles.key, {
        userId: membership.user_id,
        organizationId: membership.organization_id
      });
      return orgMembership;
    },

    purgeOrganizationUsers: async (
      _root,
      { organizationId },
      { user: authUser, db }
    ) => {
      const orgId = parseInt(organizationId, 10);
      await accessRequired(authUser, orgId, "OWNER", true);
      const { rowCount } = await db.primary.raw(
        `
          delete
          from user_organization uo
          using public.user u
          where
            u.id = uo.user_id
            and u.is_superadmin is not true
            and uo.organization_id = ?
            and uo.role <> 'OWNER'
        `,
        [orgId]
      );
      return rowCount;
    },

    editOrganizationSettings: async (
      _root,
      { id, input },
      { user: authUser }
    ) => {
      const organizationId = parseInt(id, 10);
      const roleRequired = writePermissionRequired(input);
      await userRoleRequired(authUser, organizationId, roleRequired);
      const updatedOrganization = await updateOrganizationSettings(
        organizationId,
        input
      );
      return updatedOrganization;
    },

    editUser: async (_root, { userData, ...stringIds }, { user }) => {
      const organizationId = parseInt(stringIds.organizationId, 10);
      const userId = parseInt(stringIds.userId, 10);
      if (user.id !== userId) {
        // User can edit themselves
        await accessRequired(user, organizationId, "ADMIN", true);
      }
      const member = await r
        .knex("user")
        .join("user_organization", "user.id", "user_organization.user_id")
        .where({
          "user_organization.organization_id": organizationId,
          "user.id": userId
        })
        .first();
      if (!member) {
        return null;
      }
      if (userData) {
        const userRes = await r.knex("user").where("id", userId).update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          cell: userData.cell,
          notification_frequency: userData.notificationFrequency
        });

        memoizer.invalidate(cacheOpts.GetUser.key, { id: userId });
        memoizer.invalidate(cacheOpts.GetUser.key, {
          auth0Id: userRes.auth0_id
        });

        userData = {
          id: userId,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          cell: userData.cell,
          notification_frequency: userData.notificationFrequency
        };
      } else {
        userData = member;
      }
      return userData;
    },

    resetUserPassword: async (_root, args, { user }) => {
      if (config.PASSPORT_STRATEGY !== "local")
        throw new Error(
          "Password reset may only be used with the 'local' login strategy."
        );

      const organizationId = parseInt(args.organizationId, 10);
      const userId = parseInt(args.userId, 10);

      if (user.id === userId) {
        throw new Error("You can't reset your own password.");
      }
      await accessRequired(user, organizationId, "ADMIN", true);

      // Add date at the end in case user record is modified after password is reset
      const passwordResetHash = uuidv4();
      const auth0_id = `reset|${passwordResetHash}|${Date.now()}`;

      await r.knex("user").where("id", userId).update({
        auth0_id
      });
      return passwordResetHash;
    },

    changeUserPassword: async (
      _root,
      { formData, ...stringIds },
      { user, db }
    ) => {
      const userId = parseInt(stringIds.userId, 10);

      if (user.id !== userId) {
        throw new Error("You can only change your own password.");
      }

      const { password, newPassword, passwordConfirm } = formData;

      const updatedUser = await change({
        db,
        user,
        password,
        newPassword,
        passwordConfirm
      });

      return updatedUser;
    },

    setUserSuspended: async (_root, { userId, isSuspended }, { user, db }) => {
      await superAdminRequired(user);

      await db.primary.transaction(async (trx) => {
        await trx.raw(`update public.user set is_suspended = ? where id = ?`, [
          isSuspended,
          userId
        ]);

        await trx.raw(`delete from user_session where user_id = ?`, [userId]);
      });

      memoizer.invalidate(cacheOpts.GetUser.key, { id: userId });
      memoizer.invalidate(cacheOpts.GetUser.key, {
        auth0Id: user.auth0_id
      });

      const userResult = await getUserById({ id: userId });
      return userResult;
    },

    clearUserSessions: async (_root, { userId }, { user, db }) => {
      await superAdminRequired(user);

      await db.primary.raw(`delete from user_session where user_id = ?`, [
        userId
      ]);

      const userResult = await getUserById({ id: userId });
      return userResult;
    },

    unassignTextsFromUser: async (_root, { membershipId }, { user }) => {
      const userOrg = await r
        .knex("user_organization")
        .where({ id: membershipId })
        .first();
      await accessRequired(user, userOrg.organization_id, "OWNER");

      const assignment_ids = await r
        .knex("assignment")
        .where({ user_id: userOrg.user_id })
        .pluck("id");

      return r
        .knex("campaign_contact")
        .whereIn("assignment_id", assignment_ids)
        .update({ assignment_id: null });
    },

    joinOrganization: async (_root, { organizationUuid }, { user }) => {
      const organization = await r
        .knex("organization")
        .where("uuid", organizationUuid)
        .first();

      if (!organization) {
        logger.info("User tried to join non-existent organization", {
          organizationUuid,
          user
        });
        throw new Error("No such organization.");
      }

      const existingMembership = await r
        .knex("user_organization")
        .where({
          user_id: user.id,
          organization_id: organization.id
        })
        .first();

      if (existingMembership) {
        logger.info("User tried to join organization they're already part of", {
          organizationId: organization.id,
          userId: user.id
        });
        return organization;
      }

      let approvalStatus = RequestAutoApproveType.APPROVAL_REQUIRED;
      try {
        approvalStatus =
          JSON.parse(organization.features || "{}")
            .defaulTexterApprovalStatus || approvalStatus;
      } catch (err) {
        // Stub
      }

      await r.knex("user_organization").insert({
        user_id: user.id,
        organization_id: organization.id,
        role: "TEXTER",
        request_status: approvalStatus.toLowerCase()
      });

      return organization;
    },

    assignUserToCampaign: async (
      _root,
      { organizationUuid, campaignId },
      { user }
    ) => {
      // TODO: re-enable once dynamic assignment is fixed (#548)
      throw new Error("Invalid join request");
      // eslint-disable-next-line no-unreachable
      const campaign = await r
        .knex("campaign")
        .join("organization", "campaign.organization_id", "organization.id")
        .where({
          "campaign.id": parseInt(campaignId, 10),
          "campaign.use_dynamic_assignment": true,
          "organization.uuid": organizationUuid
        })
        .select("campaign.*")
        .first();
      if (!campaign) {
        throw new Error("Invalid join request");
      }
      const assignment = await r
        .knex("assignment")
        .where({
          user_id: user.id,
          campaign_id: campaign.id
        })
        .first();
      if (!assignment) {
        const [newAssignment] = await r
          .knex("assignment")
          .insert({
            user_id: user.id,
            campaign_id: campaign.id,
            max_contacts: config.MAX_CONTACTS_PER_TEXTER
          })
          .returning("*");
        eventBus.emit(EventType.AssignmentCreated, newAssignment);
      }
      return campaign;
    },

    updateDefaultTextingTimezone: async (
      _root,
      { organizationId, defaultTextingTz },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      await r
        .knex("organization")
        .update({
          default_texting_tz: defaultTextingTz
        })
        .where({ id: organizationId });
      cacheableData.organization.clear(organizationId);

      return r.knex("organization").where({ id: organizationId }).first();
    },

    updateTextingHours: async (
      _root,
      { organizationId, textingHoursStart, textingHoursEnd },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      await r
        .knex("organization")
        .update({
          texting_hours_start: textingHoursStart,
          texting_hours_end: textingHoursEnd
        })
        .where({ id: organizationId });
      cacheableData.organization.clear(organizationId);

      return r.knex("organization").where({ id: organizationId }).first();
    },

    updateTextingHoursEnforcement: async (
      _root,
      { organizationId, textingHoursEnforced },
      { user, loaders }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      await r
        .knex("organization")
        .update({
          texting_hours_enforced: textingHoursEnforced
        })
        .where({ id: organizationId });
      await cacheableData.organization.clear(organizationId);

      return loaders.organization.load(organizationId);
    },

    updateTextRequestFormSettings: async (_root, args, { user, loaders }) => {
      const {
        organizationId,
        textRequestFormEnabled,
        textRequestType,
        textRequestMaxCount
      } = args;
      await accessRequired(user, organizationId, "ADMIN");

      const currentOrganization = await r
        .knex("organization")
        .where({ id: organizationId })
        .first();
      let currentFeatures = {};
      try {
        currentFeatures = JSON.parse(currentOrganization.features);
      } catch (ex) {
        // do nothing
      }

      let nextFeatures = {
        textRequestFormEnabled,
        textRequestType,
        textRequestMaxCount
      };
      nextFeatures = { ...currentFeatures, ...nextFeatures };
      await r
        .knex("organization")
        .update({
          features: JSON.stringify(nextFeatures)
        })
        .where({ id: organizationId });

      return loaders.organization.load(organizationId);
    },

    createInvite: async (_root, { user }) => {
      if ((user && user.is_superadmin) || !config.SUPPRESS_SELF_INVITE) {
        const [newInvite] = await r
          .knex("invite")
          .insert({
            is_valid: true,
            hash: uuidv4()
          })
          .returning("*");
        return newInvite;
      }
    },

    createCampaign: async (_root, { campaign }, { user, loaders }) => {
      await accessRequired(
        user,
        campaign.organizationId,
        "ADMIN",
        /* allowSuperadmin= */ true
      );
      const organization = await loaders.organization.load(
        campaign.organizationId
      );
      const { features } = organization;

      const requiresApproval = getOrgFeature(
        "startCampaignRequiresApproval",
        features
      );

      const messagingServices = await r
        .knex("messaging_service")
        .where({ organization_id: campaign.organizationId, active: true });

      if (messagingServices.length === 0) {
        throw new Error("No active messaging services found");
      }

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: campaign.organizationId
      });

      const [origCampaignRecord] = await r
        .knex("campaign")
        .insert({
          organization_id: campaign.organizationId,
          creator_id: user.id,
          title: campaign.title,
          description: campaign.description,
          due_by: campaign.dueBy,
          timezone: parseIanaZone(organization.default_texting_tz),
          is_started: false,
          is_archived: false,
          is_approved: false,
          messaging_service_sid: messagingServices[0].messaging_service_sid
        })
        .returning("*");

      return editCampaign(
        origCampaignRecord.id,
        campaign,
        loaders,
        user,
        origCampaignRecord,
        requiresApproval
      );
    },

    createTemplateCampaign: async (_root, { organizationId }, { user }) => {
      await accessRequired(
        user,
        organizationId,
        "ADMIN",
        /* allowSuperadmin= */ true
      );

      const [templateCampaign] = await r
        .knex("all_campaign")
        .insert({
          organization_id: organizationId,
          creator_id: user.id,
          title: "New Template Campaign",
          description: "",
          is_started: false,
          is_archived: false,
          is_approved: false,
          is_template: true
        })
        .returning("*");

      cacheableData.campaign.reload(templateCampaign.id);
      return templateCampaign;
    },

    copyCampaign: async (_root, { id }, { user, loaders, db }) => {
      const campaignId = parseInt(id, 10);
      const campaign = await loaders.campaign.load(campaignId);
      await accessRequired(user, campaign.organization_id, "ADMIN");

      const [result] = await copyCampaign({
        db,
        campaignId,
        userId: parseInt(user.id, 10)
      });

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: result.organization_id
      });

      return result;
    },

    copyCampaigns: async (
      _root,
      { sourceCampaignId, quantity },
      { user, loaders, db }
    ) => {
      const campaignId = parseInt(sourceCampaignId, 10);
      const campaign = await loaders.campaign.load(campaignId);
      await accessRequired(user, campaign.organization_id, "ADMIN");

      const newCampaigns = await copyCampaign({
        db,
        campaignId,
        userId: parseInt(user.id, 10),
        quantity
      });

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: newCampaigns[0].organization_id
      });

      return newCampaigns;
    },

    unarchiveCampaign: async (_root, { id }, { user, loaders }) => {
      const { organization_id } = await loaders.campaign.load(id);
      await accessRequired(user, organization_id, "ADMIN");

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: organization_id
      });

      const [campaign] = await r
        .knex("campaign")
        .update({ is_archived: false })
        .where({ id })
        .returning("*");

      return campaign;
    },

    archiveCampaign: async (_root, { id }, { user, loaders }) => {
      const { organization_id } = await loaders.campaign.load(id);
      await accessRequired(user, organization_id, "ADMIN");

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: organization_id
      });

      const [campaign] = await r
        .knex("campaign")
        .update({ is_archived: true })
        .where({ id })
        .returning("*");

      return campaign;
    },

    setCampaignApproved: async (_root, { id, approved }, { user, loaders }) => {
      const { organization_id } = await loaders.campaign.load(id);
      await superAdminRequired(user);

      const [campaign] = await r
        .knex("campaign")
        .update({ is_approved: approved })
        .where({ id })
        .returning("*");

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: organization_id
      });

      return campaign;
    },

    startCampaign: async (_root, { id }, { user, loaders }) => {
      const { organization_id, is_approved } = await loaders.campaign.load(id);
      const { features } = await loaders.organization.load(organization_id);
      const requiresApproval = getOrgFeature(
        "startCampaignRequiresApproval",
        features
      );

      if (!user.is_superadmin && requiresApproval && !is_approved) {
        throw new ForbiddenError(
          "Campaign must be approved by superadmin before starting."
        );
      }

      await accessRequired(user, organization_id, "ADMIN", true);

      await memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: organization_id
      });

      const payload = {
        is_started: true,
        ...(user.is_superadmin ? { is_approved: true } : {})
      };

      const [campaign] = await r
        .knex("campaign")
        .update(payload)
        .where({ id })
        .returning("*");

      await sendUserNotification({
        type: Notifications.CAMPAIGN_STARTED,
        campaignId: id
      });

      return campaign;
    },

    editCampaign: async (
      _root,
      { id, campaign: campaignEdits },
      { user, loaders }
    ) => {
      const origCampaign = await r.knex("all_campaign").where({ id }).first();
      const { features } = await loaders.organization.load(
        origCampaign.organization_id
      );
      const requiresApproval = getOrgFeature(
        "startCampaignRequiresApproval",
        features
      );

      // Sometimes, campaign was coming through as having
      // a "null prototype", which caused .hasOwnProperty calls
      // to fail – this fixes it by ensuring its a proper object
      const campaign = { ...campaignEdits };

      await accessRequired(user, origCampaign.organization_id, "ADMIN");

      memoizer.invalidate(cacheOpts.CampaignsList.key, {
        organizationId: campaign.organizationId
      });

      memoizer.invalidate(cacheOpts.CampaignOne.key, {
        campaignId: id
      });

      if (
        origCampaign.is_started &&
        Object.prototype.hasOwnProperty.call(campaign, "contacts") &&
        campaign.contacts
      ) {
        throw new GraphQLError(
          "Not allowed to add contacts after the campaign starts"
        );
      }

      return editCampaign(
        id,
        campaign,
        loaders,
        user,
        origCampaign,
        requiresApproval
      );
    },

    filterLandlines: async (_root, { id }, { user, loaders }) => {
      const campaign = await r.knex("campaign").where({ id }).first();

      await accessRequired(user, campaign.organization_id, "ADMIN");

      if (campaign.is_started) {
        throw new GraphQLError(
          "Not allowed to filter landlines after the campaign starts"
        );
      }

      if (campaign.landlines_filtered) {
        throw new GraphQLError(
          "Landlines already filtered. You may need to wait for current contact upload to finish."
        );
      }

      await addFilterLandlines({ campaignId: campaign.id });

      return loaders.campaign.load(id);
    },

    bulkUpdateScript: async (
      _root,
      { organizationId, findAndReplace },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      const scriptUpdatesResult = await r.knex.transaction(async (trx) => {
        const { searchString, replaceString } = findAndReplace;

        const interactionStepsToChange = await getStepsToUpdate(
          trx,
          findAndReplace
        );

        const scriptUpdates = [];
        for (const step of interactionStepsToChange) {
          const script_options = step.script_options.map((scriptOption) => {
            const newValue = replaceAll(
              scriptOption,
              searchString,
              replaceString
            );
            if (newValue !== scriptOption) {
              scriptUpdates.push({
                campaignId: step.campaign_id,
                found: scriptOption,
                replaced: newValue
              });
            }
            return newValue;
          });

          await r
            .knex("interaction_step")
            .transacting(trx)
            .update({ script_options })
            .where({ id: step.id });
        }

        return scriptUpdates;
      });

      return scriptUpdatesResult;
    },

    deleteJob: async (_root, { campaignId, id }, { user }) => {
      const campaign = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first();
      await accessRequired(user, campaign.organization_id, "ADMIN");
      await r.knex.transaction(async (trx) => {
        await trx("job_request")
          .where({
            id,
            campaign_id: campaignId
          })
          .delete();

        // Delete any associated Graphile Worker job
        await trx("graphile_worker.jobs")
          .whereRaw(
            `
              (
                ((payload->'__context'->>'job_request_id')::integer = ?)
                or (key = ?)
              )
            `,
            [id, id]
          )
          .del();
      });
      return { id };
    },

    createCannedResponse: async (_root, { cannedResponse }, { user }) => {
      const campaignId = parseInt(cannedResponse.campaignId, 10);
      const { organization_id } = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first(["organization_id"]);
      await accessRequired(user, organization_id, "TEXTER");

      await r.knex("canned_response").insert({
        campaign_id: campaignId,
        user_id: cannedResponse.userId,
        title: cannedResponse.title,
        text: cannedResponse.text
      });

      cacheableData.cannedResponse.clearQuery({
        campaignId: cannedResponse.campaignId,
        userId: cannedResponse.userId
      });
    },

    createOrganization: async (
      _root,
      { name, userId, inviteId },
      { loaders, user }
    ) => {
      authRequired(user);
      const invite = await loaders.invite.load(inviteId);
      if (!invite || !invite.is_valid) {
        throw new GraphQLError("That invitation is no longer valid");
      }

      const { payload = {} } = invite;

      return r.knex.transaction(async (trx) => {
        const orgFeatures = {
          textRequestFormEnabled: false,
          textRequestType: TextRequestType.UNSENT,
          maxRequestCount: 100,
          defaulTexterApprovalStatus: RequestAutoApproveType.APPROVAL_REQUIRED
        };
        if (payload.org_features) {
          const { switchboard_lrn_api_key } = payload.org_features;
          if (switchboard_lrn_api_key) {
            orgFeatures.numbersApiKey = switchboard_lrn_api_key;
          }
        }

        const insertResult = await trx("organization")
          .insert({
            name,
            uuid: uuidv4(),
            features: JSON.stringify(orgFeatures)
          })
          .returning("*");

        const newOrganization = insertResult[0];

        const superadminIds = await trx("user")
          .where({ is_superadmin: true })
          .pluck("id");
        const ownerIds = new Set(superadminIds.concat([parseInt(userId, 10)]));

        await trx("user_organization").insert(
          [...ownerIds].map((ownerId) => ({
            role: "OWNER",
            user_id: ownerId,
            organization_id: newOrganization.id
          }))
        );

        if (invite.makeSuperadmin) {
          await trx("user")
            .update({
              is_superadmin: true
            })
            .where({ id: userId });
        }

        await trx("invite")
          .update({
            is_valid: false
          })
          .where({
            id: parseInt(inviteId, 10)
          });

        await trx("tag").insert({
          organization_id: newOrganization.id,
          title: "Escalated",
          description:
            "Escalation is meant for situations where you have exhausted all available help resources and still do not know how to respond.",
          confirmation_steps: [],
          is_assignable: false,
          is_system: true
        });

        if (payload.messaging_services) {
          await trx("messaging_service").insert(
            payload.messaging_services.map((service) => ({
              messaging_service_sid: service.messaging_service_sid,
              organization_id: newOrganization.id,
              account_sid: service.account_sid,
              encrypted_auth_token: service.encrypted_auth_token,
              service_type: service.service_type
            }))
          );
        }

        return newOrganization;
      });
    },

    editOrganization: async (_root, { id, input: { name } }, { user, db }) => {
      const orgId = parseInt(id, 10);
      await accessRequired(user, orgId, "OWNER", true);

      if (name) {
        await db.primary.raw(`update organization set name = ? where id = ?`, [
          name,
          orgId
        ]);
      }

      const result = await db
        .primary("organization")
        .where({ id: orgId })
        .first();
      return result;
    },

    editCampaignContactMessageStatus: async (
      _root,
      { messageStatus, campaignContactId },
      { loaders, user }
    ) => {
      return editCampaignContactMessageStatus(
        r.knex,
        campaignContactId,
        messageStatus,
        loaders,
        user
      );
    },

    getAssignmentContacts: async (
      _root,
      { assignmentId, contactIds, findNew: _findNew },
      { user }
    ) => {
      await assignmentRequired(user, assignmentId);

      const contacts = await r
        .knex("campaign_contact")
        .select("*")
        .whereIn("id", contactIds)
        .where({ assignment_id: assignmentId });

      const messages = await r
        .knex("message")
        .select(
          "id",
          "text",
          "is_from_contact",
          "created_at",
          "campaign_contact_id"
        )
        .whereIn("campaign_contact_id", contactIds)
        .orderBy("created_at", "asc");

      const messagesByContactId = groupBy(
        messages,
        (x) => x.campaign_contact_id
      );

      const shouldFetchTagsAndQuestionResponses =
        contacts.filter((c) => c.message_status !== "needsMessage").length > 0;

      const tags = shouldFetchTagsAndQuestionResponses
        ? await r
            .knex("tag")
            .select("tag.*")
            .select("campaign_contact_id")
            .join(
              "campaign_contact_tag",
              "campaign_contact_tag.tag_id",
              "=",
              "tag.id"
            )
            .whereIn("campaign_contact_tag.campaign_contact_id", contactIds)
        : [];

      const tagsByContactId = groupBy(tags, (x) => x.campaign_contact_id);

      const questionResponses = shouldFetchTagsAndQuestionResponses
        ? await r
            .knex("question_response")
            .join(
              "interaction_step as istep",
              "question_response.interaction_step_id",
              "istep.id"
            )
            .whereIn("question_response.campaign_contact_id", contactIds)
            .select(
              "value",
              "interaction_step_id",
              "istep.question as istep_question",
              "istep.id as istep_id",
              "campaign_contact_id"
            )
        : [];

      const questionResponsesByContactId = groupBy(
        questionResponses,
        (x) => x.campaign_contact_id
      );

      const contactsById = contacts.reduce(
        (acc, c) =>
          Object.assign(acc, {
            [c.id]: {
              ...c,
              messages: messagesByContactId[c.id] || [],
              contactTags: tagsByContactId[c.id] || [],
              questionResponseValues: (
                questionResponsesByContactId[c.id] || []
              ).map((qr) => ({
                value: qr.value,
                interaction_step_id: qr.interaction_step_id,
                id: qr.interaction_step_id,
                question: qr.istep_question
              }))
            }
          }),
        {}
      );

      return contactIds.map((cid) => contactsById[cid]);
    },

    findNewCampaignContact: async (
      _root,
      { assignmentId, numberContacts },
      { user }
    ) => {
      // TODO: re-enable once dynamic assignment is fixed (#548)
      throw new GraphQLError("Invalid assignment");
      /* This attempts to find a new contact for the assignment, in the case that useDynamicAssigment == true */
      // eslint-disable-next-line no-unreachable
      const assignment = await r
        .knex("assignment")
        .where({ id: assignmentId })
        .first();
      if (assignment.user_id !== user.id) {
        throw new GraphQLError("Invalid assignment");
      }
      const campaign = await r
        .knex("campaign")
        .where({ id: assignment.campaign_id })
        .first();
      if (!campaign.use_dynamic_assignment || assignment.max_contacts === 0) {
        return { found: false };
      }

      const contactsCount = await r.getCount(
        r
          .knex("campaign_contact")
          .where({ assignment_id: assignmentId })
          .whereRaw("archived = false") // partial index friendly
      );

      numberContacts = numberContacts || 1;
      if (
        assignment.max_contacts &&
        contactsCount + numberContacts > assignment.max_contacts
      ) {
        numberContacts = assignment.max_contacts - contactsCount;
      }
      // Don't add more if they already have that many
      const result = await r.getCount(
        r
          .knex("campaign_contact")
          .where({
            assignment_id: assignmentId,
            message_status: "needsMessage",
            is_opted_out: false
          })
          .whereRaw("archived = false") // partial index friendly
      );

      if (result >= numberContacts) {
        return { found: false };
      }

      const updateResult = await r
        .knex("campaign_contact")
        .where(
          "id",
          "in",
          r
            .knex("campaign_contact")
            .where({
              assignment_id: null,
              campaign_id: campaign.id
            })
            .whereRaw("archived = false") // partial index friendly
            .limit(numberContacts)
            .select("id")
        )
        .update({ assignment_id: assignmentId })
        .catch(logger.error);

      if (updateResult > 0) {
        return { found: true };
      }
      return { found: false };
    },
    tagConversation: async (_root, { campaignContactId, tag }, { user }) => {
      const campaignContact = await r
        .knex("campaign_contact")
        .join("campaign", "campaign.id", "campaign_contact.campaign_id")
        .where({ "campaign_contact.id": campaignContactId })
        .first(["campaign_contact.*", "campaign.organization_id"]);
      try {
        await assignmentRequired(user, campaignContact.assignment_id);
      } catch (err) {
        accessRequired(user, campaignContact.organization_id, "SUPERVOLUNTEER");
      }

      const { addedTagIds, removedTagIds } = tag;
      const tagsToInsert = addedTagIds.map((tagId) => ({
        campaign_contact_id: campaignContactId,
        tag_id: tagId,
        tagger_id: user.id
      }));
      await Promise.all([
        await r
          .knex("campaign_contact_tag")
          .where({ campaign_contact_id: parseInt(campaignContactId, 10) })
          .whereIn("tag_id", removedTagIds)
          .del(),
        await r.knex("campaign_contact_tag").insert(tagsToInsert)
      ]);

      // See if any of the newly applied tags are is_assignable = false
      const newlyAssignedTagsThatShouldUnassign = await r
        .knex("tag")
        .select("id")
        .whereIn("id", addedTagIds)
        .where({ is_assignable: false });

      const currentlyEscalating =
        newlyAssignedTagsThatShouldUnassign.length > 0;

      if (tag.message) {
        try {
          const checkOptOut = true;
          const checkAssignment = false;
          await sendMessage(
            r.knex,
            user,
            campaignContactId,
            tag.message,
            checkOptOut,
            checkAssignment,
            currentlyEscalating
          );
        } catch (error) {
          // Log the sendMessage error, but return successful opt out creation
          logger.error("Error sending message for tag", error);
        }
      }

      const webhookUrls = await r
        .knex("tag")
        .whereIn("id", addedTagIds)
        .pluck("webhook_url")
        .then((urls) => urls.filter((url) => url.length > 0));

      await notifyOnTagConversation(campaignContactId, user.id, webhookUrls);

      if (currentlyEscalating) {
        await r
          .knex("campaign_contact")
          .update({ assignment_id: null })
          .where({ id: parseInt(campaignContactId, 10) });
      }

      return campaignContact;
    },

    createOptOut: async (
      _root,
      { optOut, campaignContactId },
      { loaders, user }
    ) => {
      return createOptOut(r.knex, campaignContactId, optOut, loaders, user);
    },

    removeOptOut: async (_root, { cell }, { user }) => {
      // We assume that OptOuts are shared across orgs
      // const sharingOptOuts = config.OPTOUTS_SHARE_ALL_ORGS

      // Authorization (checking across all organizations)
      let userRoles = await r
        .knex("user_organization")
        .where({ user_id: user.id })
        .select("role");
      userRoles = userRoles.map((role) => role.role);
      userRoles = Array.from(new Set(userRoles));
      const isAdmin = hasRole("SUPERVOLUNTEER", userRoles);
      if (!isAdmin) {
        throw new GraphQLError(
          "You are not authorized to access that resource."
        );
      }

      const contactIds = await r.knex.transaction(async (trx) => {
        // Remove all references in the opt out table
        const optOuts = r
          .knex("opt_out")
          .transacting(trx)
          .where({ cell })
          .del();

        // Update all "cached" values for campaign contacts
        // TODO - MySQL Specific. Fetching contactIds can be done in a subquery
        const contactUpdates = r
          .knex("campaign_contact")
          .transacting(trx)
          .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
          .where({
            "campaign_contact.cell": cell,
            "campaign.is_archived": false
          })
          .pluck("campaign_contact.id")
          .then((contactIdsRes) => {
            return (
              r
                .knex("campaign_contact")
                .transacting(trx)
                .whereIn("id", contactIdsRes)
                .update({ is_opted_out: false })
                // Return updated contactIds from Promise chain
                .then((_ignore) => contactIdsRes)
            );
          });

        const [_optOutRes, contactIdsRes] = await Promise.all([
          optOuts,
          contactUpdates
        ]);
        return contactIdsRes;
      });

      // We don't care about Redis
      // await cacheableData.optOut.clearCache(...)

      return contactIds.map((contactId) => ({
        id: contactId,
        is_opted_out: false
      }));
    },

    bulkSendMessages: async (_root, args, loaders) => {
      if (!config.ALLOW_SEND_ALL || !config.NOT_IN_USA) {
        logger.error("Not allowed to send all messages at once");
        throw new GraphQLError("Not allowed to send all messages at once");
      }

      const assignmentId = parseInt(args.assignmentId, 10);

      const assignment = await r
        .knex("assignment")
        .where({ id: assignmentId })
        .first();
      // Assign some contacts
      await rootMutations.RootMutation.findNewCampaignContact(
        _,
        {
          assignmentId,
          numberContacts: Number(config.BULK_SEND_CHUNK_SIZE) - 1
        },
        loaders
      );

      const contacts = await r
        .knex("campaign_contact")
        .where({
          message_status: "needsMessage",
          assignment_id: assignmentId
        })
        .whereRaw("archived = false") // partial index friendly
        .orderByRaw("updated_at")
        .limit(config.BULK_SEND_CHUNK_SIZE);

      const texter = camelCaseKeys(
        await r.knex("user").where({ id: assignment.user_id }).first()
      );
      const customFields = Object.keys(JSON.parse(contacts[0].custom_fields));

      const campaignVariables = await r
        .knex("campaign_variable")
        .where({ campaign_id: assignment.campaign_id });

      const _contactMessages = await contacts.map(async (contact) => {
        const script = await campaignContactResolvers.CampaignContact.currentInteractionStepScript(
          contact
        );
        contact.customFields = contact.custom_fields;
        const text = applyScript({
          contact: camelCaseKeys(contact),
          texter,
          script,
          customFields,
          campaignVariables
        });
        const contactMessage = {
          contactNumber: contact.cell,
          userId: assignment.user_id,
          text,
          assignmentId
        };
        await rootMutations.RootMutation.sendMessage(
          _,
          { message: contactMessage, campaignContactId: contact.id },
          loaders
        );
      });

      return [];
    },

    sendMessage: async (_root, { message, campaignContactId }, { user }) => {
      return sendMessage(r.knex, user, campaignContactId, message);
    },

    deleteQuestionResponses: async (
      _root,
      { interactionStepIds, campaignContactId },
      { loaders, user }
    ) => {
      return deleteQuestionResponses(
        r.knex,
        campaignContactId,
        interactionStepIds,
        loaders,
        user
      );
    },

    updateQuestionResponses: async (
      _root,
      { questionResponses, campaignContactId },
      { loaders }
    ) => {
      return updateQuestionResponses(
        r.knex,
        campaignContactId,
        questionResponses,
        loaders
      );
    },

    handleConversation: async (
      _root,
      {
        campaignContactId,
        message,
        questionResponses,
        interactionStepIdsForDeletedQuestionResponses,
        optOut,
        closeConversation
      },
      { loaders, user }
    ) => {
      const promises = [];

      await r.knex.transaction(async (trx) => {
        if (message) {
          promises.push(sendMessage(trx, user, campaignContactId, message));
        }

        if (questionResponses) {
          promises.push(
            updateQuestionResponses(
              trx,
              campaignContactId,
              questionResponses,
              loaders
            )
          );
        }

        if (interactionStepIdsForDeletedQuestionResponses) {
          promises.push(
            deleteQuestionResponses(
              trx,
              campaignContactId,
              interactionStepIdsForDeletedQuestionResponses,
              loaders,
              user
            )
          );
        }

        if (optOut) {
          promises.push(
            createOptOut(trx, campaignContactId, optOut, loaders, user)
          );
        }

        if (closeConversation) {
          promises.push(
            editCampaignContactMessageStatus(
              trx,
              campaignContactId,
              optOut,
              loaders,
              user
            )
          );
        }

        await Promise.all(promises);
      });

      const contact = await loaders.campaignContact.load(campaignContactId);
      return contact;
    },

    markForSecondPass: async (
      _ignore,
      { campaignId, input: { excludeAgeInHours, excludeNewer } },
      { user }
    ) => {
      // verify permissions
      const campaign = await r
        .knex("campaign")
        .where({ id: parseInt(campaignId, 10) })
        .first(["organization_id", "is_archived", "autosend_status"]);

      const organizationId = campaign.organization_id;

      await accessRequired(user, organizationId, "ADMIN", true);

      if (!["complete", "unstarted"].includes(campaign.autosend_status)) {
        throw new Error(
          campaign.autosend_status === "paused"
            ? `Cannot mark camapign ${campaignId} for a second pass, autosending is currently paused. When it's resumed, some contacts will receive duplicate messages`
            : `Cannot mark camapign ${campaignId} for a second pass, autosending is currently ongoing. As a result, some contacts will receive duplicate messages`
        );
      }

      await r
        .knex("campaign")
        .update({ autosend_status: "unstarted" })
        .where({ id: parseInt(campaignId, 10) });

      const queryArgs = [parseInt(campaignId, 10)];
      if (excludeAgeInHours) {
        queryArgs.push(parseFloat(excludeAgeInHours));
      }

      const excludeNewerSql = `
          and not exists (
            select
              cell
            from
              campaign_contact as newer_contact
            where
              newer_contact.cell = current_contact.cell
              and newer_contact.created_at > current_contact.created_at
          )
      `;

      /**
       * "Mark Campaign for Second Pass", will only mark contacts for a second
       * pass that do not have a more recently created membership in another campaign.
       * Using SQL injection to avoid passing archived as a binding
       * Should help with guaranteeing partial index usage
       */
      const updateSql = `
        update
          campaign_contact as current_contact
        set
          message_status = 'needsMessage'
        where current_contact.campaign_id = ?
          and current_contact.message_status = 'messaged'
          and current_contact.archived = ${campaign.is_archived}
          ${excludeNewer ? excludeNewerSql : ""}
          and not exists (
            select 1
            from message
            where current_contact.id = message.campaign_contact_id
              and is_from_contact = true
          )
          ${
            excludeAgeInHours
              ? "and current_contact.updated_at < now() - interval '?? hour'"
              : ""
          }
        ;
      `;

      const updateResultRaw = await r.knex.raw(updateSql, queryArgs);
      const updateResult = updateResultRaw.rowCount;

      return `Marked ${updateResult} campaign contacts for a second pass.`;
    },

    startAutosending: async (_ignore, { campaignId }, { user }) => {
      const id = parseInt(campaignId, 10);

      const campaign = await r
        .knex("campaign")
        .where({ id })
        .first(["organization_id", "is_archived", "autosend_status"]);

      const organizationId = campaign.organization_id;

      await accessRequired(user, organizationId, "ADMIN", true);

      if (["sending", "complete"].includes(campaign.autosend_status)) {
        throw new Error(
          `Cannot queue campaign ${campaignId} for autosending: campaign ${campaignId}'s autosend status is already ${campaign.autosend_status}`
        );
      }

      const result = await r.knex.transaction(async (trx) => {
        const [updatedCampaign] = await trx("campaign")
          .update({ autosend_status: "sending", autosend_user_id: user.id })
          .where({ id })
          .returning("*");

        const taskIdentifier = "queue-autosend-initials";
        await trx.raw(`select graphile_worker.add_job(?)`, [taskIdentifier]);

        return updatedCampaign;
      });

      return result;
    },

    pauseAutosending: async (_ignore, { campaignId }, { user }) => {
      const id = parseInt(campaignId, 10);

      const campaign = await r
        .knex("campaign")
        .where({ id })
        .first(["organization_id", "is_archived", "autosend_status"]);

      const organizationId = campaign.organization_id;

      await accessRequired(user, organizationId, "ADMIN", true);

      let updatedCampaign;

      if (campaign.autosend_status === "sending") {
        const [updatedCampaignResult] = await r
          .knex("campaign")
          .update({ autosend_status: "paused" })
          .where({ id })
          .returning("*");

        updatedCampaign = updatedCampaignResult;

        await r.knex.raw(
          `
            select count(*)
            from (
              select graphile_worker.remove_job(key)
              from graphile_worker.jobs
              where task_identifier = 'retry-interaction-step'
                and payload->>'campaignId' = ?
            ) deleted_jobs
          `,
          [id]
        );
      }

      const result = updatedCampaign || campaign;
      return result;
    },

    unMarkForSecondPass: async (_ignore, { campaignId }, { user }) => {
      // verify permissions
      const campaign = await r
        .knex("campaign")
        .where({ id: parseInt(campaignId, 10) })
        .first(["organization_id", "is_archived"]);

      const organizationId = campaign.organization_id;

      await accessRequired(user, organizationId, "ADMIN", true);

      /**
       * "Un-Mark Campaign for Second Pass", will only mark contacts as messaged
       * if they are currently needsMessage and have been sent a message and have not replied
       *
       * Using SQL injection to avoid passing archived as a binding
       * Should help with guaranteeing partial index usage
       */
      const updateResultRaw = await r.knex.raw(
        `
        update
          campaign_contact
        set
          message_status = 'messaged'
        where campaign_contact.campaign_id = ?
          and campaign_contact.message_status = 'needsMessage'
          and campaign_contact.archived = ${campaign.is_archived}
          and exists (
            select 1
            from message
            where message.campaign_contact_id = campaign_contact.id
              and is_from_contact = false
          ) 
          and not exists (
            select 1
            from message
            where message.campaign_contact_id = campaign_contact.id
              and is_from_contact = true
          )
        ;
      `,
        [parseInt(campaignId, 10)]
      );

      const updateResult = updateResultRaw.rowCount;

      return `Un-Marked ${updateResult} campaign contacts for a second pass.`;
    },

    deleteNeedsMessage: async (_ignore, { campaignId }, { user }) => {
      // verify permissions
      const campaign = await r
        .knex("campaign")
        .where({ id: parseInt(campaignId, 10) })
        .first(["organization_id", "is_archived"]);

      const organizationId = campaign.organization_id;

      await accessRequired(user, organizationId, "ADMIN", true);

      /**
       * deleteNeedsMessage will only delete contacts
       * if they are currently needsMessage and have NOT been sent a message
       *
       * Using SQL injection to avoid passing archived as a binding
       * Should help with guaranteeing partial index usage
       */
      const deleteResult = await r.knex.raw(
        `
        delete from campaign_contact
        where campaign_contact.campaign_id = ?
          and campaign_contact.message_status = 'needsMessage'
          and campaign_contact.archived = ${campaign.is_archived}
          and not exists (
            select 1
            from message
            where message.campaign_contact_id = campaign_contact.id
          )
        ;
      `,
        [parseInt(campaignId, 10)]
      );

      const updateResult = deleteResult.rowCount;

      return `Deleted ${updateResult} unmessaged campaign contacts`;
    },

    insertLinkDomain: async (
      _ignore,
      { organizationId, domain, maxUsageCount },
      { user }
    ) => {
      // verify permissions
      await accessRequired(
        user,
        organizationId,
        "OWNER",
        /* superadmin */ true
      );

      const insertResult = await r
        .knex("link_domain")
        .insert({
          organization_id: organizationId,
          max_usage_count: maxUsageCount,
          domain
        })
        .returning("*");

      return insertResult[0];
    },

    updateLinkDomain: async (
      _ignore,
      { organizationId, domainId, payload },
      { user }
    ) => {
      // verify permissions
      await accessRequired(
        user,
        organizationId,
        "OWNER",
        /* superadmin */ true
      );

      const { maxUsageCount, isManuallyDisabled } = payload;
      if (maxUsageCount === undefined && isManuallyDisabled === undefined)
        throw new Error("Must supply at least one field to update.");

      let query = r
        .knex("link_domain")
        .where({
          id: domainId,
          organization_id: organizationId
        })
        .returning("*");
      if (maxUsageCount !== undefined)
        query = query.update({ max_usage_count: maxUsageCount });
      if (isManuallyDisabled !== undefined)
        query = query.update({ is_manually_disabled: isManuallyDisabled });

      const linkDomainResult = await query;
      return linkDomainResult[0];
    },

    deleteLinkDomain: async (
      _ignore,
      { organizationId, domainId },
      { user }
    ) => {
      // verify permissions
      await accessRequired(
        user,
        organizationId,
        "OWNER",
        /* superadmin */ true
      );

      await r
        .knex("link_domain")
        .where({
          id: domainId,
          organization_id: organizationId
        })
        .del();

      return true;
    },

    megaReassignCampaignContacts: async (
      _ignore,
      { organizationId, campaignIdsContactIds, newTexterUserIds },
      { user }
    ) => {
      // verify permissions
      await accessRequired(
        user,
        organizationId,
        "ADMIN",
        /* superadmin */ true
      );

      if (newTexterUserIds == null) {
        const campaignContactIdsToUnassign = campaignIdsContactIds.map(
          (cc) => cc.campaignContactId
        );

        await r
          .knex("campaign_contact")
          .update({ assignment_id: null })
          .whereIn("id", campaignContactIdsToUnassign);

        return true;
      }

      // group contactIds by campaign
      // group messages by campaign
      const aggregated = {};
      campaignIdsContactIds.forEach((campaignIdContactId) => {
        aggregated[campaignIdContactId.campaignContactId] = {
          campaign_id: campaignIdContactId.campaignId,
          messages: campaignIdContactId.messageIds
        };
      });

      const result = Object.entries(aggregated);
      const numberOfCampaignContactsToReassign = result.length;
      const numberOfCampaignContactsPerNextTexter = Math.ceil(
        numberOfCampaignContactsToReassign / newTexterUserIds.length
      );
      const chunks = _.chunk(result, numberOfCampaignContactsPerNextTexter);

      for (const [idx, chunk] of chunks.entries()) {
        const byCampaignId = _.groupBy(chunk, (x) => x[1].campaign_id);
        const campaignIdContactIdsMap = new Map();
        const campaignIdMessageIdsMap = new Map();

        Object.keys(byCampaignId).forEach((campaign_id) => {
          chunk
            .filter((x) => x[1].campaign_id === campaign_id)
            .forEach((x) => {
              if (!campaignIdContactIdsMap.has(campaign_id))
                campaignIdContactIdsMap.set(campaign_id, []);
              if (!campaignIdMessageIdsMap.has(campaign_id))
                campaignIdMessageIdsMap.set(campaign_id, []);
              campaignIdContactIdsMap.get(campaign_id).push(x[0]);
              x[1].messages.forEach((message_id) => {
                campaignIdMessageIdsMap.get(campaign_id).push(message_id);
              });
            });
        });

        await reassignConversations(
          campaignIdContactIdsMap,
          campaignIdMessageIdsMap,
          newTexterUserIds[idx]
        );
      }

      return true;
    },

    megaBulkReassignCampaignContacts: async (
      _root,
      {
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        tagsFilter,
        contactsFilter,
        contactNameFilter,
        newTexterUserIds
      },
      { user }
    ) => {
      // verify permissions
      await accessRequired(
        user,
        organizationId,
        "ADMIN",
        /* superadmin */ true
      );

      const campaignContactIdsToMessageIds = await getCampaignIdMessageIdsAndCampaignIdContactIdsMapsChunked(
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        tagsFilter,
        contactsFilter,
        contactNameFilter
      );

      if (newTexterUserIds == null) {
        const campaignContactIdsToUnassign = campaignContactIdsToMessageIds.map(
          ([ccId, _ignore]) => ccId
        );

        await r
          .knex("campaign_contact")
          .update({ assignment_id: null })
          .whereIn("id", campaignContactIdsToUnassign);

        return true;
      }

      const numberOfCampaignContactsToReassign =
        campaignContactIdsToMessageIds.length;
      const numberOfCampaignContactsPerNextTexter = Math.ceil(
        numberOfCampaignContactsToReassign / newTexterUserIds.length
      );
      const chunks = _.chunk(
        campaignContactIdsToMessageIds,
        numberOfCampaignContactsPerNextTexter
      );
      for (const [idx, chunk] of chunks.entries()) {
        const byCampaignId = _.groupBy(chunk, (x) => x[1].campaign_id);
        const campaignIdContactIdsMap = new Map();
        const campaignIdMessageIdsMap = new Map();

        Object.keys(byCampaignId).forEach((campaign_id) => {
          chunk
            .filter((x) => x[1].campaign_id === parseInt(campaign_id, 10))
            .forEach((x) => {
              if (!campaignIdContactIdsMap.has(campaign_id))
                campaignIdContactIdsMap.set(campaign_id, []);
              if (!campaignIdMessageIdsMap.has(campaign_id))
                campaignIdMessageIdsMap.set(campaign_id, []);
              campaignIdContactIdsMap.get(campaign_id).push(x[0]);
              x[1].messages.forEach((message_id) => {
                campaignIdMessageIdsMap.get(campaign_id).push(message_id);
              });
            });
        });

        await reassignConversations(
          campaignIdContactIdsMap,
          campaignIdMessageIdsMap,
          newTexterUserIds[idx]
        );
      }

      return true;
    },

    requestTexts: async (_root, { count, ...stringIds }, { user }) => {
      const organizationId = parseInt(stringIds.organizationId, 10);
      const preferredTeamId = parseInt(stringIds.preferredTeamId, 10);
      const myAssignmentTarget = await myCurrentAssignmentTarget(
        user.id,
        organizationId
      );

      const { role } = await r
        .knex("user_organization")
        .where({
          user_id: user.id,
          organization_id: organizationId
        })
        .first(["role"]);

      if (role === UserRoleType.SUSPENDED) {
        return "You don't have the permission to request texts";
      }

      if (!myAssignmentTarget) {
        return "No texts available at the moment";
      }

      return r.knex.transaction(async (trx) => {
        const [pendingAssignmentRequest] = await trx("assignment_request")
          .insert({
            user_id: user.id,
            organization_id: organizationId,
            amount: count,
            preferred_team_id: preferredTeamId
          })
          .returning("*");

        const { request_status } = await trx("user_organization")
          .where({
            user_id: user.id,
            organization_id: organizationId
          })
          .first(["request_status"]);

        // Only trigger webhook if approval is required (may want to allow expanding list in future)
        if (["approval_required"].includes(request_status)) {
          await notifyAssignmentCreated({
            userId: user.id,
            organizationId,
            count
          }).catch((err) => {
            logger.error("Error submitting external assignment request: ", err);

            if (config.ASSIGNMENT_REQUESTED_URL_REQUIRED) {
              const message = err.response
                ? err.response.body.message
                : err.message;
              throw new Error(`Could not submit external requst: ${message}`);
            }
          });
        }

        if (config.AUTO_HANDLE_REQUESTS) {
          const worker = await getWorker();
          await worker.addJob(
            "handle-autoassignment-request",
            pendingAssignmentRequest
          );
        }

        return "Created";
      });
    },
    releaseMessages: async (
      _root,
      { campaignId, target, ageInHours },
      { user: _user }
    ) => {
      let messageStatus;
      switch (target) {
        case "UNSENT":
          messageStatus = "needsMessage";
          break;
        case "UNREPLIED":
          messageStatus = "needsResponse";
          break;

        default:
          throw new Error(`Unknown ReleaseActionTarget '${target}'`);
      }

      let ageInHoursAgo;
      if (ageInHours) {
        ageInHoursAgo = new Date();
        ageInHoursAgo.setHours(new Date().getHours() - ageInHours);
        ageInHoursAgo = ageInHoursAgo.toISOString();
      }

      const campaign = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first(["organization_id", "is_archived"]);

      const updatedCount = await r.knex.transaction(async (trx) => {
        const queryArgs = [parseInt(campaignId, 10), messageStatus];
        if (ageInHours) queryArgs.push(ageInHoursAgo);

        /**
         * Using SQL injection to avoid passing archived as a binding
         * Should help with guaranteeing partial index usage
         */
        const rawResult = await trx.raw(
          `
          update
            campaign_contact
          set
            assignment_id = null
          from
            assignment, campaign
          where
            campaign_contact.campaign_id = ?
            and campaign.id = campaign_contact.campaign_id
            and assignment.id = campaign_contact.assignment_id
            and is_opted_out = false
            and message_status = ?
            and archived = ${campaign.is_archived}
            and not exists (
              select 1
              from campaign_contact_tag
              join tag on tag.id = campaign_contact_tag.tag_id
              where tag.is_assignable = false
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
            )
            ${ageInHours ? "and campaign_contact.updated_at < ?" : ""}
        `,
          queryArgs
        );

        return rawResult.rowCount;
      });

      return `Released ${updatedCount} ${target.toLowerCase()} messages for reassignment`;
    },
    releaseAllUnhandledReplies: async (
      _root,
      {
        organizationId,
        ageInHours,
        releaseOnRestricted,
        limitToCurrentlyTextableContacts
      },
      { user }
    ) => {
      await accessRequired(user, organizationId, "ADMIN", true);

      const releaseOnLimitAssignmentToTeams =
        releaseOnRestricted != null ? releaseOnRestricted : false;

      const limitToIsTextableNow =
        limitToCurrentlyTextableContacts != null
          ? limitToCurrentlyTextableContacts
          : true;

      /*
       * Using SQL injection to avoid passing archived as a binding
       * Should help with guaranteeing partial index usage
       */
      const rawResult = await r.knex.raw(
        `
          with update_result as (
            update
              campaign_contact
            set
              assignment_id = null
            from
              campaign
            where
              campaign_contact.campaign_id = campaign.id
              and campaign.organization_id = ?
              and (? or campaign.limit_assignment_to_teams = false)
              and not exists (
                select 1
                from message
                where is_from_contact = false
                  and campaign_contact_id = campaign_contact.id
                  and created_at > now() - (? * interval '1 hours')
              )
              and is_opted_out = false
              and message_status = 'needsResponse'
              and archived = false
              and not exists (
                select 1
                from campaign_contact_tag
                join tag on tag.id = campaign_contact_tag.tag_id
                where tag.is_assignable = false
                  and campaign_contact_tag.campaign_contact_id = campaign_contact.id
              )
              and (
                ? or contact_is_textable_now(
                  coalesce(campaign_contact.timezone, spoke_tz_to_iso_tz(campaign.timezone)),
                  campaign.texting_hours_start,
                  campaign.texting_hours_end,
                  extract('hour' from current_timestamp at time zone campaign.timezone) < campaign.texting_hours_end
                  and
                  extract('hour' from current_timestamp at time zone campaign.timezone) > campaign.texting_hours_start
                )
              )
            returning 1, campaign_id
          )
          select
            count(*) as contact_count,
            count(distinct campaign_id) as campaign_count
          from
            update_result
        `,
        [
          parseInt(organizationId, 10),
          releaseOnLimitAssignmentToTeams,
          ageInHours || 0,
          limitToIsTextableNow
        ]
      );

      const result = rawResult.rows[0];
      return {
        contactCount: result.contact_count,
        campaignCount: result.campaign_count
      };
    },
    deleteCampaignOverlap: async (
      _root,
      { organizationId, campaignId, overlappingCampaignId },
      { user }
    ) => {
      await accessRequired(
        user,
        organizationId,
        "ADMIN",
        /* superadmin */ true
      );

      const { deletedRowCount, remainingCount } = await r.knex.transaction(
        async (trx) => {
          // Get total count, including second pass contacts, locking for subsequent delete
          let remainingCountRes = await queryCampaignOverlapCount(
            campaignId,
            overlappingCampaignId,
            trx
          );

          // Delete, excluding second pass contacts that have already been messaged
          const { rowCount: deletedRowCountRes } = await trx.raw(
            `
            delete from
              campaign_contact
            where
              campaign_contact.campaign_id = ?
              and not exists (
                select 1
                from message
                where campaign_contact_id = campaign_contact.id
              )
              and exists (
                select 1
                from campaign_contact as other_campaign_contact
                where other_campaign_contact.campaign_id = ?
                  and other_campaign_contact.cell = campaign_contact.cell
              );`,
            [campaignId, overlappingCampaignId]
          );

          remainingCountRes -= deletedRowCountRes;

          return {
            deletedRowCount: deletedRowCountRes,
            remainingCount: remainingCountRes
          };
        }
      );

      return {
        campaign: { id: overlappingCampaignId },
        deletedRowCount,
        remainingCount
      };
    },
    deleteManyCampaignOverlap: async (
      _root,
      { organizationId, campaignId, overlappingCampaignIds },
      { user }
    ) => {
      await accessRequired(
        user,
        organizationId,
        "ADMIN",
        /* superadmin */ true
      );

      // Delete, excluding second pass contacts that have already been messaged
      const { rowCount: deletedRowCount } = await r.knex.raw(
        `
        delete from
          campaign_contact
        where
          campaign_contact.campaign_id = ?
          and not exists (
            select 1
            from message
            where campaign_contact_id = campaign_contact.id
          )
          and exists (
            select 1
            from campaign_contact as other_campaign_contact
            where other_campaign_contact.campaign_id = ANY(?)
              and other_campaign_contact.cell = campaign_contact.cell
          );`,
        [campaignId, overlappingCampaignIds]
      );

      return deletedRowCount;
    },
    resolveAssignmentRequest: async (
      _root,
      { assignmentRequestId, approved, autoApproveLevel },
      { user }
    ) => {
      assignmentRequestId = parseInt(assignmentRequestId, 10);
      const assignmentRequest = await r
        .knex("assignment_request")
        .first("*")
        .where({ id: assignmentRequestId });

      if (!assignmentRequest) {
        throw new Error("Assignment request not found");
      }

      const roleRequired = autoApproveLevel ? "ADMIN" : "SUPERVOLUNTEER";
      await accessRequired(
        user,
        assignmentRequest.organization_id,
        roleRequired
      );

      const numberAssigned = await r.knex.transaction(async (trx) => {
        if (autoApproveLevel) {
          await trx("user_organization")
            .where({
              user_id: assignmentRequest.user_id,
              organization_id: assignmentRequest.organization_id
            })
            .update({ request_status: autoApproveLevel.toLowerCase() });
        }

        await trx("assignment_request")
          .update({
            status: approved ? "approved" : "rejected",
            approved_by_user_id: user.id
          })
          .where({ id: assignmentRequestId });

        if (!approved) return 0;

        const countUpdated = await giveUserMoreTexts(
          assignmentRequest.user_id,
          assignmentRequest.amount,
          assignmentRequest.organization_id,
          assignmentRequest.preferred_team_id,
          trx
        );
        return countUpdated;
      });

      return numberAssigned;
    },
    saveTag: async (_root, { organizationId, tag }, { user }) => {
      await accessRequired(user, organizationId, "ADMIN");

      const {
        id,
        title,
        description,
        isAssignable,
        onApplyScript,
        textColor,
        backgroundColor,
        webhookUrl,
        confirmationSteps
      } = tag;

      // Update existing tag
      if (id) {
        const [updatedTag] = await r
          .knex("tag")
          .update({
            title,
            description,
            is_assignable: isAssignable,
            on_apply_script: onApplyScript,
            text_color: textColor,
            background_color: backgroundColor,
            webhook_url: webhookUrl,
            confirmation_steps: confirmationSteps
          })
          .where({
            id,
            organization_id: organizationId,
            is_system: false
          })
          .returning("*");
        if (!updatedTag) throw new Error("No matching tag to update!");
        return updatedTag;
      }

      // Create new tag
      const {
        rows: [newTag]
      } = await r.knex.raw(
        `
          insert into all_tag (organization_id, author_id, title, description, is_assignable, on_apply_script, text_color, background_color, webhook_url, confirmation_steps)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict on constraint tag_title_organization_id_unique do update set
            deleted_at = null,
            author_id = EXCLUDED.author_id,
            description = EXCLUDED.description,
            is_assignable = EXCLUDED.is_assignable,
            on_apply_script = EXCLUDED.on_apply_script,
            text_color = EXCLUDED.text_color,
            background_color = EXCLUDED.background_color,
            webhook_url = EXCLUDED.webhook_url,
            confirmation_steps = EXCLUDED.confirmation_steps
          returning *
          ;`,
        [
          organizationId,
          user.id,
          title,
          description,
          isAssignable,
          onApplyScript,
          textColor,
          backgroundColor,
          webhookUrl,
          confirmationSteps
        ]
      );

      memoizer.invalidate(cacheOpts.OrganizationTagList.key, {
        organizationId
      });

      memoizer.invalidate(cacheOpts.OrganizationEscalatedTagList.key, {
        organizationId
      });

      return newTag;
    },
    deleteTag: async (_root, { organizationId, tagId }, { user }) => {
      await accessRequired(user, organizationId, "ADMIN");

      const deleteCount = await r
        .knex("tag")
        .where({
          id: tagId,
          organization_id: organizationId,
          is_system: false
        })
        .del();
      if (deleteCount !== 1) throw new Error("Could not delete the tag.");

      memoizer.invalidate(cacheOpts.OrganizationTagList.key, {
        organizationId
      });

      memoizer.invalidate(cacheOpts.OrganizationEscalatedTagList.key, {
        organizationId
      });

      return true;
    },
    saveTeams: async (_root, { organizationId, teams }, { user }) => {
      await accessRequired(user, organizationId, "ADMIN");

      const stripUndefined = (obj) => {
        const result = { ...obj };
        Object.keys(result).forEach(
          (key) => result[key] === undefined && delete result[key]
        );
        return result;
      };

      const updatedTeams = await r.knex.transaction(async (trx) => {
        const isTeamOrg = (team) => team.id && team.id === "general";
        const orgTeam = teams.find(isTeamOrg);

        if (orgTeam) {
          let { features: currentFeatures } = await trx("organization")
            .where({ id: organizationId })
            .first("features");

          try {
            currentFeatures = JSON.parse(currentFeatures);
          } catch (_ex) {
            currentFeatures = {};
          }

          let nextFeatures = stripUndefined({
            textRequestFormEnabled: orgTeam.isAssignmentEnabled,
            textRequestType: orgTeam.assignmentType,
            textRequestMaxCount: orgTeam.maxRequestCount
          });
          nextFeatures = { ...currentFeatures, ...nextFeatures };
          await trx("organization")
            .update({ features: JSON.stringify(nextFeatures) })
            .where({ id: organizationId });
        }

        const nonOrgTeams = teams.filter((team) => !isTeamOrg(team));

        return Promise.all(
          nonOrgTeams.map(async (team) => {
            const payload = stripUndefined({
              title: team.title,
              description: team.description,
              text_color: team.textColor,
              background_color: team.backgroundColor,
              is_assignment_enabled: team.isAssignmentEnabled,
              assignment_priority: team.assignmentPriority,
              assignment_type: team.assignmentType,
              max_request_count: team.maxRequestCount
            });

            let teamToReturn;

            // Update existing team
            // true for updating fields on the team itself
            if (team.id && Object.keys(payload).length > 0) {
              const [updatedTeam] = await trx("team")
                .update(payload)
                .where({
                  id: team.id,
                  organization_id: organizationId
                })
                .returning("*");
              if (!updatedTeam) throw new Error("No matching team to update!");
              teamToReturn = updatedTeam;
            } else if (team.id) {
              // true if we're only upating the escalationTags
              teamToReturn = await trx("team")
                .where({ id: team.id })
                .first("*");
            } else {
              // Create new team
              const [newTeam] = await trx("team")
                .insert({
                  organization_id: organizationId,
                  author_id: user.id,
                  ...payload
                })
                .returning("*");

              teamToReturn = newTeam;
            }

            // Update team_escalation_tags
            if (team.escalationTagIds) {
              await trx("team_escalation_tags")
                .where({ team_id: teamToReturn.id })
                .del();

              teamToReturn.escalationTags = await trx("team_escalation_tags")
                .insert(
                  team.escalationTagIds.map((tagId) => ({
                    team_id: teamToReturn.id,
                    tag_id: tagId
                  }))
                )
                .returning("*");
            }

            return teamToReturn;
          })
        );
      });

      await Promise.all([
        memoizer.invalidate(cacheOpts.OrganizationSingleTon.key, {
          organizationId
        }),
        memoizer.invalidate(cacheOpts.MyCurrentAssignmentTargets.key, {
          organizationId
        })
      ]);

      return updatedTeams;
    },
    deleteTeam: async (_root, { organizationId, teamId }, { user }) => {
      await accessRequired(user, organizationId, "ADMIN");

      const deleteCount = await r
        .knex("team")
        .where({
          id: teamId,
          organization_id: organizationId
        })
        .del();
      if (deleteCount !== 1) throw new Error("Could not delete the team.");

      return true;
    },
    addUsersToTeam: async (_root, { teamId, userIds }, { user }) => {
      const { organization_id } = await r
        .knex("team")
        .where({ id: teamId })
        .first("organization_id");
      await accessRequired(user, organization_id, "ADMIN");
      const userOrgCount = await r.parseCount(
        r
          .knex("user_organization")
          .where({ organization_id })
          .whereIn("user_id", userIds)
          .count()
      );
      if (userOrgCount !== userIds.length)
        throw new Error(
          "Tried adding user to team in organization they are not part of!"
        );
      const payload = userIds.map((userId) => ({
        user_id: userId,
        team_id: teamId
      }));
      // This will throw for duplicate memberships. That is fine.
      await r.knex("user_team").insert(payload);
      return true;
    },
    removeUsersFromTeam: async (_root, { teamId, userIds }, { user }) => {
      const { organization_id } = await r
        .knex("team")
        .where({ id: teamId })
        .first("organization_id");
      await accessRequired(user, organization_id, "ADMIN");
      await r
        .knex("user_team")
        .where({ team_id: teamId })
        .whereIn("user_id", userIds)
        .del();
      return true;
    },
    releaseMyReplies: async (_root, { organizationId }, { user }) => {
      await accessRequired(user, organizationId, "TEXTER");

      await r.knex.raw(
        `
        update campaign_contact
        set assignment_id = null
        from assignment
        where assignment_id = assignment.id
          and assignment.user_id = ?
          and message_status = 'needsResponse'
          and archived = false
      `,
        [user.id]
      );

      return true;
    },
    dismissMatchingAlarms: async (
      _root,
      { token, organizationId },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      await r
        .knex("troll_alarm")
        .update({ dismissed: true })
        .where({
          dismissed: false,
          trigger_token: token
        })
        .whereExists(function subquery() {
          this.select(r.knex.raw("1"))
            .from("message")
            .join(
              "campaign_contact",
              "campaign_contact.id",
              "message.campaign_contact_id"
            )
            .join("campaign", "campaign.id", "campaign_contact.campaign_id")
            .where({ organization_id: organizationId })
            .whereRaw("message.id = troll_alarm.message_id");
        });

      return true;
    },
    dismissAlarms: async (_root, { messageIds, organizationId }, { user }) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      await r
        .knex("troll_alarm")
        .update({ dismissed: true })
        .whereIn("message_id", messageIds);

      return true;
    },
    addToken: async (_root, { organizationId, input }, { user, db }) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      const { token, mode } = input;
      if (token.trim() === "") throw new Error("empty token");
      try {
        await db.reader.raw(`select to_tsquery(?)`, [token]);
      } catch (err) {
        throw new Error("invalid tsquery token");
      }

      await r.knex("troll_trigger").insert({
        organization_id: parseInt(organizationId, 10),
        token,
        mode: mode.toLowerCase()
      });

      return true;
    },
    removeToken: async (_root, { token, organizationId }, { user }) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      await r
        .knex("troll_trigger")
        .where({ token, organization_id: parseInt(organizationId, 10) })
        .del();

      return true;
    },
    createExternalSystem: async (
      _root,
      { organizationId, externalSystem },
      { user }
    ) => {
      await accessRequired(user, organizationId, "ADMIN");

      const { operationMode } = externalSystem;
      const truncatedKey = `${externalSystem.apiKey.slice(0, 5)}********`;

      const apiKeyAppendage =
        operationMode === VanOperationMode.MYCAMPAIGN ? "|1" : "|0";

      const apiKeyRef =
        graphileSecretRef(organizationId, truncatedKey) + apiKeyAppendage;

      await getWorker().then((worker) =>
        worker.setSecret(apiKeyRef, externalSystem.apiKey + apiKeyAppendage)
      );

      const [created] = await r
        .knex("external_system")
        .insert({
          name: externalSystem.name,
          type: externalSystem.type.toLowerCase(),
          organization_id: parseInt(organizationId, 10),
          username: externalSystem.username,
          api_key_ref: apiKeyRef
        })
        .returning("*");

      // Kick off initial list load
      await refreshExternalSystem(created.id);

      return created;
    },
    editExternalSystem: async (
      _root,
      { id: externalSystemId, externalSystem },
      { user }
    ) => {
      const savedSystem = await r
        .knex("external_system")
        .where({ id: externalSystemId })
        .first();

      await accessRequired(user, savedSystem.organization_id, "ADMIN");

      const updatePayload = {
        name: externalSystem.name,
        type: externalSystem.type.toLowerCase(),
        username: externalSystem.username
      };

      const savedSystemApiKeySecret = await getWorker()
        .then((worker) => worker.getSecret(savedSystem.api_key_ref))
        .catch(() => undefined);

      const [
        savedSystemApiKey,
        savedSystemApiKeyAppendage
      ] = savedSystemApiKeySecret
        ? savedSystemApiKeySecret.split("|")
        : [undefined, undefined];

      const savedSystemOperationMode =
        savedSystemApiKeyAppendage === "1"
          ? VanOperationMode.MYCAMPAIGN
          : VanOperationMode.VOTERFILE;

      // We will check if the password/API key changed below
      const authDidChange =
        externalSystem.username !== savedSystem.username ||
        externalSystem.operationMode !== savedSystemOperationMode ||
        !externalSystem.apiKey.includes("*");

      const apiKeyAppendage =
        externalSystem.operationMode === VanOperationMode.MYCAMPAIGN
          ? "|1"
          : "|0";

      const truncatedKey = `${externalSystem.apiKey.slice(0, 5)}********`;
      const apiKeyRef =
        graphileSecretRef(savedSystem.organization_id, truncatedKey) +
        apiKeyAppendage;

      updatePayload.api_key_ref = apiKeyRef;

      if (authDidChange) {
        await r
          .knex("graphile_secrets.secrets")
          .where({ ref: savedSystem.api_key_ref })
          .del();

        await getWorker().then((worker) =>
          worker.setSecret(
            apiKeyRef,
            (externalSystem.apiKey.includes("*")
              ? savedSystemApiKey
              : externalSystem.apiKey) + apiKeyAppendage
          )
        );
      }

      const [updated] = await r
        .knex("external_system")
        .update(updatePayload)
        .where({ id: externalSystemId })
        .returning("*");

      // Completely refresh external lists after auth credentials change to make sure we're
      // not caching lists the new credentials do not have access to
      if (authDidChange) {
        await refreshExternalSystem(externalSystemId);
      }

      return updated;
    },
    refreshExternalSystem: async (_root, { externalSystemId }, { user }) => {
      const externalSystem = await r
        .knex("external_system")
        .where({ id: externalSystemId })
        .first();

      await accessRequired(user, externalSystem.organization_id, "ADMIN");

      await refreshExternalSystem(externalSystemId);

      return true;
    },
    createQuestionResponseSyncConfig: async (_root, { input }, { user }) => {
      const { id } = input;
      const [responseValue, iStepId, campaignId] = id.split("|");

      const { organization_id, external_system_id } = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first(["organization_id", "external_system_id"]);
      await accessRequired(user, organization_id, "ADMIN");

      await r.knex("all_external_sync_question_response_configuration").insert({
        system_id: external_system_id,
        campaign_id: campaignId,
        interaction_step_id: iStepId,
        question_response_value: responseValue
      });

      return r
        .knex("external_sync_question_response_configuration")
        .where({
          system_id: external_system_id,
          campaign_id: campaignId,
          interaction_step_id: iStepId,
          question_response_value: responseValue
        })
        .first();
    },
    deleteQuestionResponseSyncConfig: async (_root, { input }, { user }) => {
      const { id } = input;

      const {
        organization_id,
        system_id,
        campaign_id,
        interaction_step_id,
        question_response_value
      } = await r
        .knex("campaign")
        .join(
          "all_external_sync_question_response_configuration",
          "all_external_sync_question_response_configuration.campaign_id",
          "campaign.id"
        )
        .where({ "all_external_sync_question_response_configuration.id": id })
        .first([
          "organization_id",
          "system_id",
          "campaign_id",
          "interaction_step_id",
          "question_response_value"
        ]);

      await accessRequired(user, organization_id, "ADMIN");

      await r
        .knex("all_external_sync_question_response_configuration")
        .where({ id })
        .del();

      return r
        .knex("external_sync_question_response_configuration")
        .where({
          system_id,
          campaign_id,
          interaction_step_id,
          question_response_value
        })
        .first();
    },
    createQuestionResponseSyncTarget: async (
      _root,
      { input },
      { user: _user }
    ) => {
      const { configId, ...targets } = input;

      const validKeys = [
        "responseOptionId",
        "activistCodeId",
        "resultCodeId"
      ].filter((key) => targets[key] !== null && targets[key] !== undefined);

      if (validKeys.length !== 1) {
        throw new Error(
          `Expected 1 valid sync target but got ${validKeys.length}`
        );
      }
      const validKey = validKeys[0];
      const targetId = targets[validKey];

      if (validKey === "responseOptionId") {
        return r
          .knex("public.external_sync_config_question_response_response_option")
          .insert({
            question_response_config_id: configId,
            external_response_option_id: targetId
          })
          .returning("*")
          .then(([row]) => ({ ...row, target_type: "response_option" }));
      }
      if (validKey === "activistCodeId") {
        return r
          .knex("public.external_sync_config_question_response_activist_code")
          .insert({
            question_response_config_id: configId,
            external_activist_code_id: targetId
          })
          .returning("*")
          .then(([row]) => ({ ...row, target_type: "activist_code" }));
      }
      if (validKey === "resultCodeId") {
        return r
          .knex("public.external_sync_config_question_response_result_code")
          .insert({
            question_response_config_id: configId,
            external_result_code_id: targetId
          })
          .returning("*")
          .then(([row]) => ({ ...row, target_type: "result_code" }));
      }

      throw new Error(`Unknown key type ${validKey}`);
    },
    deleteQuestionResponseSyncTarget: async (
      _root,
      { targetId },
      { user: _user }
    ) => {
      await r
        .knex("public.external_sync_config_question_response_response_option")
        .where({ id: targetId })
        .del();
      await r
        .knex("public.external_sync_config_question_response_activist_code")
        .where({ id: targetId })
        .del();
      await r
        .knex("public.external_sync_config_question_response_result_code")
        .where({ id: targetId })
        .del();

      return targetId;
    },
    syncCampaignToSystem: async (_root, { input }, { user }) => {
      const campaignId = parseInt(input.campaignId, 10);

      const { organization_id } = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first(["organization_id"]);

      await accessRequired(user, organization_id, "ADMIN");

      await r.knex.raw("select * from public.queue_sync_campaign_to_van(?)", [
        campaignId
      ]);

      return true;
    },
    editExternalOptOutSyncConfig: async (
      _root,
      { systemId, targetId },
      { user }
    ) => {
      const externalSystem = await r
        .knex("external_system")
        .where({ id: systemId })
        .first();

      await accessRequired(user, externalSystem.organization_id, "ADMIN");

      if (targetId) {
        await r.knex.raw(
          `
            insert into external_sync_opt_out_configuration (system_id, external_result_code_id)
            values (?, ?)
            on conflict (system_id) do update
              set external_result_code_id = EXCLUDED.external_result_code_id
          `,
          [externalSystem.id, targetId]
        );
      } else {
        await r
          .knex("external_sync_opt_out_configuration")
          .where({ system_id: externalSystem.id })
          .del();
      }

      return externalSystem;
    },
    saveCampaignGroups: async (
      _root,
      { organizationId, campaignGroups },
      { user }
    ) => {
      await accessRequired(user, organizationId, user);

      const result = [];
      for (const campaignGroup of campaignGroups) {
        const { id: campaignGroupId, ...payload } = campaignGroup;
        if (campaignGroupId) {
          const whereClause = {
            id: campaignGroup.id,
            organization_id: organizationId
          };
          const [updatedCampaign] = await r
            .knex("campaign_group")
            .update(payload)
            .where(whereClause)
            .returning("*");
          result.push(updatedCampaign);
        } else {
          const [newCampaign] = await r
            .knex("campaign_group")
            .insert({ ...payload, organization_id: organizationId })
            .returning("*");
          result.push(newCampaign);
        }
      }

      return result;
    },
    deleteCampaignGroup: async (
      _root,
      { organizationId, campaignGroupId },
      { user }
    ) => {
      await accessRequired(user, organizationId, user);

      await r
        .knex("campaign_group")
        .where({ id: campaignGroupId, organization_id: organizationId })
        .del();

      return true;
    },
    editSuperAdminStatus: async (
      _root,
      { userEmail, superAdminStatus },
      { user }
    ) => {
      await superAdminRequired(user);

      await r
        .knex("user")
        .where({ email: userEmail })
        .update({ is_superadmin: superAdminStatus });

      return true;
    }
  }
};

const rootResolvers = {
  Action: {
    name: (o) => o.name,
    display_name: (o) => o.display_name,
    instructions: (o) => o.instructions
  },
  FoundContact: {
    found: (o) => o.found
  },
  RootQuery: {
    campaign: async (_root, { id }, { loaders, user }) => {
      const campaign = await loaders.campaign.load(id);
      if (!campaign) {
        return null;
      }
      await accessRequired(user, campaign.organization_id, "SUPERVOLUNTEER");
      return campaign;
    },
    assignment: async (_root, { id }, { loaders, user }) => {
      authRequired(user);
      const assignment = await loaders.assignment.load(id);
      const campaign = await loaders.campaign.load(assignment.campaign_id);
      if (assignment.user_id === user.id) {
        await accessRequired(
          user,
          campaign.organization_id,
          "TEXTER",
          /* allowSuperadmin= */ true
        );
      } else {
        await accessRequired(
          user,
          campaign.organization_id,
          "SUPERVOLUNTEER",
          /* allowSuperadmin= */ true
        );
      }
      return assignment;
    },
    organization: async (_root, { id }, { loaders, user }) => {
      await accessRequired(user, id, "TEXTER", /* allowSuperadmin= */ true);
      const getOrganization = memoizer.memoize(async ({ organizationId }) => {
        return loaders.organization.load(organizationId);
      }, cacheOpts.OrganizationSingleTon);

      return getOrganization({ organizationId: id });
    },
    team: async (_root, { id }, { user }) => {
      const team = await r.knex("team").where({ id }).first();
      await accessRequired(user, team.organization_id, "SUPERVOLUNTEER");
      return team;
    },
    // TODO: this return a single element, not a single element array
    inviteByHash: async (_root, { hash }, { user }) => {
      authRequired(user);
      return r.reader("invite").where({ hash });
    },
    currentUser: async (_root, { id: _id }, { user }) => {
      if (!user) {
        return null;
      }
      return user;
    },
    contact: async (_root, { id }, { loaders, user }) => {
      authRequired(user);
      const contact = await loaders.campaignContact.load(id);
      const campaign = await loaders.campaign.load(contact.campaign_id);
      await accessRequired(
        user,
        campaign.organization_id,
        "TEXTER",
        /* allowSuperadmin= */ true
      );
      return contact;
    },
    organizations: async (_root, { id: _id }, { user }) => {
      await superAdminRequired(user);
      return r.reader("organization");
    },
    availableActions: (_root, { organizationId }, { user: _user }) => {
      if (!config.ACTION_HANDLERS) {
        return [];
      }
      const allHandlers = config.ACTION_HANDLERS.split(",");

      const availableHandlers = allHandlers
        .map((handler) => {
          return {
            name: handler,
            // eslint-disable-next-line global-require,import/no-dynamic-require
            handler: require(`../action_handlers/${handler}.js`)
          };
        })
        .filter(async (h) => h && h.handler.available(organizationId));

      const availableHandlerObjects = availableHandlers.map((handler) => {
        return {
          name: handler.name,
          display_name: handler.handler.displayName(),
          instructions: handler.handler.instructions()
        };
      });
      return availableHandlerObjects;
    },
    conversations: async (
      _root,
      {
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        tagsFilter,
        contactsFilter,
        contactNameFilter
      },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);

      return getConversations(
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        tagsFilter,
        contactsFilter,
        contactNameFilter
      );
    },
    campaigns: async (
      _root,
      { organizationId, cursor, campaignsFilter },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      return getCampaigns(organizationId, cursor, campaignsFilter);
    },
    people: async (
      _root,
      { organizationId, cursor, campaignsFilter, role },
      { user }
    ) => {
      if (organizationId) {
        await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      } else if (!user.is_superadmin) {
        throw new ForbiddenError(
          "You are not authorized to access that resource"
        );
      }
      return getUsers(organizationId, cursor, campaignsFilter, role);
    },
    peopleByUserIds: async (_root, { organizationId, userIds }, { user }) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      return getUsersById(userIds);
    },
    fetchCampaignOverlaps: async (_root, { input }, { user }) => {
      const { targetCampaignId: campaignId, includeArchived } = input;
      const { organization_id: organizationId } = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first(["organization_id"]);

      await accessRequired(user, organizationId, "ADMIN");

      const { rows } = await queryCampaignOverlaps({
        organizationId,
        campaignId,
        includeArchived
      });

      const toReturn = rows.map(
        ({ campaign_id, count, campaign_title, last_activity }) => ({
          campaign: { id: campaign_id, title: campaign_title },
          overlapCount: count,
          lastActivity: last_activity
        })
      );

      return toReturn;
    },
    assignmentRequests: async (_root, { organizationId, status }, { user }) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      const query = r
        .knex("assignment_request")
        .select(
          "assignment_request.*",
          "user.id as user_id",
          "user.first_name",
          "user.last_name"
        )
        .join("user", "user_id", "=", "user.id")
        .where({
          organization_id: organizationId
        });

      if (status) {
        query.where({ status });
      }

      const assignmentRequests = await query;
      const result = assignmentRequests.map((ar) => {
        ar.user = {
          id: ar.user_id,
          first_name: ar.first_name,
          last_name: ar.last_name
        };
        ar.organization = { id: ar.organization_id };
        return ar;
      });
      return result;
    },
    trollAlarms: async (
      _root,
      { limit, offset, token, dismissed, organizationId },
      { user }
    ) => {
      organizationId = parseInt(organizationId, 10);
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      let query = r
        .reader("troll_alarm")
        .where({ dismissed, organization_id: organizationId });

      if (token !== null) {
        query = query.where({ trigger_token: token });
      }

      const countQuery = query.clone();
      const [{ count: totalCount }] = await countQuery.count();
      const alarms = await query
        .join("message", "message.id", "=", "troll_alarm.message_id")
        .join("user", "user.id", "message.user_id")
        .join(
          "campaign_contact",
          "campaign_contact.id",
          "message.campaign_contact_id"
        )
        .select(
          "message_id",
          "trigger_token as token",
          "dismissed",
          "message.text as message_text",
          "user.id",
          "user.first_name",
          "user.last_name",
          "user.email",
          "campaign_contact.id as cc_id",
          "campaign_contact.campaign_id",
          "campaign_contact.first_name as cc_first_name",
          "campaign_contact.last_name as cc_last_name"
        )
        .orderBy("troll_alarm.message_id", "desc")
        .limit(limit)
        .offset(offset)
        .map(
          ({
            message_id,
            token: alarmToken,
            dismissed: alarmDismissed,
            message_text,
            cc_id,
            campaign_id,
            cc_first_name,
            cc_last_name,
            ...alarmUser
          }) => ({
            message_id,
            token: alarmToken,
            dismissed: alarmDismissed,
            message_text,
            user: alarmUser,
            contact: {
              id: cc_id,
              campaign_id,
              first_name: cc_first_name,
              last_name: cc_last_name
            }
          })
        );

      return { alarms, totalCount };
    },
    trollAlarmsCount: async (
      _root,
      { dismissed, organizationId },
      { user }
    ) => {
      organizationId = parseInt(organizationId, 10);
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      const query = r
        .reader("troll_alarm")
        .where({ dismissed, organization_id: organizationId });

      const [{ count: totalCount }] = await query.count();

      return { totalCount };
    },
    trollTokens: async (_root, { organizationId }, { user }) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      const tokens = await r
        .reader("troll_trigger")
        .where({ organization_id: parseInt(organizationId, 10) });

      return tokens.map((t) => ({
        id: t.token,
        token: t.token,
        mode: t.mode.toUpperCase(),
        compiledTsQuery: t.compiled_tsquery,
        organizationId
      }));
    },
    externalSystem: async (_root, { systemId }, { user }) => {
      const system = await r
        .reader("external_system")
        .where({ id: systemId })
        .first();

      await accessRequired(user, system.organization_id, "ADMIN");

      return system;
    },
    externalSystems: async (
      _root,
      { organizationId, after, first },
      { user }
    ) => {
      await accessRequired(user, organizationId, "ADMIN");

      const query = r
        .reader("external_system")
        .where({ organization_id: parseInt(organizationId, 10) });
      return formatPage(query, { after, first });
    },
    externalLists: async (
      _root,
      { organizationId, systemId, after, first },
      { user }
    ) => {
      await accessRequired(user, organizationId, "ADMIN");

      const query = r.reader("external_list").where({
        organization_id: parseInt(organizationId, 10),
        system_id: systemId
      });
      return formatPage(query, { after, first });
    },
    notices: async (_root, { organizationId }, { user }) => {
      let notices = [];
      if (!user) return notices;

      if (user && user.is_superadmin) {
        const instanceNotifications = await getInstanceNotifications(user.id);
        notices = notices.concat(instanceNotifications);
      }

      const orgNotices = await getOrgLevelNotifications(
        user.id,
        organizationId ?? undefined
      );
      notices = notices.concat(orgNotices);

      const pageInfo = {
        totalCount: notices.length,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: notices[0]?.id ?? null,
        endCursor: notices[notices.length - 1]?.id ?? null
      };

      const edges = notices.map((notice) => ({
        cursor: notice.id,
        node: notice
      }));

      return { pageInfo, edges };
    },
    campaignGroups: async (
      _root,
      { organizationId, after, first },
      { user }
    ) => {
      await accessRequired(user, organizationId, "ADMIN");

      const query = r.reader("campaign_group").where({
        organization_id: parseInt(organizationId, 10)
      });
      return formatPage(query, { after, first });
    },
    campaignNavigation: async (_root, { campaignId }, { user }) => {
      const { organization_id: organizationId } = await r
        .knex("campaign")
        .where({ id: campaignId })
        .first("organization_id");

      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      const { prev_campaign: prevCampaignId } = await r
        .knex("campaign")
        .max({ prev_campaign: "id" })
        .where("id", "<", campaignId)
        .where({ organization_id: organizationId })
        .first();

      const { next_campaign: nextCampaignId } = await r
        .knex("campaign")
        .min({ next_campaign: "id" })
        .where("id", ">", campaignId)
        .where({ organization_id: organizationId })
        .first();

      return {
        prevCampaignId,
        nextCampaignId
      };
    },
    bulkUpdateScriptChanges: async (
      _root,
      { organizationId, findAndReplace },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      const steps = await r.knex.transaction((trx) => {
        return getStepsToUpdate(trx, findAndReplace);
      });

      return steps.map((step) => {
        return {
          id: step.id,
          campaignId: step.campaign_id,
          campaignName: step.title,
          script: step.script_options.join(" | ")
        };
      });
    },
    superadmins: async (_root, _options, { user }) => {
      if (user.is_superadmin) {
        return r.reader("user").where({ is_superadmin: true });
      }
      throw new ForbiddenError(
        "You are not authorized to access that resource"
      );
    }
  }
};

export const resolvers = {
  ...tagResolvers,
  ...teamResolvers,
  ...assignmentRequestResolvers,
  ...rootResolvers,
  ...userResolvers,
  ...membershipSchema,
  ...settingsSchema,
  ...organizationResolvers,
  ...campaignResolvers,
  ...assignmentResolvers,
  ...interactionStepResolvers,
  ...optOutResolvers,
  ...messageResolvers,
  ...campaignGroupResolvers,
  ...campaignVariableResolvers,
  ...campaignContactResolvers,
  ...cannedResponseResolvers,
  ...questionResponseResolvers,
  ...inviteResolvers,
  ...linkDomainResolvers,
  ...trollbotResolvers,
  ...externalListResolvers,
  ...externalSystemResolvers,
  ...externalSurveyQuestionResolvers,
  ...externalResponseOptionResolvers,
  ...externalActivistCodeResolvers,
  ...externalResultCodeResolvers,
  ...externalSyncConfigResolvers,
  ...messagingServiceResolvers,
  ...noticeResolvers,
  ...{ Date: GraphQLDate },
  ...{ JSON: GraphQLJSON },
  ...{ Phone: GraphQLPhone },
  ...{ Upload: GraphQLUpload },
  ...questionResolvers,
  ...conversationsResolver,
  ...rootMutations
};

export default resolvers;
