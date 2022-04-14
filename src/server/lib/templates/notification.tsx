import React from "react";
import ReactDOMServer from "react-dom/server";

import { notification as Notification } from "../../../../libs/spoke-codegen/src";
import { config } from "../../../config";
import { CampaignRecord, OrganizationRecord } from "../../api/types";
import { r } from "../../models";
import { Notifications } from "../../notifications";

interface NotificationProps {
  campaign: CampaignRecord;
  notification: Notification;
  organization: OrganizationRecord;
  assignmentCount: string;
}

const textingUrl = (orgId: number) => {
  return `${config.BASE_URL}/app/${orgId}/todos`;
};

const settingsUrl = (orgId: number, userId: number) => {
  return `${config.BASE_URL}/app/${orgId}/account/${userId}`;
};

const AssignmentCreated: React.FC<NotificationProps> = ({
  notification,
  organization,
  campaign,
  assignmentCount
}) => {
  return (
    <div>
      <p>You just got a new texting assignment from {organization.name}</p>
      <p>
        [{campaign.title}]: {assignmentCount} first messages to send
      </p>
      <br />
      <p>
        You can start sending texts right away here:{" "}
        <a href={textingUrl(organization.id)}>{textingUrl(organization.id)}</a>
      </p>
      <br />
      <p>
        To modify your notification settings, go{" "}
        <a href={settingsUrl(organization.id, notification.user_id)}>here</a>
      </p>
    </div>
  );
};

const AssignmentUpdated: React.FC<NotificationProps> = ({
  notification,
  organization,
  campaign,
  assignmentCount
}) => {
  return (
    <div>
      <p>Your texting assignment from {organization.name} has been updated.</p>
      <p>
        [{campaign.title}]: {assignmentCount} first messages to send.{" "}
      </p>
      <br />
      <p>
        You can start sending texts right away here:{" "}
        <a href={textingUrl(organization.id)}>{textingUrl(organization.id)}</a>
      </p>
      <br />
      <p>
        To modify your notification settings, go{" "}
        <a href={settingsUrl(organization.id, notification.user_id)}>here</a>
      </p>
    </div>
  );
};

const AssignmentMessageReceived: React.FC<NotificationProps> = ({
  notification,
  organization,
  campaign
}) => {
  return (
    <div>
      <p>
        Someone responded to your message from ${organization.name} in $
        {campaign.title}
      </p>
      <br />
      <p>
        You can look at your pending texts here:{" "}
        <a href={textingUrl(organization.id)}>{textingUrl(organization.id)}</a>
      </p>
      <br />
      <p>
        To modify your notification settings, go{" "}
        <a href={settingsUrl(organization.id, notification.user_id)}>here</a>
      </p>
    </div>
  );
};

const getNotificationContent = async (notification: Notification) => {
  let template = null;
  let subject = "";

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

  const props = {
    notification,
    organization,
    campaign,
    assignmentCount
  };

  switch (notification.category) {
    case Notifications.ASSIGNMENT_CREATED:
      template = <AssignmentCreated {...props} />;
      subject = `[${organization.name}] New Assignment: ${campaign.title}`;
      break;
    case Notifications.ASSIGNMENT_UPDATED:
      template = <AssignmentUpdated {...props} />;
      subject = `[${organization.name}] Updated Assignment: ${campaign.title}`;
      break;
    case Notifications.ASSIGNMENT_MESSAGE_RECEIVED:
      template = <AssignmentMessageReceived {...props} />;
      subject = `[${organization.name}] New Reply: ${campaign.title}`;
      break;
    default:
      template = <div />;
  }

  const content = ReactDOMServer.renderToStaticMarkup(template);

  return {
    content,
    subject
  };
};

export default getNotificationContent;
