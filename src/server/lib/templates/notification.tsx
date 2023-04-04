import React from "react";
import ReactDOMServer from "react-dom/server";

import type { CampaignRecord, OrganizationRecord } from "../../api/types";
import { NotificationTypes } from "../../api/types";
import Footer from "./footer";

interface NotificationProps {
  campaign: CampaignRecord;
  organization: OrganizationRecord;
  assignmentCount: string;
  settingsUrl: string;
  textingUrl: string;
}

const AssignmentCreated: React.FC<NotificationProps> = ({
  organization,
  campaign,
  assignmentCount,
  textingUrl,
  settingsUrl
}) => {
  const orgName = organization.name;
  return (
    <>
      <div>
        <p>You just got a new texting assignment from {orgName}</p>
        <p>
          [{campaign.title}]: {assignmentCount} first messages to send
        </p>
        <br />
        <p>
          You can start sending texts right away here:{" "}
          <a href={textingUrl}>{textingUrl}</a>
        </p>
      </div>
      <Footer orgName={orgName} settingsUrl={settingsUrl} />
    </>
  );
};

const AssignmentUpdated: React.FC<NotificationProps> = ({
  organization,
  campaign,
  assignmentCount,
  textingUrl,
  settingsUrl
}) => {
  const orgName = organization.name;
  return (
    <>
      <div>
        <p>Your texting assignment from {orgName} has been updated.</p>
        <p>
          [{campaign.title}]: {assignmentCount} first messages to send.{" "}
        </p>
        <br />
        <p>
          You can start sending texts right away here:{" "}
          <a href={textingUrl}>{textingUrl}</a>
        </p>
      </div>
      <Footer orgName={orgName} settingsUrl={settingsUrl} />
    </>
  );
};

const AssignmentMessageReceived: React.FC<NotificationProps> = ({
  organization,
  campaign,
  textingUrl,
  settingsUrl
}) => {
  const orgName = organization.name;
  return (
    <>
      <div>
        <p>
          Someone responded to your message from ${orgName} in ${campaign.title}
        </p>
        <br />
        <p>
          You can look at your pending texts here:{" "}
          <a href={textingUrl}>{textingUrl}</a>
        </p>
      </div>
      <Footer orgName={orgName} settingsUrl={settingsUrl} />
    </>
  );
};

const getNotificationContent = (
  data: NotificationProps,
  notificationType: NotificationTypes
) => {
  let template = null;
  let subject = "";

  const { organization, campaign } = data;
  switch (notificationType) {
    case NotificationTypes.AssignmentCreated:
      template = <AssignmentCreated {...data} />;
      subject = `[${organization.name}] New Assignment: ${campaign.title}`;
      break;
    case NotificationTypes.AssignmentUpdated:
      template = <AssignmentUpdated {...data} />;
      subject = `[${organization.name}] Updated Assignment: ${campaign.title}`;
      break;
    case NotificationTypes.AssignmentMessageReceived:
      template = <AssignmentMessageReceived {...data} />;
      subject = `[${organization.name}] New Reply: ${campaign.title}`;
      break;
    default:
      throw new Error(`Unrecognized notification type ${notificationType}`);
  }

  const content = ReactDOMServer.renderToStaticMarkup(template);

  return {
    content,
    subject
  };
};

export default getNotificationContent;
