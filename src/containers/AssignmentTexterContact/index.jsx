import React from "react";
import PropTypes from "prop-types";
import sample from "lodash/sample";
import { withRouter } from "react-router";
import * as yup from "yup";
import sortBy from "lodash/sortBy";
import md5 from "md5";

import { StyleSheet, css } from "aphrodite";
import RaisedButton from "material-ui/RaisedButton";
import IconButton from "material-ui/IconButton";
import { Toolbar, ToolbarGroup } from "material-ui/Toolbar";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import CircularProgress from "material-ui/CircularProgress";
import Snackbar from "material-ui/Snackbar";
import { grey100, blueGrey100 } from "material-ui/styles/colors";
import CreateIcon from "material-ui/svg-icons/content/create";
import MoreVertIcon from "material-ui/svg-icons/navigation/more-vert";
import LocalOfferIcon from "material-ui/svg-icons/maps/local-offer";

import { isContactNowWithinCampaignHours } from "../../lib/timezones";
import {
  getChildren,
  getTopMostParent,
  interactionStepForId
} from "../../lib/interaction-step-helpers";
import { applyScript } from "../../lib/scripts";
import { dataTest } from "../../lib/attributes";
import MessageList from "../../components/MessageList";
import CannedResponseMenu from "../../components/CannedResponseMenu";
import AssignmentTexterSurveys from "../../components/AssignmentTexterSurveys";
import Empty from "../../components/Empty";
import GSForm from "../../components/forms/GSForm";
import SendButton from "../../components/SendButton";
import BulkSendButton from "../../components/BulkSendButton";
import SendButtonArrow from "../../components/SendButtonArrow";
import ContactActionDialog from "./ContactActionDialog";
import MessageTextField from "./MessageTextField";
import ApplyTagDialog from "./ApplyTagDialog";
import TopFixedSection from "./TopFixedSection";

const TexterDialogType = Object.freeze({
  None: "None",
  OptOut: "OptOut"
});

const styles = StyleSheet.create({
  fullSize: {
    width: "100%",
    height: "100%"
  },
  flexContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    margin: 0
  },
  overlay: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "black",
    zIndex: 1000000
  },
  fixedFlexSection: {
    flex: "0 0 auto"
  },
  dynamicFlexSection: {
    flex: "1 1 auto",
    height: "0px",
    display: "flex"
  },
  verticalScrollingSection: {
    flex: "1 1 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical"
  },
  messageComposition: {
    borderTop: `1px solid ${grey100}`,
    marginBottom: "none"
  },
  messageField: {
    padding: "0px 8px",
    "@media(maxWidth: 450px)": {
      marginBottom: "8%"
    }
  }
});

const inlineStyles = {
  actionToolbarFirst: {
    backgroundColor: "white"
  },
  snackbar: {
    zIndex: 1000001
  }
};

export class AssignmentTexterContact extends React.Component {
  constructor(props) {
    super(props);

    const { assignment, campaign, contact } = this.props;
    const questionResponses = this.getInitialQuestionResponses(
      contact.questionResponseValues
    );
    const availableSteps = this.getAvailableInteractionSteps(questionResponses);

    let disabled = false;
    let disabledText = "Sending...";
    let snackbarOnTouchTap = null;
    let snackbarActionTitle = null;
    let snackbarError = null;

    if (assignment.id !== contact.assignmentId || campaign.isArchived) {
      disabledText = "";
      disabled = true;
      snackbarError = "Your assignment has changed";
      snackbarOnTouchTap = this.goBackToTodos;
      snackbarActionTitle = "Back to Todos";
    } else if (contact.optOut) {
      disabledText = "Skipping opt-out...";
      disabled = true;
    } else if (!isContactNowWithinCampaignHours(contact, campaign)) {
      disabledText = "Refreshing ...";
      disabled = true;
    }

    const [messageVersionHash, messageText] = this.getStartingMessageText();

    this.state = {
      disabled,
      disabledText,
      // this prevents jitter by not showing the optout/skip buttons right after sending
      justSentNew: false,
      questionResponses,
      snackbarError,
      snackbarActionTitle,
      snackbarOnTouchTap,
      optOutMessageText: campaign.organization.optOutMessage,
      tagMessageText: "",
      addedTags: [],
      removedTags: [],
      pendingNewTags: [],
      responsePopoverOpen: false,
      messageText,
      messageVersionHash,
      dialogType: TexterDialogType.None,
      currentInteractionStep:
        availableSteps.length > 0
          ? availableSteps[availableSteps.length - 1]
          : null,
      isTagEditorOpen: false
    };
  }

