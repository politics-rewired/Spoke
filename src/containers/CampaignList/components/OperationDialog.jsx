/* eslint-disable jsx-a11y/label-has-associated-control */
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import React from "react";

import LoadingIndicator from "../../../components/LoadingIndicator";

export const operations = {
  releaseUnsentMessages: {
    title: (campaign) => `Release Unsent Messages for ${campaign.title}`,
    body: () => `Releasing unsent messages for this campaign will cause unsent messages in this campaign\
      to be removed from texter's assignments. This means that these texters will no longer be able to send\
      these messages, but these messages will become available to assign via the autoassignment\
      functionality.`,
    mutationName: "releaseMessages"
  },
  markForSecondPass: {
    title: (campaign) =>
      `Mark Unresponded to Messages in ${campaign.title} for a Second Pass`,
    body: () => `Marking messages that have not been responded to on this campaign will reset the state of those\
      messages, causing them to show up as needing a first text for a second time.`
  },
  releaseUnrepliedMessages: {
    title: (campaign) =>
      `Release Unreplied Conversations for ${campaign.title}`,
    body: () => `Releasing unreplied messages for this campaign will cause unreplied messages in this campaign\
      to be removed from texter's assignments. This means that these texters will no longer be able to respond\
      to these conversations, but these conversations will become available to assign via the autoassignment\
      functionality.`,
    mutationName: "releaseMessages"
  },
  deleteNeedsMessage: {
    title: (campaign) => `Delete Un-Messaged Contacts for ${campaign.title}`,
    body: () => `Deleting unmessaged contacts for this campaign will remove contacts that have not received a message yet.\
      This operation is useful if, for one reason or another, you don't want to message any more contacts on this\
      campaign, but still want to use autoassignment to handle replies. This might be because there's a mistake in\
      the script or file, or because the event for which you were sending these messages has already happened.`,
    mutationName: "deleteNeedsMessage",
    deletionProtection: true
  },
  unMarkForSecondPass: {
    title: (campaign) => `Un-Mark ${campaign.title} for a Second Pass`,
    body: () => `Un-marking this campaign for a second pass will mark contacts that have been sent a message but are marked\
      as unmessaged because of a second pass as having been messaged, effectively undoing the 'Mark for Second Pass' operation.\
      This operation is useful if, for one reason or another, you don't want to message any more contacts on this campaign,\
      but still want to use autoassignment to handle replies. This might be because there's a mistake in the script or file,\
      or because the event for which you were sending these messages has already happened. This will not affect contacts\
      that have not yet received one message, or contacts that have replied.`,
    mutationName: "unMarkForSecondPass"
  },
  turnAutoAssignOn: {
    title: (campaign) => `Turn auto-assign ON for ${campaign.title}`,
    body: () =>
      `Turning auto-assign ON means that this campaign's contacts will be eligible to be assigned by the text request form`,
    mutationName: "turnAutoAssignOn"
  },
  turnAutoAssignOff: {
    title: (campaign) => `Turn auto-assign OFF for ${campaign.title}`,
    body: () =>
      `Turning auto-assign OFF means that this campaign's contacts will not be assigned by the text request form`,
    mutationName: "turnAutoAssignOff"
  }
};

