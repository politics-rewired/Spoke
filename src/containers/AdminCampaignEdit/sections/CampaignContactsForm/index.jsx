import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import Form from "react-formal";
import * as yup from "yup";
import { StyleSheet, css } from "aphrodite";

import FileDrop from "react-file-drop";
import Subheader from "material-ui/Subheader";
import RaisedButton from "material-ui/RaisedButton";
import Toggle from "material-ui/Toggle";
import { ListItem, List } from "material-ui/List";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import UploadIcon from "material-ui/svg-icons/file/file-upload";

import { loadData } from "../../../hoc/with-operations";
import { dataTest } from "../../../../lib/attributes";
import theme from "../../../../styles/theme";
import GSForm from "../../../../components/forms/GSForm";
import SectionWrapper from "../../components/SectionWrapper";
import SelectExcludeCampaigns from "./components/SelectExcludeCampaigns";
import ContactsSqlForm from "./components/ContactsSqlForm";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

import "./styles/file-drop.css";

export const SECTION_OPTIONS = {
  blocksStarting: true,
  expandAfterCampaignStarts: false,
  expandableBySuperVolunteers: false
};

const inlineStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  nestedItem: {
    fontSize: "12px"
  },
  filterLandlinesToggle: {
    marginTop: "15px",
    marginBottom: "15px"
  }
};

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  }
});

const schema = yup.object({
  contactSql: yup.string()
});

const checkIcon = () => <CheckIcon color={theme.colors.green} />;

