import React from "react";
import ReactDOMServer from "react-dom/server";

import type { CampaignRecord, OrganizationRecord } from "../../api/types";
import { NotificationTypes } from "../../api/types";

interface FormattedNotification {
  notificationType: NotificationTypes;
  campaign: CampaignRecord;
  count: number;
}

interface DigestProps {
  organization: OrganizationRecord;
  notifications: FormattedNotification[];
  textingUrl: string;
  settingsUrl: string;
}

interface NotificationContentProps {
  notification: FormattedNotification;
}

const AssignmentCreatedRow: React.FC<NotificationContentProps> = ({
  notification
}) => {
  return (
    <p>
      [{notification.campaign.title}]: New Assignment. {notification.count}{" "}
      messages to send.
    </p>
  );
};

const AssignmentUpdatedRow: React.FC<NotificationContentProps> = ({
  notification
}) => {
  return (
    <p>
      [{notification.campaign.title}]: Updated Assignment. {notification.count}{" "}
      messages to send.
    </p>
  );
};

const AssignmentMessageReceivedRow: React.FC<NotificationContentProps> = ({
  notification
}) => {
  return (
    <p>
      [{notification.campaign.title}]: Replies Received. {notification.count}{" "}
      new replies.
    </p>
  );
};

const renderDigestRow = (notification: FormattedNotification) => {
  switch (notification.notificationType) {
    case NotificationTypes.AssignmentCreated:
      return <AssignmentCreatedRow notification={notification} />;
    case NotificationTypes.AssignmentUpdated:
      return <AssignmentUpdatedRow notification={notification} />;
    case NotificationTypes.AssignmentMessageReceived:
      return <AssignmentMessageReceivedRow notification={notification} />;
    default:
      return <div />;
  }
};

const Digest: React.FC<DigestProps> = ({
  organization,
  notifications,
  textingUrl,
  settingsUrl
}) => {
  return (
    <div>
      <p>You have outstanding text assignments from {organization.name}</p>
      {notifications.map((notification) => renderDigestRow(notification))}
      <p>
        You can start sending texts right away here:{" "}
        <a href={textingUrl}>{textingUrl}</a>
      </p>
      <br />
      <p>
        To modify your notification settings, go <a href={settingsUrl}>here</a>
      </p>
    </div>
  );
};

const getDigestContent = async (
  organization: OrganizationRecord,
  notifications: FormattedNotification[],
  textingUrl: string,
  settingsUrl: string
) => {
  const template = (
    <Digest
      organization={organization}
      notifications={notifications}
      textingUrl={textingUrl}
      settingsUrl={settingsUrl}
    />
  );
  const content = ReactDOMServer.renderToStaticMarkup(template);

  return content;
};

export default getDigestContent;
