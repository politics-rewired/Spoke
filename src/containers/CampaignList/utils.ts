/* eslint-disable import/prefer-default-export */
import type { Theme } from "@material-ui/core";
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
  theme: Theme;
}) => Tag[];

export const makeCampaignHeaderTags: MakeCampaignTagsFn = ({
  isStarted,
  hasUnassignedContacts,
  hasUnsentInitialMessages,
  hasUnhandledMessages,
  theme
}) => {
  const tags = [];

  // display 'Started' or 'Not started' first
  if (isStarted) {
    tags.push({
      title: "Started",
      backgroundColor: theme.palette.success.light
    });
  } else {
    tags.push({
      title: "Not started",
      backgroundColor: theme.palette.error.main
    });
  }

  if (hasUnassignedContacts) {
    tags.push({
      title: "Unassigned contacts",
      backgroundColor: theme.palette.error.main
    });
  } else {
    tags.push({
      title: "All contacts assigned",
      backgroundColor: theme.palette.success.light
    });
  }

  if (isStarted) {
    const tag = hasUnsentInitialMessages
      ? {
          title: "Unsent initial messages",
          backgroundColor: theme.palette.error.main
        }
      : {
          title: "All initials sent",
          backgroundColor: theme.palette.success.light
        };
    tags.push(tag);
  }

  if (isStarted && hasUnhandledMessages) {
    tags.push({
      title: "Unhandled replies",
      backgroundColor: theme.palette.error.main
    });
  }

  return tags;
};
