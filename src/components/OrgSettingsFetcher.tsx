import { ApolloQueryResult, gql } from "@apollo/client";
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
      organization: Pick<Organization, "id" | "settings">;
    }> {}

export const OrgSettingsFetcher: React.FC<InnerProps> = (props) => {
  const { setOrgSettings } = useContext(SpokeContext);

  useEffect(() => {
    if (!setOrgSettings) return;

    setOrgSettings(props.data.organization.settings);
    return () => setOrgSettings(undefined);
  }, [props.data.organization.settings]);

  return <>{props.children}</>;
};

const queries: QueryMap<OuterProps> = {
  data: {
    query: gql`
      query GetOrganizationSettings($organizationId: String!) {
        organization(id: $organizationId) {
          id
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
