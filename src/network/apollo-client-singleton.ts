import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { getMainDefinition } from "@apollo/client/utilities";
import { createUploadLink } from "apollo-upload-client";
import _fetch from "isomorphic-fetch"; // TODO - remove?
import omitDeep from "omit-deep-lodash";

import { eventBus, EventTypes } from "../client/events";
import iStepLocalResolvers from "../containers/AdminCampaignEdit/sections/CampaignInteractionStepsForm/resolvers";

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
  if (def.kind === "OperationDefinition" && def.operation === "mutation") {
    operation.variables = omitDeep(operation.variables, keysToOmit);
  }
  return forward ? forward(operation) : null;
});

const link = cleanTypenameLink
  .concat(checkVersionLink)
  .concat(errorLink)
  .concat(uploadLink);

const cache = new InMemoryCache({
  addTypename: true,
  possibleTypes: {
    ExternalSyncConfigTarget: [
      "ExternalResultCode",
      "ExternalActivistCode",
      "ExternalSurveyQuestionResponseOption"
    ]
  },
  typePolicies: {
    ExternalList: {
      keyFields: (object) => `${object.id}:${object.externalId}`
    }
  }
});

const ApolloClientSingleton = new ApolloClient({
  link,
  cache,
  connectToDevTools: true,
  queryDeduplication: true,
  resolvers: [iStepLocalResolvers]
});

export default ApolloClientSingleton;
