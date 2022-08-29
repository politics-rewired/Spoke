/* eslint-disable import/prefer-default-export */
import type { FetchResult } from "@apollo/client";

export const aggregateGraphQLErrors = <T>(response: FetchResult<T>) => {
  const { errors } = response;
  if (errors) {
    const errorMessages = errors.map((error) => error.message).join(", ");
    throw new Error(errorMessages);
  }
  return response;
};
