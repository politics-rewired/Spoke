import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withTheme } from "@material-ui/core/styles";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";
import pick from "lodash/pick";
import Avatar from "material-ui/Avatar";
import { Card, CardActions, CardHeader, CardText } from "material-ui/Card";
import CircularProgress from "material-ui/CircularProgress";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import { red600 } from "material-ui/styles/colors";
import DoneIcon from "material-ui/svg-icons/action/done";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import CancelIcon from "material-ui/svg-icons/navigation/cancel";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";
import { compose } from "react-apollo";

import { withAuthzContext } from "../../components/AuthzProvider";
import { camelCase, dataTest } from "../../lib/attributes";
import { DateTime } from "../../lib/datetime";
import theme from "../../styles/theme";
import { loadData } from "../hoc/with-operations";
import CampaignAutoassignModeForm from "./sections/CampaignAutoassignModeForm";
import CampaignBasicsForm from "./sections/CampaignBasicsForm";
import CampaignCannedResponsesForm from "./sections/CampaignCannedResponsesForm";
import CampaignContactsForm from "./sections/CampaignContactsForm";
import CampaignFilterLandlinesForm from "./sections/CampaignFilterLandlinesForm";
import CampaignIntegrationForm from "./sections/CampaignIntegrationForm";
import CampaignInteractionStepsForm from "./sections/CampaignInteractionStepsForm";
import CampaignOverlapManager from "./sections/CampaignOverlapManager";
import CampaignTeamsForm from "./sections/CampaignTeamsForm";
import CampaignTextersForm from "./sections/CampaignTextersForm";
import CampaignTextingHoursForm from "./sections/CampaignTextingHoursForm";

const disableTexters = window.DISABLE_CAMPAIGN_EDIT_TEXTERS;

// TODO: replace with Fragment
const campaignInfoFragment = `
  id
  title
  description
  dueBy
  isStarted
  isArchived
  contactsCount
  datawarehouseAvailable
  customFields
  useDynamicAssignment
  logoImageUrl
  introHtml
  primaryColor
  textingHoursStart
  textingHoursEnd
  isAssignmentLimitedToTeams
  isAutoassignEnabled
  timezone
  teams {
    id
    title
  }
  ${
    disableTexters
      ? ""
      : `
  texters {
    id
    firstName
    lastName
    assignment(campaignId:$campaignId) {
      contactsCount
      needsMessageCount: contactsCount(contactsFilter:{messageStatus:"needsMessage"})
      maxContacts
    }
  }
  `
  }
  interactionSteps {
    id
    questionText
    scriptOptions
    answerOption
    answerActions
    parentInteractionId
    isDeleted
    createdAt
  }
  editors
`;

const extractStageAndStatus = (percentComplete) => {
  if (percentComplete > 100) {
    return `Filtering out landlines. ${percentComplete - 100}% complete`;
  }
  return `Uploading. ${percentComplete}% complete`;
};

class AdminCampaignEdit extends React.Component {
  constructor(props) {
    super(props);
    const isNew = queryString.parse(props.location.search).new;
    this.state = {
      expandedSection: isNew ? 0 : null,
      campaignFormValues: { ...props.campaignData.campaign },
      startingCampaign: false,
      isWorking: false,
      requestError: undefined
    };
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    // This should only update the campaignFormValues sections that
    // are NOT expanded so the form data doesn't compete with the user
    // The basic flow of data:
    // 1. User adds data to a section -> this.state.campaignFormValues
    // 2. User saves -> (handleSave) mutations.editCampaign ->
    // 3. Refetch/poll updates data in loadData component wrapper
    //    and triggers *this* method => this.props.campaignData => this.state.campaignFormValues
    // So campaignFormValues should always be the diffs between server and client form data
    let { expandedSection } = this.state;
    let expandedKeys = [];
    if (expandedSection !== null) {
      expandedSection = this.sections()[expandedSection];
      expandedKeys = expandedSection.keys;
    }

    const campaignDataCopy = {
      ...newProps.campaignData.campaign
    };
    expandedKeys.forEach((key) => {
      // contactsCount is in two sections
      // That means it won't get updated if *either* is opened
      // but we want it to update in either
      if (key === "contactsCount") {
        return;
      }
      delete campaignDataCopy[key];
    });
    // NOTE: Since this does not _deep_ copy the values the
    // expandedKey pointers will remain the same object as before
    // so setState passes on those subsections should1 not refresh
    const pushToFormValues = {
      ...this.state.campaignFormValues,
      ...campaignDataCopy
    };
    // contacts and contactSql need to be *deleted*
    // when contacts are done on backend so that Contacts section
    // can be marked saved, but only when user is NOT editing Contacts
    if (campaignDataCopy.contactsCount > 0) {
      const specialCases = ["contacts", "contactsFile", "contactSql"];
      specialCases.forEach((key) => {
        if (expandedKeys.indexOf(key) === -1) {
          delete pushToFormValues[key];
        }
      });
    }

    this.setState({
      campaignFormValues: { ...pushToFormValues }
    });
  }

