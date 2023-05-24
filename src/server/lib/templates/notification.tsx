import React from "react";
import ReactDOMServer from "react-dom/server";

import assemblePalette from "../../../styles/assemble-palette";
import type { CampaignRecord, OrganizationRecord } from "../../api/types";
import { NotificationTypes } from "../../api/types";
import Footer from "./footer";
import Header from "./header";

interface NotificationProps {
  campaign: CampaignRecord;
  organization: OrganizationRecord;
  assignmentCount: string;
  settingsUrl: string;
  textingUrl: string;
}

interface NotificationWrapperProps {
  children: React.ReactNode;
  organizationName: string;
  settingsUrl: string;
}

const styles = {
  font: {
    fontFamily: "Helvetica"
  },
  button: {
    width: 80,
    backgroundColor: assemblePalette.primary.navy,
    padding: `12px 20px`,
    borderRadius: 4,
    cursor: "pointer",
    marginBottom: 10,
    "text-align": "center"
  },
  buttonText: {
    color: "white",
    textDecoration: "none"
  }
};

const NotificationWrapper: React.FC<NotificationWrapperProps> = ({
  children,
  organizationName,
  settingsUrl
}) => {
  return (
    <html lang="en">
      <Header />
      <body style={styles.font}>
        {children}
        <Footer orgName={organizationName} settingsUrl={settingsUrl} />
      </body>
    </html>
  );
};

const AssignmentCreated: React.FC<NotificationProps> = ({
  organization,
  campaign,
  assignmentCount,
  textingUrl,
  settingsUrl
}) => {
  const orgName = organization.name;
  return (
    <NotificationWrapper organizationName={orgName} settingsUrl={settingsUrl}>
      <p>Hello!</p>
      <p>
        You just got a new texting assignment from {orgName}: {campaign.title}.
      </p>
      <p>There are {assignmentCount} first message(s) to send.</p>
      <div style={styles.button}>
        <a style={styles.buttonText} href={textingUrl}>
          Send Now
        </a>
      </div>
      <br />
    </NotificationWrapper>
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
    <NotificationWrapper organizationName={orgName} settingsUrl={settingsUrl}>
      <p>Hello!</p>
      <p>
        Your texting assignment from {orgName}: {campaign.title} has been
        updated.
      </p>
      <p>
        {assignmentCount === "1"
          ? `There is one message to send. `
          : `There are ${assignmentCount} messages to send. `}
      </p>
      <div style={styles.button}>
        <a style={styles.buttonText} href={textingUrl}>
          Send Now
        </a>
      </div>
      <br />
    </NotificationWrapper>
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
    <NotificationWrapper organizationName={orgName} settingsUrl={settingsUrl}>
      <p>Hello!</p>
      <p>
        Someone responded to your message from {orgName} in {campaign.title}.
        Check out your pending texts!
      </p>
      <div style={styles.button}>
        <a style={styles.buttonText} href={textingUrl}>
          Send Now
        </a>
      </div>
      <br />
    </NotificationWrapper>
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
