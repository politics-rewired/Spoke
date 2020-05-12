import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { ApolloQueryResult } from "apollo-client";
import { StyleSheet, css } from "aphrodite";

import FileDrop from "react-file-drop";
import RaisedButton from "material-ui/RaisedButton";
import Subheader from "material-ui/Subheader";
import { ListItem, List } from "material-ui/List";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import UploadIcon from "material-ui/svg-icons/file/file-upload";

import { loadData } from "../../../hoc/with-operations";
import { dataTest } from "../../../../lib/attributes";
import theme from "../../../../styles/theme";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import SelectExcludeCampaigns from "./components/SelectExcludeCampaigns";
import ContactsSqlForm from "./components/ContactsSqlForm";

import "./styles/file-drop.css";

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
  isWorking: boolean;
}

const inlineStyles = {
  nestedItem: {
    fontSize: "12px"
  },
  filterLandlinesToggle: {
    marginTop: "15px",
    marginBottom: "15px"
  }
};

const checkIcon = () => <CheckIcon color={theme.colors.green} />;

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  },
  exampleImageInput: {
    cursor: "pointer",
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: "100%",
    opacity: 0
  }
});

const SectionSubtitle: React.SFC = () => (
  <span>
    Your upload file should be in CSV format with column headings in the first
    row. You must include{" "}
    <span className={css(styles.csvHeader)}>firstName</span>,
    <span className={css(styles.csvHeader)}>lastName</span>, and
    <span className={css(styles.csvHeader)}>cell</span> columns. If you include
    a <span className={css(styles.csvHeader)}>zip</span> column, we'll use the
    zip to guess the contact's timezone for enforcing texting hours. An optional
    column to map the contact to a CRM is{" "}
    <span className={css(styles.csvHeader)}>external_id</span>
    Any additional columns in your file will be available as custom fields to
    use in your texting scripts.
  </span>
);

class CampaignContactsForm extends React.Component<
  ContactsInnerProps,
  ContactsState
> {
  state: ContactsState = {
    // UI
    isWorking: false,

    // Pending changes payload
    selectedCampaignIds: [],
    contactsSql: null,
    contactsFile: null,
    filterOutLandlines: false
  };

  handleOnChangeValidSql = (contactsSql: string | null) =>
    this.setState({ contactsSql });

  handleFileDrop = (files: FileList | null) =>
    this.setState({ contactsFile: (files || [])[0] });

  handleOnSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files || [];
    this.setState({ contactsFile: files[0] });
  };

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

  render() {
    const {
      isWorking,
      selectedCampaignIds,
      contactsSql,
      contactsFile,
      filterOutLandlines
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

    return (
      <div>
        <CampaignFormSectionHeading
          title="Who are you contacting?"
          subtitle={<SectionSubtitle />}
        />
        <SelectExcludeCampaigns
          allOtherCampaigns={allOtherCampaigns}
          selectedCampaignIds={selectedCampaignIds}
          onChangeExcludedCamapignIds={this.handleOnChangeExcludedCamapignIds}
        />
        <FileDrop
          onDrop={this.handleFileDrop}
          targetClassName={
            contactsFile ? "file-drop-target with-file" : "file-drop-target"
          }
        >
          <p>{contactsFile ? contactsFile.name : "Drop a csv here, or"}</p>
          <RaisedButton
            label="Select a file"
            containerElement="label"
            icon={<UploadIcon />}
          >
            <input
              id="csv-upload-field"
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={this.handleOnSelectFile}
            />
          </RaisedButton>
        </FileDrop>
        {datawarehouseAvailable && (
          <ContactsSqlForm
            style={{ marginTop: "20px" }}
            onChangeValidSql={this.handleOnChangeValidSql}
          />
        )}
        {contactsCount > 0 && (
          <List>
            <Subheader>Uploaded</Subheader>
            <ListItem
              {...dataTest("uploadedContacts")}
              primaryText={`${contactsCount} contacts`}
              leftIcon={checkIcon()}
            />
            <ListItem
              primaryText={`${customFields.length} custom fields`}
              leftIcon={checkIcon()}
              nestedItems={customFields.map(field => (
                <ListItem
                  key={field}
                  innerDivStyle={inlineStyles.nestedItem}
                  primaryText={field}
                />
              ))}
            />
          </List>
        )}
        {pendingJob && (
          <List>
            <Subheader>Upload Messages</Subheader>
            {pendingJob.resultMessage.split("\n").length > 0 ? (
              pendingJob.resultMessage
                .split("\n")
                .map(message => (
                  <ListItem key={message} primaryText={message} />
                ))
            ) : (
              <ListItem primaryText={"No results"} />
            )}
          </List>
        )}
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