  onExpandChange = (index, newExpandedState) => {
    const { expandedSection } = this.state;

    if (newExpandedState) {
      this.setState({ expandedSection: index });
    } else if (index === expandedSection) {
      this.setState({ expandedSection: null });
    }
  };

  getSectionState(section) {
    const sectionState = {};
    section.keys.forEach((key) => {
      sectionState[key] = this.state.campaignFormValues[key];
    });
    return sectionState;
  }

  isNew = () => {
    return Boolean(queryString.parse(this.props.location.search).new);
  };

  handleDeleteJob = async (jobId) => {
    if (
      // eslint-disable-next-line no-alert,no-restricted-globals
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

  handleChange = (formValues) => {
    this.setState({
      campaignFormValues: {
        ...this.state.campaignFormValues,
        ...formValues
      }
    });
  };

  handleSubmit = async () => {
    await this.handleSave();
    this.setState({
      expandedSection:
        this.state.expandedSection >= this.sections().length - 1 ||
        !this.isNew()
          ? null
          : this.state.expandedSection + 1
    }); // currently throws an unmounted component error in the console
    this.props.campaignData.refetch();
  };

  handleSave = async () => {
    // only save the current expanded section
    const { expandedSection } = this.state;
    if (expandedSection === null) {
      return;
    }

    const section = this.sections()[expandedSection];
    let newCampaign = {};
    if (this.checkSectionSaved(section)) {
      return; // already saved and no data changes
    }

    newCampaign = {
      ...this.getSectionState(section)
    };

    if (Object.keys(newCampaign).length > 0) {
      // Transform the campaign into an input understood by the server
      delete newCampaign.customFields;
      delete newCampaign.contactsCount;
      if (
        Object.prototype.hasOwnProperty.call(newCampaign, "contacts") &&
        newCampaign.contacts
      ) {
        const contactData = newCampaign.contacts.map((contact) => {
          const customFields = {};
          const contactInput = {
            cell: contact.cell,
            firstName: contact.firstName,
            lastName: contact.lastName,
            zip: contact.zip || "",
            external_id: contact.external_id || ""
          };
          Object.keys(contact).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(contactInput, key)) {
              customFields[key] = contact[key].trim();
            }
          });
          contactInput.customFields = JSON.stringify(customFields);
          return contactInput;
        });
        newCampaign.contacts = contactData;
        newCampaign.texters = [];
      } else {
        newCampaign.contacts = null;
      }
      if (Object.prototype.hasOwnProperty.call(newCampaign, "teams")) {
        newCampaign.teamIds = newCampaign.teams.map((team) => team.id);
        delete newCampaign.teams;
      }
      if (Object.prototype.hasOwnProperty.call(newCampaign, "texters")) {
        newCampaign.texters = newCampaign.texters.map((texter) => ({
          id: texter.id,
          needsMessageCount: texter.assignment.needsMessageCount,
          maxContacts: texter.assignment.maxContacts,
          contactsCount: texter.assignment.contactsCount
        }));
      }
      if (
        Object.prototype.hasOwnProperty.call(newCampaign, "interactionSteps")
      ) {
        newCampaign.interactionSteps = {
          ...newCampaign.interactionSteps
        };
      }

      this.setState({ isWorking: true });
      try {
        const response = await this.props.mutations.editCampaign(
          this.props.campaignData.campaign.id,
          newCampaign
        );
        if (response.errors) throw new Error(response.errors);
      } catch (err) {
        const isJsonError = err.message.includes(
          "Unexpected token < in JSON at position 0"
        );
        const errorMessage = isJsonError
          ? "There was an error with your request. This is likely due to uploading a contact list that is too large."
          : err.message;
        this.setState({ requestError: errorMessage });
      } finally {
        this.setState({ isWorking: false });
      }

      this.pollDuringActiveJobs();
    }
  };

  pollDuringActiveJobs = async (noMore) => {
    const pendingJobs = await this.props.pendingJobsData.refetch();
    if (pendingJobs.length && !noMore) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      setTimeout(() => {
        // run it once more after there are no more jobs
        self.pollDuringActiveJobs(true);
      }, 1000);
    }
    this.props.campaignData.refetch();
  };

  checkSectionSaved = (section) => {
    // Tests section's keys of campaignFormValues against props.campaignData
    // * Determines greyness of section button
    // * Determine if section is marked done (in green) along with checkSectionCompleted()
    // * Must be false for a section to save!!
    if (Object.prototype.hasOwnProperty.call(section, "checkSaved")) {
      return section.checkSaved();
    }

    const [formVals, propVals] = [
      this.state.campaignFormValues,
      this.props.campaignData.campaign
    ].map((vals) => pick(vals, section.keys));
    return isEqual(formVals, propVals);
  };

  checkSectionCompleted = (section) => {
    return section.checkCompleted();
  };

  sections = () => {
    const sections = [
      {
        title: "Basics",
        content: CampaignBasicsForm,
        isStandalone: true,
        keys: [
          "title",
          "description",
          "dueBy",
          "logoImageUrl",
          "primaryColor",
          "introHtml"
        ],
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        checkCompleted: () =>
          this.state.campaignFormValues.title !== "" &&
          this.state.campaignFormValues.description !== "" &&
          this.state.campaignFormValues.dueBy !== null
      },
      {
        title: "Texting Hours",
        content: CampaignTextingHoursForm,
        isStandalone: true,
        keys: ["textingHoursStart", "textingHoursEnd", "timezone"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false
      },
      {
        title: "Integration",
        content: CampaignIntegrationForm,
        isStandalone: true,
        keys: ["externalSystem"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: false
      },
      {
        title: "Contacts",
        content: CampaignContactsForm,
        isStandalone: true,
        keys: [
          "contacts",
          "contactsCount",
          "customFields",
          "contactsFile",
          "contactSql",
          "excludeCampaignIds"
        ],
        checkCompleted: () => this.state.campaignFormValues.contactsCount > 0,
        checkSaved: () => {
          const { campaignFormValues } = this.state;
          // Must be false for save to be tried
          // Must be true for green bar, etc.
          // This is a little awkward because neither of these fields are 'updated'
          //   from the campaignData query, so we must delete them after save/update
          //   at the right moment (see componentWillReceiveProps)
          return (
            campaignFormValues.contactsCount > 0 &&
            Object.prototype.hasOwnProperty.call(
              campaignFormValues,
              "contacts"
            ) === false &&
            Object.prototype.hasOwnProperty.call(
              campaignFormValues,
              "contactsFile"
            ) === false &&
            Object.prototype.hasOwnProperty.call(
              campaignFormValues,
              "contactSql"
            ) === false
          );
        },
        blocksStarting: true,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: false,
        extraProps: {
          optOuts: [], // this.props.organizationData.organization.optOuts, // <= doesn't scale
          datawarehouseAvailable: this.props.campaignData.campaign
            .datawarehouseAvailable,
          jobResult: this.props.pendingJobsData.campaign.pendingJobs.find(
            (job) => /contacts/.test(job.jobType)
          ),
          canFilterLandlines:
            this.props.organizationData.organization &&
            !!this.props.organizationData.organization.numbersApiKey,
          otherCampaigns: this.props.organizationData.organization.campaigns.campaigns.filter(
            (campaign) => campaign.id !== this.props.match.params.campaignId
          )
        }
      },
      {
        title: "Filtering Landlines",
        content: CampaignFilterLandlinesForm,
        isStandalone: true,
        keys: ["landlinesFiltered"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: false,
        extraProps: {},
        exclude:
          this.props.organizationData.organization &&
          !this.props.organizationData.organization.numbersApiKey
      },
      {
        title: "Contact Overlap Management",
        content: CampaignOverlapManager,
        keys: [],
        blockStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false,
        checkCompleted: () => true
      },
      {
        title: "Teams",
        content: CampaignTeamsForm,
        keys: ["teams", "isAssignmentLimitedToTeams"],
        checkSaved: () => {
          const {
            isAssignmentLimitedToTeams: newIsAssignmentLimitedToTeams,
            teams: newTeams
          } = this.state.campaignFormValues;
          const {
            isAssignmentLimitedToTeams,
            teams
          } = this.props.campaignData.campaign;
          const sameIsAssignmentLimitedToTeams =
            newIsAssignmentLimitedToTeams === isAssignmentLimitedToTeams;
          const sameTeams = isEqual(
            new Set(newTeams.map((team) => team.id)),
            new Set(teams.map((team) => team.id))
          );
          return sameIsAssignmentLimitedToTeams && sameTeams;
        },
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false,
        extraProps: {
          orgTeams: this.props.organizationData.organization.teams
        }
      },
      {
        title: "Texters",
        content: CampaignTextersForm,
        keys: ["texters", "contactsCount", "useDynamicAssignment"],
        checkCompleted: () =>
          (this.state.campaignFormValues.texters.length > 0 &&
            this.state.campaignFormValues.contactsCount ===
              this.state.campaignFormValues.texters.reduce(
                (left, right) => left + right.assignment.contactsCount,
                0
              )) ||
          this.state.campaignFormValues.useDynamicAssignment === true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          isOverdue:
            DateTime.local() >=
            DateTime.fromISO(this.props.campaignData.campaign.dueBy),
          orgTexters: this.props.organizationData.organization.texters,
          organizationUuid: this.props.organizationData.organization.uuid,
          campaignId: this.props.campaignData.campaign.id
        }
      },
      {
        title: "Interactions",
        content: CampaignInteractionStepsForm,
        isStandalone: true,
        keys: ["interactionSteps"],
        checkCompleted: () =>
          this.state.campaignFormValues.interactionSteps.length > 0,
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields,
          availableActions: this.props.availableActionsData.availableActions
        }
      },
      {
        title: "Canned Responses",
        content: CampaignCannedResponsesForm,
        isStandalone: true,
        keys: ["cannedResponses"],
        checkCompleted: () => true,
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields
        }
      },
      {
        title: "Autoassign Mode",
        content: CampaignAutoassignModeForm,
        isStandalone: true,
        keys: ["isAutoassignEnabled"],
        checkCompleted: () => true,
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false
      }
    ];

    return (disableTexters
      ? sections.filter((section) => section.title !== "Texters")
      : sections
    ).filter((section) => !section.exclude);
  };

  sectionSaveStatus = (section) => {
    const { pendingJobs } = this.props.pendingJobsData.campaign;
    let sectionIsSaving = false;
    let relatedJob = null;
    let savePercent = 0;
    let jobMessage = null;
    let jobId = null;
    if (pendingJobs.length > 0) {
      if (section.title === "Contacts") {
        [relatedJob] = pendingJobs.filter(
          (job) =>
            job.jobType === "upload_contacts" || job.jobType === "contact_sql"
        );
      } else if (section.title === "Texters") {
        [relatedJob] = pendingJobs.filter(
          (job) => job.jobType === "assign_texters"
        );
      } else if (section.title === "Interactions") {
        [relatedJob] = pendingJobs.filter(
          (job) => job.jobType === "create_interaction_steps"
        );
      }
    }

    if (relatedJob) {
      sectionIsSaving = !relatedJob.resultMessage;
      savePercent = relatedJob.status;
      jobMessage = relatedJob.resultMessage;
      jobId = relatedJob.id;
    }
    return {
      sectionIsSaving,
      savePercent,
      jobMessage,
      jobId
    };
  };

  renderCurrentEditors = () => {
    const { editors } = this.props.campaignData.campaign;
    if (editors) {
      return <div>This campaign is being edited by: {editors}</div>;
    }
    return "";
  };

  renderCampaignFormSection = (section, forceDisable) => {
    const { isWorking } = this.state;
    const shouldDisable =
      isWorking ||
      forceDisable ||
      (!this.isNew() && this.checkSectionSaved(section));
    const saveLabel = isWorking
      ? "Working..."
      : this.isNew()
      ? "Save and goto next section"
      : "Save";
    const ContentComponent = section.content;
    const formValues = this.getSectionState(section);
    return (
      <ContentComponent
        onChange={this.handleChange}
        formValues={formValues}
        saveLabel={saveLabel}
        saveDisabled={shouldDisable}
        ensureComplete={this.props.campaignData.campaign.isStarted}
        onSubmit={this.handleSubmit}
        campaignId={this.props.match.params.campaignId}
        organizationId={this.props.match.params.organizationId}
        {...section.extraProps}
      />
    );
  };

  renderHeader = () => {
    const {
      campaign: { dueBy, isStarted, title } = {}
    } = this.props.campaignData;

    const isOverdue = DateTime.local() >= DateTime.fromISO(dueBy);

    const notStarting = isStarted ? (
      <div
        {...dataTest("campaignIsStarted")}
        style={{
          color: isOverdue ? red600 : theme.colors.green,
          fontWeight: 800
        }}
      >
        {isOverdue
          ? "This campaign is running but is overdue!"
          : "This campaign is running!"}
        {this.renderCurrentEditors()}
      </div>
    ) : (
      this.renderStartButton()
    );

    return (
      <div
        style={{
          marginBottom: 15,
          fontSize: 16
        }}
      >
        {title && <h1> {title} </h1>}
        {this.state.startingCampaign ? (
          <div
            style={{
              color: theme.colors.gray,
              fontWeight: 800
            }}
          >
            <CircularProgress
              size={0.5}
              style={{
                verticalAlign: "middle",
                display: "inline-block"
              }}
            />
            Starting your campaign...
          </div>
        ) : (
          notStarting
        )}
      </div>
    );
  };

  renderStartButton = () => {
    if (!this.props.adminPerms) {
      // Supervolunteers don't have access to start the campaign or un/archive it
      return null;
    }
    let isCompleted =
      this.props.pendingJobsData.campaign.pendingJobs.filter((job) =>
        /Error/.test(job.resultMessage || "")
      ).length === 0;
    this.sections().forEach((section) => {
      if (
        (section.blocksStarting && !this.checkSectionCompleted(section)) ||
        !this.checkSectionSaved(section)
      ) {
        isCompleted = false;
      }
    });

    return (
      <div
        style={{
          ...theme.layouts.multiColumn.container
        }}
      >
        <div
          style={{
            ...theme.layouts.multiColumn.flexColumn
          }}
        >
          {isCompleted
            ? "Your campaign is all good to go! >>>>>>>>>"
            : "You need to complete all the sections below before you can start this campaign"}
          {this.renderCurrentEditors()}
        </div>
        <div>
          {this.props.campaignData.campaign.isArchived ? (
            <RaisedButton
              label="Unarchive"
              onClick={() =>
                this.props.mutations.unarchiveCampaign(
                  this.props.campaignData.campaign.id
                )
              }
            />
          ) : (
            <RaisedButton
              label="Archive"
              onClick={() =>
                this.props.mutations.archiveCampaign(
                  this.props.campaignData.campaign.id
                )
              }
            />
          )}
          <RaisedButton
            {...dataTest("startCampaign")}
            primary
            label="Start This Campaign!"
            disabled={!isCompleted}
            onClick={async () => {
              this.setState({
                startingCampaign: true
              });
              await this.props.mutations.startCampaign(
                this.props.campaignData.campaign.id
              );
              this.setState({
                startingCampaign: false
              });
            }}
          />
        </div>
      </div>
    );
  };

  handleCloseError = () => this.setState({ requestError: undefined });

  handleSectionError = (requestError) => this.setState({ requestError });

  handleExpandChange = (sectionIndex) => (isExpended) =>
    this.onExpandChange(sectionIndex, isExpended);

  render() {
    const sections = this.sections();
    const { expandedSection, requestError } = this.state;
    const { adminPerms, match, theme: stableMuiTheme } = this.props;
    const campaignId = parseInt(match.params.campaignId, 10);
    const isNew = this.isNew();
    const saveLabel = isNew ? "Save and goto next section" : "Save";

    const errorActions = [
      <FlatButton key="ok" label="Ok" primary onClick={this.handleCloseError} />
    ];

    return (
      <div>
        {this.renderHeader()}
        {sections.map((section, sectionIndex) => {
          if (section.isStandalone) {
            const { content: Component } = section;
            return (
              <Component
                key={section.title}
                organizationId={match.params.organizationId}
                campaignId={campaignId}
                active={expandedSection === sectionIndex}
                isNew={isNew}
                saveLabel={saveLabel}
                onError={this.handleSectionError}
                onExpandChange={this.handleExpandChange(sectionIndex)}
              />
            );
          }
          const sectionIsDone =
            this.checkSectionCompleted(section) &&
            this.checkSectionSaved(section);
          const sectionIsExpanded = sectionIndex === expandedSection;
          let avatar = null;
          const cardHeaderStyle = {
            backgroundColor: theme.colors.lightGray
          };
          const titleStyle = {
            width: "100%"
          };
          const avatarStyle = {
            display: "inline-block",
            verticalAlign: "middle"
          };

          const {
            sectionIsSaving,
            savePercent,
            jobMessage,
            jobId
          } = this.sectionSaveStatus(section);
          const sectionCanExpandOrCollapse =
            (section.expandAfterCampaignStarts ||
              !this.props.campaignData.campaign.isStarted) &&
            (adminPerms || section.expandableBySuperVolunteers);

          if (sectionIsSaving) {
            avatar = <CircularProgress style={avatarStyle} size={25} />;
            cardHeaderStyle.background = theme.colors.lightGray;
            cardHeaderStyle.width = `${
              savePercent > 100 ? savePercent - 100 : savePercent
            }%`;
          } else if (sectionIsExpanded && sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor =
              stableMuiTheme.palette.warning.main;
            titleStyle.color = stableMuiTheme.palette.text.primary;
          } else if (!sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor = theme.colors.lightGray;
            titleStyle.color = stableMuiTheme.palette.text.primary;
          } else if (sectionIsDone) {
            avatar = (
              <Avatar
                icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
                style={avatarStyle}
                size={25}
              />
            );
            cardHeaderStyle.backgroundColor =
              stableMuiTheme.palette.primary.main;
            titleStyle.color = stableMuiTheme.palette.text.secondary;
          } else if (!sectionIsDone) {
            avatar = (
              <Avatar
                icon={<WarningIcon style={{ fill: theme.colors.orange }} />}
                style={avatarStyle}
                size={25}
              />
            );
            cardHeaderStyle.backgroundColor =
              stableMuiTheme.palette.warning.main;
            titleStyle.color = stableMuiTheme.palette.text.primary;
          }
          return (
            <Card
              {...dataTest(camelCase(`${section.title}`))}
              key={section.title}
              expanded={sectionIsExpanded && sectionCanExpandOrCollapse}
              expandable={sectionCanExpandOrCollapse}
              onExpandChange={(newExpandedState) =>
                this.onExpandChange(sectionIndex, newExpandedState)
              }
              style={{
                marginTop: 1
              }}
            >
              <CardHeader
                title={section.title}
                titleStyle={titleStyle}
                style={cardHeaderStyle}
                actAsExpander={!sectionIsSaving && sectionCanExpandOrCollapse}
                showExpandableButton={
                  !sectionIsSaving && sectionCanExpandOrCollapse
                }
                avatar={avatar}
              />
              <CardText expandable>
                {this.renderCampaignFormSection(section, sectionIsSaving)}
              </CardText>
              {sectionIsSaving && adminPerms ? (
                <CardActions>
                  <div>
                    Current Status: {extractStageAndStatus(savePercent)}
                  </div>
                  {jobMessage ? <div>Message: {jobMessage}</div> : null}
                  <RaisedButton
                    label="Discard Job"
                    icon={<CancelIcon />}
                    onClick={() => this.handleDeleteJob(jobId)}
                  />
                </CardActions>
              ) : null}
            </Card>
          );
        })}
        <Dialog
          title="Request Error"
          open={requestError !== undefined}
          onClose={this.handleCloseError}
        >
          <DialogTitle>Request Error</DialogTitle>
          <DialogContent>
            <DialogContentText>{requestError || ""}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
        </Dialog>
      </div>
    );
  }
}

