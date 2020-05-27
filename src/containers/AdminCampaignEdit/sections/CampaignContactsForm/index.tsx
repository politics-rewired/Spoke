import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { ApolloQueryResult } from "apollo-client";

import RaisedButton from "material-ui/RaisedButton";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import { loadData } from "../../../hoc/with-operations";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import CSVForm from "./components/CSVForm";
import SelectExcludeCampaigns from "./components/SelectExcludeCampaigns";
import ContactsSqlForm from "./components/ContactsSqlForm";
import UploadResults from "./components/UploadResults";

enum ContactSourceType {
  CSV = "CSV",
  SQL = "SQL"
}

interface ContactsValues {
  contactSql: string | null;
  contactsFile: File | null;
  filterOutLandlines: boolean;
  excludeCampaignIds: string[];
}

interface ContactsCampaign {
  id: string;
  customFields: string[];
  contactsCount: number;
  datawarehouseAvailable: boolean;
}

interface ContactsOrganization {
  id: string;
  numbersApiKey: string;
  campaigns: {
    campaigns: {
      id: string;
      title: string;
      createdAt: string;
    }[];
  };
}

interface ContactsHocProps {
  mutations: {
    editCampaign(payload: ContactsValues): ApolloQueryResult<any>;
  };
  campaignData: {
    campaign: ContactsCampaign;
  };
  organizationData: {
    organization: ContactsOrganization;
  };
}

interface ContactsInnerProps extends FullComponentProps, ContactsHocProps {}

interface ContactsState {
  // Pending changes
  selectedCampaignIds: string[];
  contactsSql: string | null;
  contactsFile: File | null;
  filterOutLandlines: boolean;

  // UI
  source: ContactSourceType;
  isWorking: boolean;
}

class CampaignContactsForm extends React.Component<
  ContactsInnerProps,
  ContactsState
> {
  state: ContactsState = {
    // UI
    source: ContactSourceType.CSV,
    isWorking: false,

    // Pending changes payload
    selectedCampaignIds: [],
    contactsSql: null,
    contactsFile: null,
    filterOutLandlines: false
  };

  handleOnChangeValidSql = (contactsSql: string | null) =>
    this.setState({ contactsSql });

  handleOnContactsFileChange = (contactsFile?: File) =>
    this.setState({ contactsFile: contactsFile || null });

  handleOnChangeExcludedCamapignIds = (selectedCampaignIds: string[]) =>
    this.setState({ selectedCampaignIds });

  handleOnSubmit = async () => {
    const {
      contactsSql,
      contactsFile,
      filterOutLandlines,
      selectedCampaignIds
    } = this.state;

    this.setState({ isWorking: true });
    try {
      const campaignInput = {
        contactSql: contactsSql,
        contactsFile,
        filterOutLandlines,
        excludeCampaignIds: selectedCampaignIds
      };
      const response = await this.props.mutations.editCampaign(campaignInput);
      if (response.errors) throw response.errors;
      // TODO: this.props.onComplete();
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleOnChangeSource = (
    _e: React.SyntheticEvent<{}>,
    _index: number,
    source: any
  ) => this.setState({ source });

  render() {
    const {
      source,
      isWorking,
      selectedCampaignIds,
      contactsSql,
      contactsFile
    } = this.state;
    const {
      campaignId,
      campaignData,
      organizationData,
      isNew,
      pendingJob,
      saveLabel
    } = this.props;
    const {
      customFields,
      contactsCount,
      datawarehouseAvailable
    } = campaignData.campaign;

    const {
      campaigns: { campaigns: allCampaigns }
    } = organizationData.organization;

    const allOtherCampaigns = allCampaigns.filter(({ id }) => id != campaignId);

    const isSaveDisabled =
      isWorking || (!isNew && !contactsFile && !contactsSql);
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    // Configure contact sources
    const sourceOptions = [ContactSourceType.CSV];
    if (datawarehouseAvailable) {
      sourceOptions.push(ContactSourceType.SQL);
    }

    return (
      <div>
        <CampaignFormSectionHeading title="Who are you contacting?" />
        <SelectExcludeCampaigns
          allOtherCampaigns={allOtherCampaigns}
          selectedCampaignIds={selectedCampaignIds}
          onChangeExcludedCamapignIds={this.handleOnChangeExcludedCamapignIds}
        />
        <SelectField
          floatingLabelText="Contact source"
          value={source}
          fullWidth={true}
          onChange={this.handleOnChangeSource}
        >
          {sourceOptions.map(sourceOption => (
            <MenuItem
              key={sourceOption}
              value={sourceOption}
              primaryText={sourceOption}
            />
          ))}
        </SelectField>
        <br />
        <br />
        {source === ContactSourceType.CSV && (
          <CSVForm
            contactsFile={contactsFile}
            onContactsFileChange={this.handleOnContactsFileChange}
          />
        )}
        {source === ContactSourceType.SQL && (
          <ContactsSqlForm
            style={{ marginTop: "20px" }}
            onChangeValidSql={this.handleOnChangeValidSql}
          />
        )}
        <UploadResults
          contactsCount={contactsCount}
          customFields={customFields}
          pendingJob={pendingJob}
        />
        <br />
        <RaisedButton
          label={finalSaveLabel}
          disabled={isSaveDisabled}
          onClick={this.handleOnSubmit}
        />
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
          customFields
          contactsCount
          datawarehouseAvailable
        }
      }
    `,
    options: (ownProps: ContactsInnerProps) => ({
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
    options: (ownProps: ContactsInnerProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations = {
  editCampaign: (ownProps: ContactsInnerProps) => (
    payload: ContactsValues
  ) => ({
    mutation: gql`
      mutation editCampaignContacts(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          customFields
          contactsCount
          datawarehouseAvailable
          readiness {
            id
            contacts
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    }
  })
};

export default compose<ContactsInnerProps, RequiredComponentProps>(
  asSection({
    title: "Contacts",
    readinessName: "contacts",
    jobQueueNames: ["upload_contacts", "upload_contacts_sql"],
    expandAfterCampaignStarts: false,
    expandableBySuperVolunteers: false
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignContactsForm);
