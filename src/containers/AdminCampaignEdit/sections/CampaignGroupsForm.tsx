import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import type {
  Campaign,
  CampaignGroup,
  Organization
} from "@spoke/spoke-codegen";
import React, { useState } from "react";
import { compose } from "recompose";

import type { MutationMap, QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import type {
  FullComponentProps,
  RequiredComponentProps
} from "../components/SectionWrapper";
import { asSection } from "../components/SectionWrapper";

type GroupSelect = Pick<CampaignGroup, "id" | "name">;

interface HocProps {
  mutations: {
    editCampaign(campaignGroupIds: string[]): ApolloQueryResult<any>;
  };
  data: {
    campaign: Pick<Campaign, "id" | "campaignGroups" | "isStarted">;
  };
  orgCampaignGroups: {
    organization: Pick<Organization, "id" | "campaignGroups">;
  };
}

interface InnerProps extends FullComponentProps, HocProps {}

const CampaignGroupsForm: React.FC<InnerProps> = (props) => {
  const [isWorking, setIsWorking] = useState(false);
  const [pendingGroups, setPendingGroups] = useState<GroupSelect[] | undefined>(
    undefined
  );

  const orgCampaignGroupEdges =
    props.orgCampaignGroups?.organization?.campaignGroups?.edges ?? [];
  const campaignGroupEdges = props.data?.campaign?.campaignGroups?.edges ?? [];

  const orgCampaignGroups = orgCampaignGroupEdges.map(({ node }) => node);

  const campaignGroups = campaignGroupEdges.map(({ node: { id, name } }) => ({
    id,
    name
  }));
  const selectedGroups = pendingGroups ?? campaignGroups;

  const handleChangeGroups = (
    _event: React.ChangeEvent<any>,
    value: Array<GroupSelect>
  ) => setPendingGroups(value);

  const handleSave = async () => {
    if (pendingGroups === undefined) return;

    setIsWorking(true);
    try {
      const campaignGroupIds = pendingGroups.map(({ id }) => id);
      const result = await props.mutations.editCampaign(campaignGroupIds);
      if (result.errors) throw new Error(result.errors[0].message);
      setPendingGroups(undefined);
    } catch (err: any) {
      props.onError(err.message);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <CampaignFormSectionHeading
        title="Campaign Groups"
        subtitle="Associate groups of campaigns together."
      />
      <Autocomplete
        style={{ marginBottom: 10 }}
        multiple
        options={orgCampaignGroups}
        value={selectedGroups}
        getOptionLabel={(group) => group.name}
        filterSelectedOptions
        fullWidth
        onChange={handleChangeGroups}
        getOptionSelected={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Select Campaign Groups"
            placeholder="Select Campaign Groups"
            name="select-campaign-groups-autcomplete"
          />
        )}
      />
      <Button
        variant="contained"
        color="primary"
        disabled={isWorking}
        onClick={handleSave}
      >
        {props.saveLabel}
      </Button>
    </>
  );
};

const queries: QueryMap<InnerProps> = {
  data: {
    query: gql`
      query getCampaignGroups($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          campaignGroups {
            edges {
              node {
                id
                name
              }
            }
          }
          isStarted
          isApproved
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  orgCampaignGroups: {
    query: gql`
      query GetOrgCampaignGroups($organizationId: String!) {
        organization(id: $organizationId) {
          id
          campaignGroups {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};
const mutations: MutationMap<InnerProps> = {
  editCampaign: (ownProps) => (campaignGroupIds: string[]) => ({
    mutation: gql`
      mutation editCampaignBasics(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          campaignGroups {
            edges {
              node {
                id
                name
              }
            }
          }
          isStarted
          isApproved
          readiness {
            id
            campaignGroups
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload: {
        campaignGroupIds
      }
    }
  })
};

export default compose<InnerProps, RequiredComponentProps>(
  asSection({
    title: "Campaign Groups",
    readinessName: "cannedResponses",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: false
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignGroupsForm);
