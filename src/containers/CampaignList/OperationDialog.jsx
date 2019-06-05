import React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import LoadingIndicator from "../../components/LoadingIndicator";

export const operations = {
  releaseUnsentMessages: {
    title: campaign => `Release Unsent Messages for ${campaign.title}`,
    body: () => `Releasing unsent messages for this campaign will cause unsent messages in this campaign\
      to be removed from texter's assignments. This means that these texters will no longer be able to send\
      these messages, but these messages will become available to assign via the autoassignment\
      functionality.`,
    mutationName: "releaseMessages"
  },
  markForSecondPass: {
    title: campaign =>
      `Mark Unresponded to Messages in ${campaign.title} for a Second Pass`,
    body: () => `Marking unresponded to messages for this campaign will reset the state of messages that have\
      not been responded to by the contact, causing them to show up as needing a first text, as long as the campaign\
      is not past due. After running this operation, the texts will still be assigned to the same texter, so please\
      run 'Release Unsent Messages' after if you'd like these second pass messages to be available for auto-assignment.`
  },
  releaseUnrepliedMessages: {
    title: campaign => `Release Unreplied Conversations for ${campaign.title}`,
    body: () => `Releasing unreplied messages for this campaign will cause unreplied messages in this campaign\
      to be removed from texter's assignments. This means that these texters will no longer be able to respond\
      to these conversations, but these conversations will become available to assign via the autoassignment\
      functionality.`,
    mutationName: "releaseMessages"
  }
};

export const OperationDialogBody = props => {
  const { inProgress, finished, executing, error, setState } = props;

  const [operationName, campaign, operationArs] = inProgress;
  const operationDefinition = operations[operationName];

  if (executing) return <LoadingIndicator />;
  if (error)
    return <span style={{ color: "red" }}> {JSON.stringify(error)} </span>;
  if (finished) return <div>{finished}</div>;

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
              setState(prevState => {
                const nextInProgress = prevState.inProgress.slice();
                nextInProgress[2] = { ageInHours: parseInt(val) };
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
    const { excludeRecentlyTexted, days, hours } = operationArs;
    return (
      <div>
        <p>{operationDefinition.body(campaign)}</p>
        <br />
        <Toggle
          label="Exclude recently texted contacts?"
          toggled={excludeRecentlyTexted}
          onToggle={(ev, val) =>
            setState(prevState => {
              const nextInProgress = prevState.inProgress.slice();
              nextInProgress[2].excludeRecentlyTexted = val;
              return {
                inProgress: nextInProgress
              };
            })
          }
        />
        {excludeRecentlyTexted && (
          <p>Exlcude contacts messaged within the last:</p>
        )}
        {excludeRecentlyTexted && (
          <div style={{ display: "flex" }}>
            <TextField
              style={{ flexGrow: 1, margin: "10px" }}
              type="number"
              floatingLabelText="Number of Days"
              value={days}
              onChange={(ev, val) =>
                setState(prevState => {
                  const nextInProgress = prevState.inProgress.slice();
                  nextInProgress[2].days = parseInt(val);
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
                setState(prevState => {
                  const nextInProgress = prevState.inProgress.slice();
                  nextInProgress[2].hours = parseInt(val);
                  return {
                    inProgress: nextInProgress
                  };
                })
              }
            />
          </div>
        )}
      </div>
    );
  }

  return <div>{operationDefinition.body(campaign)}</div>;
};

export const OperationDialog = props => {
  const {
    inProgress,
    finished,
    executing,
    clearInProgress,
    executeOperation
  } = props;

  const [operationName, campaign] = inProgress;
  const operationDefinition = operations[operationName];

  const actions = finished
    ? [<FlatButton label="Done" primary={true} onClick={clearInProgress} />]
    : [
        <FlatButton
          label="Cancel"
          primary={true}
          disabled={executing}
          onClick={clearInProgress}
        />,
        <FlatButton
          label="Execute Operation"
          primary={true}
          onClick={executeOperation}
        />
      ];

  return (
    <Dialog
      title={operationDefinition.title(campaign)}
      onRequestClose={clearInProgress}
      open={true}
      actions={actions}
    >
      <OperationDialogBody {...props} />
    </Dialog>
  );
};

export default OperationDialog;