export const OperationDialogBody = (props) => {
  const { inProgress, finished, executing, error, setState } = props;

  const [operationName, campaign, operationArs] = inProgress;
  const operationDefinition = operations[operationName];

  if (executing) return <LoadingIndicator />;
  if (error)
    return <span style={{ color: "red" }}> {JSON.stringify(error)} </span>;
  if (finished)
    return <div>{typeof finished === "string" ? finished : "Done"}</div>;

  if (operationName === "releaseUnrepliedMessages") {
    const { ageInHours } = operationArs;
    return (
      <div>
        {operationDefinition.body(campaign)}
        <br />
        <p>
          <label>
            {" "}
            How many hours ago should a conversation have been idle for it to be
            unassigned?{" "}
          </label>
          <TextField
            type="number"
            floatingLabelText="Number of Hours"
            defaultValue={1}
            value={ageInHours}
            onChange={(ev, val) =>
              setState((prevState) => {
                const nextInProgress = prevState.inProgress.slice();
                nextInProgress[2] = { ageInHours: parseInt(val, 10) };
                return {
                  inProgress: nextInProgress
                };
              })
            }
          />
        </p>
      </div>
    );
  }

  if (operationName === "markForSecondPass") {
    const { excludeNewer, excludeRecentlyTexted, days, hours } = operationArs;
    return (
      <div>
        <p>{operationDefinition.body(campaign)}</p>
        <p>
          To read about best practices for second passes, head{" "}
          <a
            href="https://docs.spokerewired.com/article/101-running-a-second-pass"
            rel="noreferrer"
            target="_blank"
          >
            here
          </a>
          .
        </p>
        <br />
        <div style={{ width: "100%", display: "flex", flexDirection: "row" }}>
          <div style={{ flexGrow: 1 }}>
            <Toggle
              label="Exclude recently texted contacts?"
              toggled={excludeRecentlyTexted}
              onToggle={(ev, val) =>
                setState((prevState) => {
                  const nextInProgress = prevState.inProgress.slice();
                  nextInProgress[2].excludeRecentlyTexted = val;
                  return {
                    inProgress: nextInProgress
                  };
                })
              }
            />
          </div>
          <div style={{ flexGrow: 1 }}>
            {excludeRecentlyTexted &&
              "Exclude contacts messaged within the last:"}
            {excludeRecentlyTexted && (
              <div style={{ display: "flex" }}>
                <TextField
                  style={{ flexGrow: 1, margin: "10px" }}
                  type="number"
                  floatingLabelText="Number of Days"
                  value={days}
                  onChange={(ev, val) =>
                    setState((prevState) => {
                      const nextInProgress = prevState.inProgress.slice();
                      nextInProgress[2].days = parseInt(val, 10);
                      return {
                        inProgress: nextInProgress
                      };
                    })
                  }
                />
                <TextField
                  style={{ flexGrow: 1, margin: "10px" }}
                  type="number"
                  floatingLabelText="Number of Hours"
                  value={hours}
                  onChange={(ev, val) =>
                    setState((prevState) => {
                      const nextInProgress = prevState.inProgress.slice();
                      nextInProgress[2].hours = parseInt(val, 10);
                      return {
                        inProgress: nextInProgress
                      };
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
        <br />
        <Toggle
          label="Exclude contacts uploaded on a newer campaign?"
          toggled={excludeNewer}
          onToggle={(ev, val) =>
            setState((prevState) => {
              const nextInProgress = prevState.inProgress.slice();
              nextInProgress[2].excludeNewer = val;
              return {
                inProgress: nextInProgress
              };
            })
          }
        />
      </div>
    );
  }

  return <div>{operationDefinition.body(campaign)}</div>;
};

const DELETION_PROTECTION_TEXT = "delete contacts";

export class OperationDialog extends React.Component {
  state = {
    pendingDeletionProtectionCheck: false,
    deletionProtectionCheckText: undefined
  };

  startDeletionProtectionCheck = () =>
    this.setState({ pendingDeletionProtectionCheck: true });

  setDeletionProtectionCheckText = (_, value) =>
    this.setState({ deletionProtectionCheckText: value });

  render() {
    const {
      inProgress,
      finished,
      executing,
      clearInProgress,
      executeOperation
    } = this.props;

    const [operationName, campaign] = inProgress;
    const operationDefinition = operations[operationName];

    const useDeletionProtection = operationDefinition.deletionProtection;

    const deletionProtectionChallengeCompleted =
      this.state.deletionProtectionCheckText === DELETION_PROTECTION_TEXT;

    const actions = finished
      ? [
          <Button key="done" color="primary" onClick={clearInProgress}>
            Done
          </Button>
        ]
      : [
          <Button
            key="cancel"
            color="primary"
            disabled={executing}
            onClick={clearInProgress}
          >
            Cancel
          </Button>,
          <Button
            key="execute"
            color="primary"
            disabled={
              this.state.pendingDeletionProtectionCheck &&
              !deletionProtectionChallengeCompleted
            }
            onClick={
              useDeletionProtection
                ? deletionProtectionChallengeCompleted
                  ? executeOperation
                  : this.startDeletionProtectionCheck
                : executeOperation
            }
          >
            Execute Operation
          </Button>
        ];

    return (
      <Dialog open maxWidth="lg" onClose={clearInProgress}>
        <DialogTitle>{operationDefinition.title(campaign)}</DialogTitle>
        <DialogContent>
          <OperationDialogBody {...this.props} />
          {!(executing || finished) &&
            this.state.pendingDeletionProtectionCheck && (
              <TextField
                floatingLabelText={`To continue, type ${DELETION_PROTECTION_TEXT}`}
                fullWidth
                onChange={this.setDeletionProtectionCheckText}
                value={this.state.deletionProtectionCheckText}
              />
            )}
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}
