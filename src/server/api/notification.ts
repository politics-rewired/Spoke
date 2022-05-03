import groupBy from "lodash/groupBy";

import { config } from "../../config";
import getDigestContent from "../lib/templates/digest";
import getNotificationContent from "../lib/templates/notification";
import { r } from "../models";
import { NotificationRecord, NotificationTypes } from "./types";

interface AssignmentCreatedNotification extends NotificationRecord {
  notification_type: NotificationTypes.AssignmentCreated;
}

interface AssignmentUpdatedNotification extends NotificationRecord {
  notification_type: NotificationTypes.AssignmentUpdated;
}

interface AssignmentMessageReceivedNotification extends NotificationRecord {
  notification_type: NotificationTypes.AssignmentMessageReceived;
}

const textingUrl = (orgId: number) => {
  return `${config.BASE_URL}/app/${orgId}/todos`;
};

const settingsUrl = (orgId: number, userId: number) => {
  return `${config.BASE_URL}/app/${orgId}/account/${userId}`;
};

export type Notification =
  | AssignmentCreatedNotification
  | AssignmentUpdatedNotification
  | AssignmentMessageReceivedNotification;

export const getSingleNotificationContent = async (
  notification: Notification
) => {
  const organization = await r
    .knex("organization")
    .where({ id: notification.organization_id })
    .first();
  const campaign = await r
    .knex("campaign")
    .where({ id: notification.campaign_id })
    .first();
  const assignment = await r
    .knex("assignment")
    .where({
      user_id: notification.user_id,
      campaign_id: notification.campaign_id
    })
    .first();
  const { count: assignmentCount } = await r
    .knex("campaign_contact")
    .where({ campaign_id: campaign.id, assignment_id: assignment.id })
    .count()
    .first();

  const data = {
    notification,
    organization,
    campaign,
    assignmentCount,
    textingUrl: textingUrl(organization.id),
    settingsUrl: settingsUrl(organization.id, notification.user_id)
  };

  return getNotificationContent(data, notification.notification_type);
};

const formatReplyNotification = async (
  campaignId: string,
  notifications: Notification[]
) => {
  const campaign = await r.knex("campaign").where({ id: campaignId }).first();
  const count = notifications.length;

  return {
    campaign,
    count,
    notificationType: NotificationTypes.AssignmentMessageReceived
  };
};

const formatNotification = async (notification: Notification) => {
  const campaign = await r
    .knex("campaign")
    .where({ id: notification.campaign_id })
    .first();

  const notificationType = notification.notification_type;

  const assignment = await r
    .knex("assignment")
    .where({
      user_id: notification.user_id,
      campaign_id: notification.campaign_id
    })
    .first();

  const { count } = await r
    .knex("campaign_contact")
    .where({ campaign_id: campaign.id, assignment_id: assignment.id })
    .count()
    .first();

  return {
    notificationType,
    campaign,
    count
  };
};

const formatNotifications = async (notifications: Notification[]) => {
  const notificationByCategory = groupBy(notifications, "notification_type");
  const assignmentCreated =
    notificationByCategory[NotificationTypes.AssignmentCreated];
  const assignmentUpdated =
    notificationByCategory[NotificationTypes.AssignmentUpdated];
  const replies =
    notificationByCategory[NotificationTypes.AssignmentMessageReceived];
  const repliesPerCampaign = groupBy(replies, "campaign_id");

  const formattedNotifications = [];

  if (Array.isArray(assignmentCreated)) {
    for (const notification of assignmentCreated) {
      formattedNotifications.push(await formatNotification(notification));
    }
  }

  if (Array.isArray(assignmentUpdated)) {
    for (const notification of assignmentUpdated) {
      formattedNotifications.push(await formatNotification(notification));
    }
  }

  for (const [campaignId, campaignReplies] of Object.entries(
    repliesPerCampaign
  )) {
    const formattedNotification = await formatReplyNotification(
      campaignId,
      campaignReplies
    );
    formattedNotifications.push(formattedNotification);
  }

  return formattedNotifications;
};

export const getDigestNotificationContent = async (
  organizationId: string,
  userId: number,
  notifications: Notification[]
) => {
  const organization = await r
    .knex("organization")
    .where({ id: organizationId })
    .first();

  const formattedNotifications = await formatNotifications(notifications);

  const subject = `[${organization.name}]: Assignment Update`;

  const content = await getDigestContent(
    organization,
    formattedNotifications,
    textingUrl(organization.id),
    settingsUrl(organization.id, userId)
  );

  return {
    subject,
    content
  };
};