AdminCampaignEdit.propTypes = {
  campaignData: PropTypes.object,
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
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.match.params.campaignId
      },
      fetchPolicy: "cache-and-network"
    })
  },
  campaignData: {
    query: gql`query getCampaign($campaignId: String!) {
      campaign(id: $campaignId) {
        ${campaignInfoFragment}
      }
    }`,
    options: (ownProps) => ({
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
    options: (ownProps) => ({
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
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

// Right now we are copying the result fields instead of using a fragment because of https://github.com/apollostack/apollo-client/issues/451
const mutations = {
  archiveCampaign: (_ownProps) => (campaignId) => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: (_ownProps) => (campaignId) => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  startCampaign: (_ownProps) => (campaignId) => ({
    mutation: gql`mutation startCampaign($campaignId: String!) {
        startCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  editCampaign: (_ownProps) => (campaignId, campaign) => ({
    mutation: gql`
      mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
        editCampaign(id: $campaignId, campaign: $campaign) {
          ${campaignInfoFragment}
        }
      },
    `,
    variables: {
      campaignId,
      campaign
    }
  }),
  deleteJob: (ownProps) => (jobId) => ({
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
  withTheme,
  withAuthzContext,
  loadData({
    queries,
    mutations
  })
)(AdminCampaignEdit);
