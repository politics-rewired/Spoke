import gql from "graphql-tag";

import { Organization } from "../../../api/organization";

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
