import {
  defaultDataIdFromObject,
  InMemoryCache,
  IntrospectionFragmentMatcher
} from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { onError } from "apollo-link-error";
import { createUploadLink } from "apollo-upload-client";
import { getMainDefinition } from "apollo-utilities";
import _fetch from "isomorphic-fetch"; // TODO - remove?
import omitDeep from "omit-deep-lodash";

import { eventBus, EventTypes } from "../client/events";
import unions from "./unions.json";

const uploadLink = createUploadLink({
  uri: window.GRAPHQL_URL || "/graphql",
  credentials: "same-origin"
});

const errorLink = onError(({ networkError }) => {
  if (networkError && "statusCode" in networkError) {
    switch (networkError.statusCode) {
      case 401:
        window.location.href = `/login?nextUrl=${window.location.pathname}`;
        break;
      case 403:
        window.location.href = "/";
        break;
      case 404:
        window.location.href = "/404";
        break;
      // no default
    }
  }
});

const checkVersionLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((data) => {
    const clientVersion = window.SPOKE_VERSION;
    const { response } = operation.getContext();
    const serverVersion = response.headers.get("x-spoke-version");
    const didChange = !!serverVersion && clientVersion !== serverVersion;
    if (didChange) {
      eventBus.emit(EventTypes.NewSpokeVersionAvailble, serverVersion);
    }

    return data;
  });
});

// See https://github.com/apollographql/apollo-feature-requests/issues/6#issuecomment-576687277
const cleanTypenameLink = new ApolloLink((operation, forward) => {
  const keysToOmit = ["__typename"]; // more keys like timestamps could be included here

  const def = getMainDefinition(operation.query);
  if (def && def.operation === "mutation") {
    operation.variables = omitDeep(operation.variables, keysToOmit);
  }
  return forward ? forward(operation) : null;
});

const link = cleanTypenameLink
  .concat(checkVersionLink)
  .concat(errorLink)
  .concat(uploadLink);

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: unions
});

const cache = new InMemoryCache({
  addTypename: true,
  fragmentMatcher,
  dataIdFromObject: (object: any) => {
    switch (object.__typename) {
      case "ExternalList":
        return `${object.systemId}:${object.externalId}`;
      default:
        return defaultDataIdFromObject(object);
    }
  }
});

const ApolloClientSingleton = new ApolloClient({
  link,
  cache,
  connectToDevTools: true,
  queryDeduplication: true
});

export default ApolloClientSingleton;
