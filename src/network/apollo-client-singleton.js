import fetch from "isomorphic-fetch"; // TODO - remove?
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { createHttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";

import { eventBus, EventTypes } from "../client/events";

const httpLink = createHttpLink({
  uri: window.GRAPHQL_URL || "/graphql",
  credentials: "same-origin"
});

const errorLink = onError(({ networkError = {}, graphQLErrors }) => {
  if (networkError.statusCode === 401) {
    window.location = `/login?nextUrl=${window.location.pathname}`;
  } else if (networkError.statusCode === 403) {
    window.location = "/";
  } else if (networkError.statusCode === 404) {
    window.location = "/404";
  }
});

const checkVersionLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(data => {
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

const link = checkVersionLink.concat(errorLink).concat(httpLink);

const cache = new InMemoryCache({
  addTypename: true
});

const ApolloClientSingleton = new ApolloClient({
  link,
  cache,
  connectToDevTools: true,
  queryDeduplication: true
});

export default ApolloClientSingleton;
