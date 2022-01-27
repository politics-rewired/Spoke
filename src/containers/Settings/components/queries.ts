import gql from "graphql-tag";

import { Organization } from "../../../api/organization";
import { OrganizationSettings } from "../../../api/organization-settings";

export interface OrganizationNameType {
  organization: Pick<Organization, "id" | "name">;
}

export const GET_ORGANIZATION_NAME = gql`
  query GetOrganizationName($organizationId: String!) {
    organization(id: $organizationId) {
      id
      name
    }
  }
`;

export const EDIT_ORGANIZATION_NAME = gql`
  mutation EditOrganizationName(
    $organizationId: String!
    $input: EditOrganizationInput!
  ) {
    editOrganization(id: $organizationId, input: $input) {
      id
      name
    }
  }
`;

export interface ConfirmationClickForScriptLinksType {
  organization: Pick<Organization, "id"> & {
    settings: Pick<
      OrganizationSettings,
      "id" | "confirmationClickForScriptLinks"
    >;
  };
}

export const GET_CONFIRMATION_CLICK_FOR_SCRIPT_LINKS = gql`
  query GetConfirmationClickForScriptLinks($organizationId: String!) {
    organization(id: $organizationId) {
      id
      settings {
        id
        confirmationClickForScriptLinks
      }
    }
  }
`;

export const EDIT_CONFIRMATION_CLICK_FOR_SCRIPT_LINKS = gql`
  mutation EditConfirmationClickForScriptLinks(
    $organizationId: String!
    $input: OrganizationSettingsInput!
  ) {
    editOrganizationSettings(id: $organizationId, input: $input) {
      id
      confirmationClickForScriptLinks
    }
  }
`;

export interface OrganizationMessagingServicesType {
  organization: Pick<Organization, "id" | "messagingServices">;
}

export const GET_MESSAGING_SERVICES = gql`
  query GetOrganizationMessagingServices($organizationId: String!) {
    organization(id: $organizationId) {
      id
      messagingServices {
        edges {
          node {
            id
            serviceType
            tcrBrandRegistrationLink
          }
        }
      }
    }
  }
`;