  componentDidMount() {
    const { contact, campaign } = this.props;
    if (contact.optOut) {
      this.skipContact();
    } else if (!isContactNowWithinCampaignHours(contact, campaign)) {
      setTimeout(() => {
        this.props.refreshData();
        this.setState({ disabled: false });
      }, 1500);
    }

    const scroller = this.refs.messageScrollContainer;
    if (scroller) {
      scroller.scrollTo(0, scroller.scrollHeight);
    }

    document.body.addEventListener("keyup", this.onEnterUp);
  }

  componentWillUnmount() {
    document.body.removeEventListener("keyup", this.onEnterUp);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.errors.length !== nextProps.length) {
      this.state.disabled = false;
    }
  }

  // Handle submission on <enter> *up* to prevent holding enter
  onEnterUp = event => {
    const keyCode = event.keyCode || event.which;
    if (keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const { dialogType } = this.state;
      if (dialogType === TexterDialogType.OptOut) {
        this.handleOptOut();
      } else {
        this.handleClickSendMessageButton();
      }
    }
  };

  setDisabled = (disabled = true) => {
    this.setState({ disabled });
  };

  getAvailableInteractionSteps = questionResponses => {
    const allInteractionSteps = this.props.campaign.interactionSteps;
    const availableSteps = [];

    let step = getTopMostParent(allInteractionSteps);

    while (step) {
      availableSteps.push(step);
      const questionResponseValue = questionResponses[step.id];
      if (questionResponseValue) {
        const matchingAnswerOption = step.question.answerOptions.find(
          answerOption => answerOption.value === questionResponseValue
        );
        if (matchingAnswerOption && matchingAnswerOption.nextInteractionStep) {
          step = interactionStepForId(
            matchingAnswerOption.nextInteractionStep.id,
            allInteractionSteps
          );
        } else {
          step = null;
        }
      } else {
        step = null;
      }
    }

    return availableSteps;
  };

  getInitialQuestionResponses = questionResponseValues => {
    const questionResponses = {};
    questionResponseValues.forEach(questionResponse => {
      questionResponses[questionResponse.interactionStepId] =
        questionResponse.value;
    });

    return questionResponses;
  };
  getMessageTextFromScript = script => {
    const { campaign, contact, texter } = this.props;

    return script
      ? applyScript({
          contact,
          texter,
          script,
          customFields: campaign.customFields
        })
      : null;
  };

  getStartingMessageText = () => {
    const { contact, campaign } = this.props;
    if (contact.messageStatus === "needsMessage") {
      const { scriptOptions } = getTopMostParent(campaign.interactionSteps);
      const randomScript = sample(scriptOptions);
      const scriptVersionHash = md5(randomScript);
      return [scriptVersionHash, this.getMessageTextFromScript(randomScript)];
    }
    return [null, ""];
  };

  handleOpenPopover = event => {
    event.preventDefault();
    const { assignment } = this.props;
    const { userCannedResponses, campaignCannedResponses } = assignment;
    const isCannedResponseEnabled =
      userCannedResponses.length + campaignCannedResponses.length > 0;
    if (isCannedResponseEnabled) {
      this.setState({
        responsePopoverAnchorEl: event.currentTarget,
        responsePopoverOpen: true
      });
    }
  };

  handleClosePopover = () => {
    this.setState({
      responsePopoverOpen: false
    });
  };

  handleCannedResponseChange = cannedResponseScript => {
    this.handleChangeScript(cannedResponseScript);
  };

  createMessageToContact = text => {
    const { texter, assignment } = this.props;
    const { contact } = this.props;

    return {
      contactNumber: contact.cell,
      userId: texter.id,
      text,
      assignmentId: assignment.id,
      versionHash: this.state.messageVersionHash
    };
  };

  goBackToTodos = () => {
    const { campaign } = this.props;
    this.props.history.push(`/app/${campaign.organization.id}/todos`);
  };

  handleMessageFormSubmit = ({ messageText }) => {
    // Process the submit synchronously
    if (this.state.alreadySent || this.state.disabled) {
      return; // stops from multi-send
    }
    this.setState({ disabled: true, alreadySent: true }, () => {
      // Actually deliver the payload asyncronously
      this.submitAction(messageText);
    });
  };

  submitAction = async messageText => {
    const { contact } = this.props;
    const message = this.createMessageToContact(messageText);
    const changes = this.gatherSurveyAndTagChanges();
    const payload = Object.assign({ message }, changes);
    this.props.sendMessage(contact.id, payload);
  };

  gatherSurveyAndTagChanges = () => {
    const { contact } = this.props;
    const { addedTags, removedTags } = this.state;

    const changes = {};

    // Gather survey question changes
    const deletionIds = [];
    const questionResponseObjects = [];

    const interactionStepIds = Object.keys(this.state.questionResponses);

    const count = interactionStepIds.length;

    for (let i = 0; i < count; i++) {
      const interactionStepId = interactionStepIds[i];
      const value = this.state.questionResponses[interactionStepId];
      if (value) {
        questionResponseObjects.push({
          interactionStepId,
          campaignContactId: contact.id,
          value
        });
      } else {
        deletionIds.push(interactionStepId);
      }
    }

    if (questionResponseObjects.length)
      changes.questionResponseObjects = questionResponseObjects;
    if (deletionIds.length) changes.deletionIds = deletionIds;

    // Gather tag changes
    const tag = {
      addedTagIds: addedTags.map(tag => tag.id),
      removedTagIds: removedTags.map(tag => tag.id)
    };

    if (tag.addedTagIds.length > 0 || tag.removedTagIds.length > 0) {
      changes.tag = tag;
    }

    // Return aggregate changes
    return changes;
  };

  handleClickCloseContactButton = async () => {
    const { contact } = this.props;
    await this.handleEditMessageStatus("closed");
    const payload = this.gatherSurveyAndTagChanges();
    await this.props.sendMessage(contact.id, payload);
  };

  handleEditMessageStatus = async messageStatus => {
    const { contact } = this.props;
    await this.props.mutations.editCampaignContactMessageStatus(
      messageStatus,
      contact.id
    );
  };

  handleOptOut = () => {
    const { disabled, optOutMessageText } = this.state;
    const { assignment, contact } = this.props;
    if (disabled) {
      return; // stops from multi-send
    }
    this.setState({ disabled: true });

    const optOut = {
      cell: contact.cell,
      assignmentId: assignment.id
    };

    if (optOutMessageText.length) {
      const message = this.createMessageToContact(optOutMessageText);
      optOut.message = message;
    }

    const payload = Object.assign(
      {},
      { optOut },
      this.gatherSurveyAndTagChanges()
    );
    this.props.sendMessage(contact.id, payload);
  };

  handleOpenOptOutDialog = () => {
    this.setState({ dialogType: TexterDialogType.OptOut });
  };

  handleApplyTags = (addedTags, removedTags, callback) => {
    const pendingNewTags = this.props.contact.contactTags || [];

    addedTags.forEach(addedTag => {
      const tagDoesNotExist = !pendingNewTags.find(
        currentTag => currentTag.id === addedTag.id
      );

      if (tagDoesNotExist) {
        pendingNewTags.push(addedTag);
      }
    });

    removedTags.forEach(removedTag => {
      const idxOfExistingTag = pendingNewTags.findIndex(
        currentTag => currentTag.id === removedTag.id
      );

      if (idxOfExistingTag > -1) {
        pendingNewTags.splice(idxOfExistingTag, 1);
      }
    });

    if (callback) {
      this.setState(
        { addedTags, removedTags, pendingNewTags, isTagEditorOpen: false },
        callback
      );
    } else {
      this.setState({
        addedTags,
        removedTags,
        pendingNewTags,
        isTagEditorOpen: false
      });
    }

    if (!callback && addedTags.length > 0) {
      const mostImportantTag = sortBy(addedTags, "id")[0];
      const tagMessageText = mostImportantTag.onApplyScript;
      if (tagMessageText !== "") this.handleChangeScript(tagMessageText);
    }
  };

  handleApplyTagsAndMoveOn = (addedTags, removedTags) => {
    this.handleApplyTags(addedTags, removedTags, async () => {
      const { contact } = this.props;
      const payload = this.gatherSurveyAndTagChanges();
      await this.props.sendMessage(contact.id, payload);
    });
  };

  handleCloseDialog = () => {
    this.setState({ dialogType: TexterDialogType.None });
  };

  handleChangeScript = newScript => {
    const messageVersionHash = md5(newScript);
    const messageText = this.getMessageTextFromScript(newScript);
    this.setState({ messageText, messageVersionHash });
  };

  handleQuestionResponseChange = ({
    interactionStep,
    questionResponseValue,
    nextScript
  }) => {
    const { questionResponses } = this.state;
    const { interactionSteps } = this.props.campaign;
    questionResponses[interactionStep.id] = questionResponseValue;

    const children = getChildren(interactionStep, interactionSteps);
    for (const childStep of children) {
      if (childStep.id in questionResponses) {
        questionResponses[childStep.id] = null;
      }
    }

    this.setState(
      {
        questionResponses
      },
      () => {
        this.handleChangeScript(nextScript);
      }
    );
  };

  handleClickSendMessageButton = () => {
    this.refs.form.submit();
    if (this.props.contact.messageStatus === "needsMessage") {
      this.setState({ justSentNew: true });
    }
  };

  optOutSchema = yup.object({
    optOutMessageText: yup.string()
  });

  skipContact = () => {
    this.props.onFinishContact();
  };

  bulkSendMessages = async assignmentId => {
    await this.props.mutations.bulkSendMessages(assignmentId);
    this.props.refreshData();
  };

  messageSchema = yup.object({
    messageText: yup
      .string()
      .trim()
      .required("Can't send empty message")
      .max(window.MAX_MESSAGE_LENGTH)
  });

  handleMessageFormChange = ({ messageText }) => {
    const { messageStatus } = this.props.contact;
    // Do not allow deviating from the script for the first message of a campaign
    if (messageStatus !== "needsMessage") {
      this.setState({ messageText });
    }
  };

  renderSurveySection() {
    const { contact } = this.props;
    const { questionResponses } = this.state;

    const availableInteractionSteps = this.getAvailableInteractionSteps(
      questionResponses
    );

    return (
      <AssignmentTexterSurveys
        contact={contact}
        interactionSteps={availableInteractionSteps}
        onQuestionResponseChange={this.handleQuestionResponseChange}
        currentInteractionStep={this.state.currentInteractionStep}
        questionResponses={questionResponses}
      />
    );
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact;
    let button = null;
    if (messageStatus === "closed") {
      button = (
        <RaisedButton
          onTouchTap={() => this.handleEditMessageStatus("needsResponse")}
          label="Reopen"
        />
      );
    } else if (messageStatus === "needsResponse") {
      button = (
        <RaisedButton
          onTouchTap={this.handleClickCloseContactButton}
          label="Skip Reply"
        />
      );
    }

    return button;
  }

  renderActionToolbar() {
    const {
      contact,
      campaign,
      tags,
      assignment,
      navigationToolbarChildren,
      onFinishContact
    } = this.props;
    const { userCannedResponses, campaignCannedResponses } = assignment;
    const isCannedResponseEnabled =
      userCannedResponses.length + campaignCannedResponses.length > 0;
    const { justSentNew, alreadySent } = this.state;
    const { messageStatus } = contact;
    const size = document.documentElement.clientWidth;

    if (messageStatus === "needsMessage" || justSentNew) {
      return (
        <div>
          <Toolbar style={inlineStyles.actionToolbarFirst}>
            <ToolbarGroup firstChild>
              <SendButton
                threeClickEnabled={campaign.organization.threeClickEnabled}
                onFinalTouchTap={
                  alreadySent ? undefined : this.handleClickSendMessageButton
                }
                disabled={this.state.disabled}
              />
              {window.NOT_IN_USA &&
              window.ALLOW_SEND_ALL &&
              window.BULK_SEND_CHUNK_SIZE ? (
                <BulkSendButton
                  assignment={assignment}
                  onFinishContact={onFinishContact}
                  bulkSendMessages={this.bulkSendMessages}
                  setDisabled={this.setDisabled}
                />
              ) : (
                ""
              )}
              <div style={{ float: "right", marginLeft: 20 }}>
                {navigationToolbarChildren}
              </div>
            </ToolbarGroup>
          </Toolbar>
        </div>
      );
    } else if (size < 450) {
      // for needsResponse or messaged or convo
      return (
        <div
          style={{
            padding: "5px 5px 0 5px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "white"
          }}
        >
          <RaisedButton
            {...dataTest("optOut")}
            secondary
            label="Opt out"
            onTouchTap={this.handleOpenOptOutDialog}
            tooltip="Opt out this contact"
          />
          <RaisedButton
            label="Canned replies"
            onTouchTap={this.handleOpenPopover}
            disabled={!isCannedResponseEnabled}
          />
          {this.renderNeedsResponseToggleButton(contact)}
          <div style={{ flexGrow: 1, textAlign: "center" }}>
            {navigationToolbarChildren}
          </div>
          <IconMenu
            iconButtonElement={
              <IconButton style={{ backgroundColor: blueGrey100 }}>
                <MoreVertIcon />
              </IconButton>
            }
            anchorOrigin={{ horizontal: "right", vertical: "top" }}
            targetOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem
              primaryText="Manage Tags"
              leftIcon={<LocalOfferIcon />}
              disabled={tags.length === 0}
              onClick={() => this.setState({ isTagEditorOpen: true })}
            />
          </IconMenu>
        </div>
      );
    } else if (size >= 768) {
      // for needsResponse or messaged
      return (
        <div>
          <Toolbar style={inlineStyles.actionToolbarFirst}>
            <ToolbarGroup firstChild>
              <SendButton
                threeClickEnabled={campaign.organization.threeClickEnabled}
                onFinalTouchTap={this.handleClickSendMessageButton}
                disabled={this.state.disabled}
              />
              {this.renderNeedsResponseToggleButton(contact)}
              <RaisedButton
                label="Canned responses"
                onTouchTap={this.handleOpenPopover}
                disabled={!isCannedResponseEnabled}
              />
              <RaisedButton
                {...dataTest("optOut")}
                secondary
                label="Opt out"
                onTouchTap={this.handleOpenOptOutDialog}
              />
              <RaisedButton
                label="Manage Tags"
                backgroundColor={blueGrey100}
                icon={<LocalOfferIcon />}
                disabled={tags.length === 0}
                onClick={() => this.setState({ isTagEditorOpen: true })}
              />
              <div style={{ float: "right", marginLeft: 20 }}>
                {navigationToolbarChildren}
              </div>
            </ToolbarGroup>
          </Toolbar>
        </div>
      );
    }
    return "";
  }

  renderCannedResponsePopover() {
    const { campaign, assignment, texter } = this.props;
    const { userCannedResponses, campaignCannedResponses } = assignment;

    return (
      <CannedResponseMenu
        onRequestClose={this.handleClosePopover}
        open={this.state.responsePopoverOpen}
        anchorEl={this.state.responsePopoverAnchorEl}
        campaignCannedResponses={campaignCannedResponses}
        userCannedResponses={userCannedResponses}
        customFields={campaign.customFields}
        campaignId={campaign.id}
        texterId={texter.id}
        onSelectCannedResponse={this.handleCannedResponseChange}
      />
    );
  }

  renderCorrectSendButton() {
    const { messageStatus } = this.props.contact;
    const validStates = ["messaged", "convo", "needsResponse"];
    if (validStates.indexOf(messageStatus) > -1) {
      return (
        <SendButtonArrow
          onClick={this.handleClickSendMessageButton}
          onFinalTouchTap={this.handleClickSendMessageButton}
          disabled={this.state.disabled}
        />
      );
    }
    return null;
  }

  renderBottomFixedSection() {
    const { contact, tags } = this.props;
    const {
      dialogType,
      messageText,
      alreadySent,
      isTagEditorOpen,
      pendingNewTags
    } = this.state;

    return (
      <div>
        {contact.messages.length > 0 && this.renderSurveySection()}
        {dialogType === TexterDialogType.None && (
          <div>
            <div className={css(styles.messageField)}>
              <GSForm
                ref="form"
                schema={this.messageSchema}
                value={{ messageText }}
                onSubmit={
                  alreadySent ? undefined : this.handleMessageFormSubmit
                }
                onChange={this.handleMessageFormChange}
              >
                <MessageTextField />
                {this.renderCorrectSendButton()}
              </GSForm>
            </div>
            {this.renderActionToolbar()}
            <ApplyTagDialog
              open={isTagEditorOpen}
              contactTags={contact.contactTags}
              pendingNewTags={pendingNewTags}
              allTags={tags}
              onRequestClose={() => this.setState({ isTagEditorOpen: false })}
              onApplyTag={this.handleApplyTags}
              onApplyTagsAndMoveOn={this.handleApplyTagsAndMoveOn}
            />
          </div>
        )}
        {dialogType === TexterDialogType.OptOut && (
          <ContactActionDialog
            title="Opt out user"
            messageText={this.state.optOutMessageText}
            submitTitle={
              this.state.optOutMessageText ? "Send" : "Opt Out without Text"
            }
            onChange={({ messageText }) =>
              this.setState({ optOutMessageText: messageText })
            }
            onSubmit={this.handleOptOut}
            handleCloseDialog={this.handleCloseDialog}
          />
        )}
        {this.renderCannedResponsePopover()}
      </div>
    );
  }

  render() {
    const { disabled } = this.state;
    const { campaign, contact, contactSettings, onExitTexter } = this.props;

    const backgroundColor =
      contact.messageStatus === "needsResponse"
        ? "rgba(83, 180, 119, 0.25)"
        : "";

    return (
      <div className={css(styles.fullSize)}>
        {disabled && (
          <div className={css(styles.overlay)}>
            <CircularProgress size={24} style={{ marginRight: "10px" }} />
            {this.state.disabledText}
          </div>
        )}
        <div className={css(styles.flexContainer)}>
          <div className={css(styles.fixedFlexSection)}>
            <TopFixedSection
              contactSettings={contactSettings}
              campaign={campaign}
              contact={contact}
              onExitTexter={onExitTexter}
            />
          </div>
          <div className={css(styles.dynamicFlexSection)}>
            {contact.messages.length > 0 ? (
              <div
                ref="messageScrollContainer"
                className={css(styles.verticalScrollingSection)}
                {...dataTest("messageList")}
              >
                <MessageList contact={contact} messages={contact.messages} />
              </div>
            ) : (
              <Empty
                title={`This is your first message to ${contact.firstName}`}
                icon={<CreateIcon color="rgb(83, 180, 119)" />}
                style={{ flex: "1 1 auto" }}
              />
            )}
          </div>
          <div className={css(styles.fixedFlexSection, css.messageComposition)}>
            {this.renderBottomFixedSection()}
          </div>
        </div>
        <Snackbar
          style={inlineStyles.snackbar}
          open={!!this.state.snackbarError}
          message={this.state.snackbarError || ""}
          action={this.state.snackbarActionTitle}
          onActionClick={this.state.snackbarOnTouchTap}
        />
        {this.props.errors.map((err, idx) => (
          <Snackbar
            key={err.id}
            style={Object.assign({}, inlineStyles.snackbar, {
              bottom: idx * 50,
              width: 700
            })}
            open={true}
            message={err.snackbarError || ""}
            action={err.snackbarActionTitle}
            onActionClick={err.snackbarOnTouchTap}
            transitionDuration={0}
          />
        ))}
      </div>
    );
  }
}

AssignmentTexterContact.propTypes = {
  errors: PropTypes.array,
  contact: PropTypes.object,
  contactSettings: PropTypes.object,
  tags: PropTypes.arrayOf(PropTypes.object).isRequired,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  texter: PropTypes.object,
  navigationToolbarChildren: PropTypes.array,
  onFinishContact: PropTypes.func,
  history: PropTypes.object.isRequired,
  mutations: PropTypes.object,
  refreshData: PropTypes.func,
  onExitTexter: PropTypes.func,
  onRefreshAssignmentContacts: PropTypes.func
};

export default withRouter(AssignmentTexterContact);
