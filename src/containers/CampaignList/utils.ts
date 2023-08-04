/* eslint-disable import/prefer-default-export */
import type { GraphQLError } from "graphql";

import type { Tag } from "./components/CampaignHeader";

export const isCampaignGroupsPermissionError = (gqlError: GraphQLError) => {
  return (
    gqlError.path &&
    gqlError.path[gqlError.path.length - 1] === "campaignGroups" &&
    gqlError.extensions.code === "FORBIDDEN"
  );
};

type MakeCampaignTagsFn = (props: {
  isStarted: boolean | null | undefined;
  hasUnassignedContacts: boolean | null | undefined;
  hasUnsentInitialMessages: boolean | null | undefined;
  hasUnhandledMessages: boolean | null | undefined;
}) => Tag[];

export const makeCampaignHeaderTags: MakeCampaignTagsFn = ({
  isStarted,
  hasUnassignedContacts,
  hasUnsentInitialMessages,
  hasUnhandledMessages
}) => {
  const tags = [];

  // display 'Started' or 'Not Started' first
  if (isStarted) {
    tags.push({
      title: "Started",
      status: "success"
    });
  } else {
    tags.push({
      title: "Not Started",
      status: "alert"
    });
  }

  if (hasUnassignedContacts) {
    tags.push({
      title: "Unassigned Contacts",
      status: "alert"
    });
  } else {
    tags.push({
      title: "All Contacts Assigned",
      status: "success"
    });
  }

  if (isStarted) {
    const tag = hasUnsentInitialMessages
      ? {
          title: "Unsent Initial Messages",
          status: "alert"
        }
      : {
          title: "All Initials Sent",
          status: "success"
        };
    tags.push(tag);
  }

  if (isStarted && hasUnhandledMessages) {
    const tag = hasUnhandledMessages
      ? {
          title: "Unhandled Replies",
          status: "alert"
        }
      : {
          title: "All Replies Handled",
          status: "success"
        };
    tags.push(tag);
  }

  return tags;
};
