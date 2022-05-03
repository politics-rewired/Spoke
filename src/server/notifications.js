import { config } from "../config";
import logger from "../logger";
import { NotificationTypes } from "./api/types";
import { eventBus, EventType } from "./event-bus";
import { r } from "./models";
import { errToObj } from "./utils";

export const Notifications = Object.freeze({
  CAMPAIGN_STARTED: "campaign.started",
  ASSIGNMENT_MESSAGE_RECEIVED: "assignment.message.received",
  ASSIGNMENT_CREATED: "assignment.created",
  ASSIGNMENT_UPDATED: "assignment.updated"
});

async function createNotification(
  userId,
  organizationId,
  campaignId,
  notificationType
) {
  await r.knex("notification").insert({
    user_id: userId,
    organization_id: organizationId,
    campaign_id: campaignId,
    notification_type: notificationType
  });
}

const sendAssignmentUserNotification = async (assignment, notification) => {
  const campaign = await r
    .reader("campaign")
    .where({ id: assignment.campaign_id })
    .first();

  if (!campaign.is_started) {
    return;
  }

  const organization = await r
    .reader("organization")
    .where({ id: campaign.organization_id })
    .first();

  try {
    await createNotification(
      assignment.user_id,
      organization.id,
      campaign.id,
      notification
    );
  } catch (e) {
    logger.error("Error sending assignment notification email: ", e);
  }
};

export const sendUserNotification = async (notification) => {
  const { type } = notification;

  // Fine-grained notification preferences
  let disabledTypes = config.DISABLED_TEXTER_NOTIFICATION_TYPES;
  disabledTypes = disabledTypes.length > 0 ? disabledTypes.split(",") : [];
  if (disabledTypes.includes(type)) return;

  if (type === Notifications.CAMPAIGN_STARTED) {
    const assignments = await r
      .reader("assignment")
      .where({ campaign_id: notification.campaignId })
      .select(["user_id", "campaign_id"]);

    const count = assignments.length;
    for (let i = 0; i < count; i += 1) {
      const assignment = assignments[i];
      await sendAssignmentUserNotification(
        assignment,
        NotificationTypes.AssignmentCreated
      );
    }
    return;
  }

  // Global notification toggle (campaign notifications are still allowed)
  if (config.DISABLE_TEXTER_NOTIFICATIONS) return;

  if (type === Notifications.ASSIGNMENT_MESSAGE_RECEIVED) {
    const assignment = await r
      .reader("assignment")
      .where({ id: notification.assignmentId })
      .first();
    const campaign = await r
      .reader("campaign")
      .where({ id: assignment.campaign_id })
      .first();
    const campaignContact = await r
      .reader("campaign_contact")
      .where({ campaign_id: campaign.id, cell: notification.contactNumber })
      .first();

    if (!campaignContact.is_opted_out && !campaign.is_archived) {
      const organization = await r
        .reader("organization")
        .where({ id: campaign.organization_id })
        .first();

      try {
        await createNotification(
          assignment.user_id,
          organization.id,
          campaign.id,
          NotificationTypes.AssignmentMessageReceived
        );
      } catch (err) {
        logger.error("Error sending conversation reply notification email: ", {
          ...errToObj(err)
        });
      }
    }
  } else if (type === Notifications.ASSIGNMENT_CREATED) {
    const { assignment } = notification;
    await sendAssignmentUserNotification(
      assignment,
      NotificationTypes.AssignmentCreated
    );
  } else if (type === Notifications.ASSIGNMENT_UPDATED) {
    const { assignment } = notification;
    await sendAssignmentUserNotification(
      assignment,
      NotificationTypes.AssignmentUpdated
    );
  }
};

const handleAssignmentCreated = (assignment) =>
  sendUserNotification({
    type: Notifications.ASSIGNMENT_CREATED,
    assignment
  });

const handleMessageReceived = ({ assignmentId, contactNumber }) =>
  sendUserNotification({
    type: Notifications.ASSIGNMENT_MESSAGE_RECEIVED,
    assignmentId,
    contactNumber
  });

// Ensure observers are only set up once
let isNotificationObservationSetUp = false;
export const setupUserNotificationObservers = () => {
  if (isNotificationObservationSetUp) return;

  eventBus.on(EventType.AssignmentCreated, handleAssignmentCreated);
  eventBus.on(EventType.MessageReceived, handleMessageReceived);

  isNotificationObservationSetUp = true;
};
