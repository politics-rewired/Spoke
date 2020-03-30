import React from "react";
import PropTypes from "prop-types";
import * as yup from "yup";
import Form from "react-formal";

import RaisedButton from "material-ui/RaisedButton";
import { Card, CardHeader, CardText, CardActions } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { makeTree } from "../../../lib/interaction-step-helpers";
import { dataTest } from "../../../lib/attributes";
import theme from "../../../styles/theme";
import GSForm from "../../../components/forms/GSForm";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

const styles = {
  pullRight: {
    float: "right",
    position: "relative",
    top: "10px",
    icon: "pointer"
  },

  cardHeader: {
    backgroundColor: theme.colors.veryLightGray
  },

  interactionStep: {
    borderLeft: `5px solid ${theme.colors.green}`,
    marginBottom: 24
  },

  answerContainer: {
    marginLeft: "25px",
    marginTop: "10px",
    paddingLeft: "15px",
    borderLeft: `3px dashed ${theme.colors.veryLightGray}`
  }
};

const interactionStepSchema = yup.object({
  scriptOptions: yup.array(yup.string()),
  questionText: yup.string(),
  answerOption: yup.string(),
  answerActions: yup.string()
});

/**
 * Returns `interactionSteps` with `stepId` and all its children marked as `isDeleted`.
 * @param {string} stepId The ID of the interaction step to mark as deleted.
 * @param {string[]} interactionSteps The list of interaction steps to work on.
 */
const markDeleted = (stepId, interactionSteps) => {
  interactionSteps = interactionSteps.map(step => {
    const updates = {};
    if (step.id === stepId) updates.isDeleted = true;
    return Object.assign(step, updates);
  });

  const childSteps = interactionSteps.filter(
    step => step.parentInteractionId === stepId
  );
  for (const childStep of childSteps) {
    interactionSteps = markDeleted(childStep.id, interactionSteps);
  }

  return interactionSteps;
};

class CampaignInteractionStepsForm extends React.Component {
  state = {
    focusedField: null,
    hasBlockCopied: false,
    interactionSteps: this.props.formValues.interactionSteps[0]
      ? this.props.formValues.interactionSteps
      : [
          {
            id: "newId",
            parentInteractionId: null,
            questionText: "",
            answerOption: "",
            scriptOptions: [""],
            answerActions: "",
            isDeleted: false
          }
        ]
  };

  componentDidMount() {
    this.updateClipboardHasBlock();
  }

  onSave = async () => {
    // Strip all empty script versions. "Save" should be disabled in this case, but just in case...
    const interactionSteps = this.state.interactionSteps.map(step => {
      const scriptOptions = step.scriptOptions.filter(
        scriptOption => scriptOption.trim() !== ""
      );
      return Object.assign(step, { scriptOptions });
    });

    await this.props.onChange({
      interactionSteps: makeTree(interactionSteps)
    });
    this.props.onSubmit();
  };

  createAddStepHandler = parentInteractionId => () => {
    const randSuffix = Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "");

