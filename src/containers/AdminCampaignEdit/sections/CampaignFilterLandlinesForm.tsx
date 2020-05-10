import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { ApolloQueryResult } from "apollo-client";

import RaisedButton from "material-ui/RaisedButton";
import CheckIcon from "material-ui/svg-icons/action/check-circle";

import { loadData } from "../../hoc/with-operations";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../components/SectionWrapper";

interface FilterLandlinesValues {
  campaignId: string;
}

interface FilterLandlinesData {
  id: string;
  landlinesFiltered: boolean;
}

interface FilterLandlinesInnerProps {
  mutations: {
    filterLandlines(
      payload: FilterLandlinesValues
    ): Promise<ApolloQueryResult<any>>;
  };
  campaignData: {
    campaign: FilterLandlinesData;
  };
}

interface Props extends FullComponentProps, FilterLandlinesInnerProps {}

interface State {
  // UI
  isWorking: boolean;
}

class FilterLandlinesForm extends React.Component<Props, State> {
  state: State = {
    // UI
    isWorking: false
  };

  filterLandlines = async () => {
    this.setState({ isWorking: true });

    try {
      const response = await this.props.mutations.filterLandlines({
        campaignId: this.props.campaignId
      });

      if (response.errors) throw response.errors;
    } catch (ex) {
      this.props.onError(ex.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  render() {
    const { isWorking } = this.state;
    const { landlinesFiltered } = this.props.campaignData.campaign;
    const filterJob = this.props.pendingJob;

    return (
      <div>
        <CampaignFormSectionHeading
          title="Filtering Landlines"
          subtitle={
            !landlinesFiltered && (
            <span>
              Filtering landlines or otherwise un-textable numbers will cost
              $.0025 (1/4 cent) per phone number, but as long as more than a
              third of your phone numbers are likely to be invalid, it will save
              you money.
              <br /> <br />
              If you're pretty sure your phone numbers are valid, skip this
              section!
            </span>
            )
          }
        />
        {!landlinesFiltered ? (
          <RaisedButton
            label={"Filter Landlines"}
            onClick={this.filterLandlines}
            disabled={isWorking}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            <CheckIcon style={{ marginRight: 10 }} />
            <span> {filterJob?.resultMessage} </span>
          </div>
        )}
      </div>
    );
  }
}

const queries = {
  campaignData: {
    query: gql`
      query getCampaignContacts($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          landlinesFiltered
        }
      }
    `,
    options: (ownProps: Props) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationDataForEditContacts($organizationId: String!) {
        organization(id: $organizationId) {
          id
          numbersApiKey
        }
      }
    `,
    options: (ownProps: Props) => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations = {
  filterLandlines: (ownProps: Props) => (payload: FilterLandlinesValues) => ({
    mutation: gql`
      mutation filterLandlines($campaignId: String!) {
        filterLandlines(id: $campaignId) {
          id
          landlinesFiltered
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignData.campaign.id
    }
  })
};

export default compose<Props, RequiredComponentProps>(
  asSection({
    title: "Filter Landlines",
    readinessName: "contacts",
    jobQueueNames: ["filter_landlines"],
    expandAfterCampaignStarts: false,
    expandableBySuperVolunteers: false
  }),
  loadData({
    queries,
    mutations
  })
)(FilterLandlinesForm);
