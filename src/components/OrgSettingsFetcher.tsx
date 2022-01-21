import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import React, { useContext, useEffect } from "react";

import { Organization } from "../api/organization";
import { AllOrganizationSettingsFragment } from "../api/organization-settings";
import SpokeContext from "../client/spoke-context";
import { loadData } from "../containers/hoc/with-operations";
import { QueryMap } from "../network/types";

interface OuterProps {
  organizationId: string;
}

interface InnerProps
  extends OuterProps,
    ApolloQueryResult<{
      organization: Pick<Organization, "id" | "name" | "settings">;
    }> {}

export const OrgSettingsFetcher: React.FC<InnerProps> = (props) => {
  const { setOrgSettings, setOrg } = useContext(SpokeContext);

  useEffect(() => {
    if (!setOrgSettings || !setOrg) return;

    const { settings, ...org } = props.data.organization;

    setOrg(org);
    setOrgSettings(settings);
    return () => {
      setOrg(undefined);
      setOrgSettings(undefined);
    };
  }, [props.data.organization, props.data.organization.settings]);

  return <>{props.children}</>;
};

const queries: QueryMap<OuterProps> = {
  data: {
    query: gql`
      query GetOrganizationSettings($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
          settings {
            ...AllOrganizationSettingsFragment
          }
        }
      }
      ${AllOrganizationSettingsFragment}
    `,
    skip: (props) => !props.organizationId,
    options: ({ organizationId }) => ({
      variables: {
        organizationId
      }
    })
  }
};

export default loadData({
  queries
})(OrgSettingsFetcher);
