import PropTypes from "prop-types";
import React from "react";
import { compose } from "react-apollo";
import gql from "graphql-tag";
import queryString from "query-string";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import { withAuthzContext } from "../../components/AuthzProvider";
import { loadData } from "../hoc/with-operations";

import CampaignEditHeader from "./components/CampaignEditHeader";
import CampaignBasicsForm from "./sections/CampaignBasicsForm";
import CampaignContactsForm from "./sections/CampaignContactsForm";
import CampaignTextersForm from "./sections/CampaignTextersForm";
import CampaignOverlapManager from "./sections/CampaignOverlapManager";
import CampaignInteractionStepsForm from "./sections/CampaignInteractionStepsForm";
import CampaignCannedResponsesForm from "./sections/CampaignCannedResponsesForm";
import CampaignTextingHoursForm from "./sections/CampaignTextingHoursForm";
import CampaignAutoassignModeForm from "./sections/CampaignAutoassignModeForm";
import CampaignTeamsForm from "./sections/CampaignTeamsForm";

const disableTexters = window.DISABLE_CAMPAIGN_EDIT_TEXTERS;

class AdminCampaignEdit extends React.Component {
  state = {
    expandedSection: -1,
    campaignFormValues: {},
    isWorking: false,
    requestError: undefined
  };

  componentDidMount() {
    if (this.isNew()) {
      this.setState({ expandedSection: 0 });
    }
  }

  onExpandChange = (index, newExpandedState) => {
    const { expandedSection } = this.state;

    if (newExpandedState) {
      this.setState({ expandedSection: index });
    } else if (index === expandedSection) {
      this.setState({ expandedSection: null });
    }
  };

  isNew = () => queryString.parse(this.props.location.search).new === "true";

  handleDeleteJob = async jobId => {
    if (
      confirm(
        "Discarding the job will not necessarily stop it from running." +
          " However, if the job failed, discarding will let you try again." +
          " Are you sure you want to discard the job?"
      )
    ) {
      await this.props.mutations.deleteJob(jobId);
      await this.props.pendingJobsData.refetch();
    }
  };

  sections = () => [
    {
      key: "basics",
      content: CampaignBasicsForm,
      jobTypes: []
    },
    {
      key: "textingHours",
      content: CampaignTextingHoursForm,
      jobTypes: []
    },
    {
      key: "contacts",
      content: CampaignContactsForm,
      jobTypes: ["upload_contacts", "contact_sql"]
    }
  ];

  handleSectionOnError = requestError => this.setState({ requestError });
  handleCloseError = () => this.setState({ requestError: undefined });

  /**
   * If this is a new campaign, advance to next section. Otherwise, close the section
   */
  createHandleSectionComplete = sectionIndex => () => {
    const { expandedSection } = this.state;
    const isNew = this.isNew();
    if (isNew) {
      const nextSection = expandedSection + 1;
      const isValidSection = nextSection < this.sections().length;
      this.setState({ expandedSection: isValidSection ? nextSection : -1 });
    } else {
      if (sectionIndex === expandedSection) {
        return this.setState({ expandedSection: -1 });
      }
    }
  };

  render() {
    const sections = this.sections();
    const { expandedSection, requestError } = this.state;
    const { adminPerms, match, pendingJobsData } = this.props;
    const { campaignId, organizationId } = match.params;
    const { pendingJobs } = pendingJobsData.campaign;

    const isNew = this.isNew();
    const saveLabel = isNew ? "Save and goto next section" : "Save";

    const errorActions = [
      <FlatButton label="Ok" primary={true} onClick={this.handleCloseError} />
    ];

    return (
      <div>
        <CampaignEditHeader campaignId={campaignId} />
        {sections.map((section, sectionIndex) => {
          const { content: ContentComponent, jobTypes = [] } = section;
          const sectionIsExpanded = sectionIndex === expandedSection;
          const sectionJobs = pendingJobs.filter(({ jobType }) =>
            jobTypes.includes(jobType)
          );

          const handleExpandChange = expanded =>
            this.onExpandChange(sectionIndex, expanded);

          return (
            <ContentComponent
              key={section.key}
              organizationId={organizationId}
              campaignId={campaignId}
              adminPerms={adminPerms}
              active={sectionIsExpanded}
              isNew={isNew}
              saveLabel={saveLabel}
              saveDisabled={false}
              jobs={sectionJobs}
              onExpandChange={handleExpandChange}
              onDiscardJob={this.handleDeleteJob}
              onError={this.handleSectionOnError}
              onComplete={this.createHandleSectionComplete(sectionIndex)}
            />
          );
        })}
        <Dialog
          title="Request Error"
          actions={errorActions}
          open={requestError !== undefined}
          onRequestClose={this.handleCloseError}
        >
          {requestError || ""}
        </Dialog>
      </div>
    );
  }
}

AdminCampaignEdit.propTypes = {
  mutations: PropTypes.object,
  organizationData: PropTypes.object,
  match: PropTypes.object.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  location: PropTypes.object,
  pendingJobsData: PropTypes.object,
  availableActionsData: PropTypes.object
};

const queries = {
  pendingJobsData: {
    query: gql`
      query getCampaignJobs($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          pendingJobs {
            id
            jobType
            assigned
            status
            resultMessage
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.match.params.campaignId
      },
      fetchPolicy: "cache-and-network"
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          uuid
          teams {
            id
            title
          }
          ${
            disableTexters
              ? ""
              : `
          texters: people {
            id
            firstName
            lastName
            displayName
          }
          `
          }
          numbersApiKey
          campaigns(cursor: { offset: 0, limit: 5000 }) {
            campaigns {
              id
              title
              createdAt
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  },
  availableActionsData: {
    query: gql`
      query getActions($organizationId: String!) {
        availableActions(organizationId: $organizationId) {
          name
          display_name
          instructions
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  deleteJob: ownProps => jobId => ({
    mutation: gql`
      mutation deleteJob($campaignId: String!, $id: String!) {
        deleteJob(campaignId: $campaignId, id: $id) {
          id
        }
      }
    `,
    variables: {
      campaignId: ownProps.match.params.campaignId,
      id: jobId
    }
  })
};

export default compose(
  withAuthzContext,
  loadData({
    queries,
    mutations
  })
)(AdminCampaignEdit);