    this.setState({
      interactionSteps: [
        ...this.state.interactionSteps,
        {
          id: `new${randSuffix}`,
          parentInteractionId,
          questionText: "",
          scriptOptions: [""],
          answerOption: "",
          answerActions: "",
          isDeleted: false
        }
      ]
    });
  };

  generateId = () =>
    `new${Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "")}`;

  createPasteBlockHandler = parentInteractionId => () => {
    navigator.clipboard.readText().then(text => {
      const idMap = {};

      const newBlocks = JSON.parse(text);

      newBlocks.forEach(interactionStep => {
        idMap[interactionStep.id] = this.generateId();
      });

      const mappedBlocks = newBlocks.map(interactionStep => {
        // Prepend new to force it to create a new one, even if it was already new
        return Object.assign({}, interactionStep, {
          id: idMap[interactionStep.id],
          parentInteractionId:
            idMap[interactionStep.parentInteractionId] || parentInteractionId
        });
      });

      this.setState({
        interactionSteps: this.state.interactionSteps.concat(mappedBlocks)
      });
    });
  };

  createDeleteStepHandler = id => () => {
    const interactionSteps = markDeleted(id, this.state.interactionSteps);
    this.setState({ interactionSteps });
  };

  handleFormChange = event => {
    const updatedEvent = Object.assign({}, event, {
      interactionSteps: undefined
    });
    const interactionSteps = this.state.interactionSteps.map(
      step => (step.id === updatedEvent.id ? updatedEvent : step)
    );
    this.setState({ interactionSteps });
  };

  copyBlock = interactionStep => {
    const interactionStepsInBlock = new Set([interactionStep.id]);
    const { parentInteractionId, ...orphanedInteractionStep } = interactionStep;
    const block = [orphanedInteractionStep];

    let interactionStepsAdded = 1;

    while (interactionStepsAdded !== 0) {
      interactionStepsAdded = 0;

      for (const is of this.state.interactionSteps) {
        if (
          !interactionStepsInBlock.has(is.id) &&
          interactionStepsInBlock.has(is.parentInteractionId)
        ) {
          block.push(is);
          interactionStepsInBlock.add(is.id);
          interactionStepsAdded++;
        }
      }
    }

    navigator.clipboard.writeText(JSON.stringify(block));
    this.updateClipboardHasBlock();
  };

  updateClipboardHasBlock = () => {
    navigator.clipboard.readText().then(text => {
      try {
        const _newBlock = JSON.parse(text);
        if (!this.state.hasBlockCopied) this.setState({ hasBlockCopied: true });
      } catch (ex) {
        if (this.state.hasBlockCopied) this.setState({ hasBlockCopied: false });
      }
    });
  };

  renderInteractionStep(interactionStep, title = "Start") {
    const { availableActions, customFields } = this.props;
    const displayActions =
      parentInteractionId && availableActions && availableActions.length;

    const {
      scriptOptions,
      questionText,
      parentInteractionId,
      answerOption,
      answerActions,
      interactionSteps: childSteps
    } = interactionStep;
    const stepHasScript = scriptOptions.length > 0;
    const stepHasQuestion = questionText;
    const stepCanHaveChildren = !parentInteractionId || answerOption;
    const isAbleToAddResponse =
      stepHasQuestion && stepHasScript && stepCanHaveChildren;

    return (
      <div key={interactionStep.id}>
        <Card
          style={styles.interactionStep}
          ref={interactionStep.id}
          key={interactionStep.id}
        >
          <CardHeader
            style={styles.cardHeader}
            title={title}
            subtitle={
              parentInteractionId
                ? ""
                : "Enter a script for your texter along with the question you want the texter be able to answer on behalf of the contact."
            }
          />
          <CardActions>
            <RaisedButton onClick={() => this.copyBlock(interactionStep)}>
              Copy Block
            </RaisedButton>
          </CardActions>
          <CardText>
            <GSForm
              {...dataTest("childInteraction", !parentInteractionId)}
              schema={interactionStepSchema}
              value={interactionStep}
              onChange={this.handleFormChange}
            >
              {parentInteractionId && (
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <Form.Field
                    {...dataTest("answerOption")}
                    name="answerOption"
                    label="Answer"
                    fullWidth
                    hintText="Answer to the previous question"
                  />
                  <IconButton
                    onTouchTap={this.createDeleteStepHandler(
                      interactionStep.id
                    )}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              )}
              {displayActions && (
                <div key={`answeractions-${interactionStep.id}`}>
                  <Form.Field
                    name="answerActions"
                    type="select"
                    default=""
                    choices={[
                      { value: "", label: "Action..." },
                      ...availableActions.map(action => ({
                        value: action.name,
                        label: action.display_name
                      }))
                    ]}
                  />
                  <IconButton tooltip="An action is something that is triggered by this answer being chosen, often in an outside system">
                    <HelpIconOutline />
                  </IconButton>
                  <div>
                    {answerActions &&
                      availableActions.filter(a => a.name === answerActions)[0]
                        .instructions}
                  </div>
                </div>
              )}
              <Form.Field
                {...dataTest("editorInteraction")}
                name="scriptOptions"
                type="scriptoptions"
                label="Script"
                hintText="This is what your texters will send to your contacts. E.g. Hi, {firstName}. It's {texterFirstName} here."
                customFields={customFields}
                fullWidth
                multiLine
              />
              <Form.Field
                {...dataTest("questionText")}
                name="questionText"
                label="Question"
                fullWidth
                hintText="A question for texters to answer. E.g. Can this person attend the event?"
              />
            </GSForm>
          </CardText>
        </Card>
        <div style={styles.answerContainer}>
          {isAbleToAddResponse &&
            [
              <RaisedButton
                {...dataTest("addResponse")}
                label="+ Add a response"
                onTouchTap={this.createAddStepHandler(interactionStep.id)}
                style={{ marginBottom: "10px" }}
              />
            ].concat(
              this.state.hasBlockCopied
                ? [
                    <RaisedButton
                      label="+ Paste Block"
                      onTouchTap={this.createPasteBlockHandler(
                        interactionStep.id
                      )}
                      style={{ marginBottom: "10px" }}
                    />
                  ]
                : []
            )}
          {childSteps
            .filter(is => !is.isDeleted)
            .map(childStep =>
              this.renderInteractionStep(childStep, `Question: ${questionText}`)
            )}
        </div>
      </div>
    );
  }

  render() {
    const tree = makeTree(this.state.interactionSteps);

    const emptyScriptSteps = this.state.interactionSteps.filter(step => {
      const hasNoOptions = step.scriptOptions.length === 0;
      const hasEmptyScripts =
        step.scriptOptions.filter(version => version.trim() === "").length > 0;
      return hasNoOptions || hasEmptyScripts;
    });

    const hasEmptyScripts = emptyScriptSteps.length > 0;

    return (
      <div
        onFocus={this.updateClipboardHasBlock}
        onClick={this.updateClipboardHasBlock}
      >
        <CampaignFormSectionHeading
          title="What do you want to discuss?"
          subtitle="You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity."
        />
        {this.renderInteractionStep(tree)}
        <RaisedButton
          {...dataTest("interactionSubmit")}
          primary
          label={this.props.saveLabel}
          disabled={hasEmptyScripts}
          onTouchTap={this.onSave}
        />
        {hasEmptyScripts && (
          <p style={{ color: "#DD0000" }}>
            You have one or more empty scripts!
          </p>
        )}
      </div>
    );
  }
}

CampaignInteractionStepsForm.propTypes = {
  formValues: PropTypes.object.isRequired,
  customFields: PropTypes.array.isRequired,
  availableActions: PropTypes.array.isRequired,
  ensureComplete: PropTypes.bool.isRequired,
  saveLabel: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default CampaignInteractionStepsForm;
