import groupBy from "lodash/groupBy";
import React from "react";
import ReactDOMServer from "react-dom/server";

import { notification as Notification } from "../../../../libs/spoke-codegen/src";
import { config } from "../../../config";
import { OrganizationRecord } from "../../api/types";
import { r } from "../../models";
import { Notifications } from "../../notifications";

interface DigestProps {
  notificationsContent: string[];
  organization: OrganizationRecord;
  userId: number;
}

const textingUrl = (orgId: number) => {
  return `${config.BASE_URL}/app/${orgId}/todos`;
};

const settingsUrl = (orgId: number, userId: number) => {
  return `${config.BASE_URL}/app/${orgId}/account/${userId}`;
};

const getContentForReplies = async (
  campaignId: string,
  notifications: Notification[]
) => {
  const campaign = await r.knex("campaign").where({ id: campaignId }).first();

  const notificationCount = notifications.length;

  const content = `[${campaign.title}]: ${notificationCount} new replies`;

  return content;
};

const getContentForNotification = async (notification: Notification) => {
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

  let content;

  switch (notification.category) {
    case Notifications.ASSIGNMENT_CREATED:
      content = `[${campaign.title}]: New Assignment. ${assignmentCount} messages to send`;
      break;
    case Notifications.ASSIGNMENT_UPDATED:
      content = `[${campaign.title}]: Updated Assignment. ${assignmentCount} messages to send`;
      break;
    default:
      content = "";
      break;
  }

  return content;
};

const getContentForNotifications = async (notifications: Notification[]) => {
  const notificationByCategory = groupBy(notifications, "category");
  const assignmentCreated =
    notificationByCategory[Notifications.ASSIGNMENT_CREATED];
  const assignmentUpdated =
    notificationByCategory[Notifications.ASSIGNMENT_UPDATED];
  const replies =
    notificationByCategory[Notifications.ASSIGNMENT_MESSAGE_RECEIVED];
  const repliesPerCampaign = groupBy(replies, "campaign_id");

  const notificationsContent = [];

  for (const notification of assignmentCreated.concat(assignmentUpdated)) {
    const notificationWithContent = await getContentForNotification(
      notification
    );
    notificationsContent.push(notificationWithContent);
  }

  for (const [campaignId, campaignReplies] of Object.entries(
    repliesPerCampaign
  )) {
    const notificationWithContent = await getContentForReplies(
      campaignId,
      campaignReplies
    );
    notificationsContent.push(notificationWithContent);
  }

  return notificationsContent;
};

const Digest: React.FC<DigestProps> = ({
  notificationsContent,
  organization,
  userId
}) => {
  return (
    <div>
      <p>You have outstanding text assignments from {organization.name}</p>
      {notificationsContent.map((content) => {
        return (
          /* eslint-disable react/jsx-key */
          <p>{content}</p>
        );
      })}
      <p>
        You can start sending texts right away here:{" "}
        <a href={textingUrl(organization.id)}>{textingUrl(organization.id)}</a>
      </p>
      <br />
      <p>
        To modify your notification settings, go{" "}
        <a href={settingsUrl(organization.id, userId)}>here</a>
      </p>
    </div>
  );
};

const getDigestContent = async (
  organizationId: string,
  userId: number,
  notifications: Notification[]
) => {
  const organization = await r
    .knex("organization")
    .where({ id: organizationId })
    .first();

  const notificationsContent = await getContentForNotifications(notifications);

  const subject = `[${organization.name}]: Assignment Update`;
  const template = (
    <Digest
      notificationsContent={notificationsContent}
      organization={organization}
      userId={userId}
    />
  );
  const content = ReactDOMServer.renderToStaticMarkup(template);

  return {
    subject,
    content
  };
};

export default getDigestContent;
