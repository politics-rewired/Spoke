import { ApolloQueryResult, gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import ChipInput from "material-ui-chip-input";
import React, { useState } from "react";
import { compose } from "recompose";

import { Campaign } from "../../../api/campaign";
import { CampaignGroup } from "../../../api/campaign-group";
import { Organization } from "../../../api/organization";
import { MutationMap, QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../components/SectionWrapper";

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

  // Prevent user-defined teams
  const handleBeforeRequestAdd = ({
    id: groupId,
    name
  }: {
    id: string;
    name: string;
  }) => !Number.isNaN(groupId) && groupId !== name;

  const handleAddGroup = (group: GroupSelect) =>
    setPendingGroups([...selectedGroups, group]);

  const handleRemoveGroup = (deleteGroupId: string) =>
    setPendingGroups(selectedGroups.filter(({ id }) => id !== deleteGroupId));

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
      <ChipInput
        value={selectedGroups}
        dataSourceConfig={{ text: "name", value: "id" }}
        dataSource={orgCampaignGroups}
        placeholder="Select campaign groups"
        fullWidth
        openOnFocus
        onBeforeRequestAdd={handleBeforeRequestAdd}
        onRequestAdd={handleAddGroup}
        onRequestDelete={handleRemoveGroup}
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