const sectionSubtitle = (
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

class CampaignContactsForm extends React.Component {
  state = {
    // UI
    isWorking: false,
    contactUploadError: undefined,

    // Pending changes payload
    selectedCampaignIds: [],
    contactSql: undefined,
    contactsFile: undefined,
    filterOutLandlines: false
  };

  handleOnChangeValidSql = contactSql => this.setState({ contactSql });

  handleFileDrop = files => this.setState({ contactsFile: files[0] });
  handleOnSelectFile = ({ target }) => {
    const files = target.files;
    this.setState({ contactsFile: files[0] });
  };

  handleOnChangeExcludedCamapignIds = selectedCampaignIds =>
    this.setState({ selectedCampaignIds });

  handleOnToggleFilterLandlines = (_ev, filterOutLandlines) =>
    this.setState({ filterOutLandlines });

  handleSubmitForm = async () => {
    const {
      contactsFile,
      filterOutLandlines,
      selectedCampaignIds
    } = this.state;

    this.setState({ isWorking: true, contactUploadError: undefined });
    try {
      const campaignInput = {
        contactsFile,
        filterOutLandlines,
        excludeCampaignIds: selectedCampaignIds
      };
      const response = this.props.mutations.editCampaignContacts(campaignInput);
      if (response.errors) throw new Error(response.errors);
      this.props.onComplete();
    } catch (err) {
      this.setState({ contactUploadError: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  render() {
    const {
      isWorking,
      contactUploadError,
      selectedCampaignIds,
      contactSql,
      contactsFile,
      filterOutLandlines
    } = this.state;
    const {
      campaignId,
      active,
      campaignData,
      organizationData,
      isNew,
      adminPerms,
      saveLabel,
      jobs,
      onDiscardJob,
      onExpandChange
    } = this.props;
    const {
      isStarted,
      customFields,
      contactsCount,
      datawarehouseAvailable
    } = campaignData.campaign;

    const {
      numbersApiKey,
      campaigns: { campaigns: allCampaigns }
    } = organizationData.organization;
    const canFilterLandlines = !!numbersApiKey;

    const userHasPermissions =
      adminPerms || SECTION_OPTIONS.expandableBySuperVolunteers;
    const sectionCanExpand =
      SECTION_OPTIONS.expandAfterCampaignStarts || !isStarted;
    const expandable = sectionCanExpand && userHasPermissions;

    const pendingJob = jobs[0];
    const isRunningJob =
      !!pendingJob && pendingJob.status > 0 && pendingJob.status % 100 !== 0;
    const isSaving = isWorking || isRunningJob;
    const isSaveDisabled = isSaving || (!isNew && !contactsFile);

    const isSectionComplete = contactsCount > 0 && !contactSql && !contactsFile;
    const isSectionSaved = !contactsFile;
    const sectionIsDone = isSectionComplete && isSectionSaved;
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    const allOtherCampaigns = allCampaigns.filter(({ id }) => id != campaignId);

    return (
      <SectionWrapper
        title="Contacts"
        expandable={expandable}
        active={active}
        saving={isSaving}
        done={sectionIsDone}
        adminPerms={adminPerms}
        pendingJob={isRunningJob ? pendingJob : undefined}
        onExpandChange={onExpandChange}
        onDiscardJob={onDiscardJob}
      >
        <CampaignFormSectionHeading
          title="Who are you contacting?"
          subtitle={sectionSubtitle}
        />
        <SelectExcludeCampaigns
          allOtherCampaigns={allOtherCampaigns}
          selectedCampaignIds={selectedCampaignIds}
          onChangeExcludedCamapignIds={this.handleOnChangeExcludedCamapignIds}
        />
        {pendingJob && (
          <div>
            <CampaignFormSectionHeading title="Job Outcome" />
            <div>{pendingJob.jobResultMessage}</div>
          </div>
        )}
        <GSForm schema={schema} onSubmit={this.handleSubmitForm}>
          {canFilterLandlines && (
            <Toggle
              label="Filter out landlines?"
              style={inlineStyles.filterLandlinesToggle}
              value={filterOutLandlines}
              onToggle={this.handleOnToggleFilterLandlines}
            />
          )}
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
            <ContactsSqlForm onChangeValidSql={handleOnChangeValidSql} />
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
          {contactUploadError && (
            <List>
              <ListItem
                primaryText={contactUploadError}
                leftIcon={<ErrorIcon color={theme.colors.red} />}
              />
            </List>
          )}
          <Form.Button
            type="submit"
            disabled={isSaveDisabled}
            label={finalSaveLabel}
            component={RaisedButton}
          />
        </GSForm>
      </SectionWrapper>
    );
  }
}

CampaignContactsForm.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaignId: PropTypes.string.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  saveLabel: PropTypes.string.isRequired,
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExpandChange: PropTypes.func.isRequired,
  onDiscardJob: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,

  // GraphQL props
  mutations: PropTypes.shape({
    editCampaignContacts: PropTypes.func.isRequired
  }).isRequired,
  campaignData: PropTypes.shape({
    campaign: PropTypes.shape({
      id: PropTypes.string.isRequired,
      isStarted: PropTypes.bool.isRequired,
      customFields: PropTypes.arrayOf(PropTypes.string).isRequired,
      contactsCount: PropTypes.number.isRequired,
      datawarehouseAvailable: PropTypes.bool.isRequired
    }).isRequired
  }).isRequired,
  organizationData: PropTypes.shape({
    organization: PropTypes.shape({
      id: PropTypes.string.isRequired,
      numbersApiKey: PropTypes.string.isRequired,
      campaigns: PropTypes.shape({
        campaigns: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            createdAt: PropTypes.string.isRequired
          })
        ).isRequired
      }).isRequired
    }).isRequired
  }).isRequired
};

const queries = {
  campaignData: {
    query: gql`
      query getCampaignDataForEditContacts($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          isStarted
          customFields
          contactsCount
          datawarehouseAvailable
        }
      }
    `,
    options: ownProps => ({
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
    options: ownProps => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations = {
  // TODO: this should fetch campaign.sectionProgress.contacts
  editCampaignContacts: ownProps => campaign => ({
    mutation: gql`
      mutation editCampaignContacts(
        $campaignId: String!
        $campaign: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $campaign) {
          id
          customFields
          contactsCount
          datawarehouseAvailable
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      campaign
    }
  })
};

export default loadData({
  queries,
  mutations
})(CampaignContactsForm);
