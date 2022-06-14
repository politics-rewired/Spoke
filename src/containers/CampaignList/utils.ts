/* eslint-disable import/prefer-default-export */
import { GraphQLError } from "graphql";

export const isSupervolPermissionError = (gqlError: GraphQLError) => {
  return (
    gqlError.path &&
    gqlError.path[gqlError.path.length - 1] === "campaignGroups" &&
    gqlError.extensions.code === "FORBIDDEN"
  );
};
