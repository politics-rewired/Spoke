import React from "react";
import type from "prop-types";
import * as yup from 'yup';
import Form from "react-formal";

import RaisedButton from "material-ui/RaisedButton";
import { Card, CardHeader, CardText } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { makeTree } from "../lib";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";
import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";

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
    marginLeft: "35px",
    marginTop: "10px",
    borderLeft: `3px dashed ${theme.colors.veryLightGray}`
  }
};

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

  onSave = async () => {
    await this.props.onChange({
      interactionSteps: makeTree(this.state.interactionSteps)
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

  formSchema = yup.object({
    scriptOptions: yup.array(yup.string()),
    questionText: yup.string(),
    answerOption: yup.string(),
    answerActions: yup.string()
  });

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
    const stepHasScript = scriptOptions[0];
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
          <CardText>
            <GSForm
              {...dataTest("childInteraction", !parentInteractionId)}
              schema={this.formSchema}
              value={interactionStep}
              onChange={this.handleFormChange}
            >
              {parentInteractionId && (
                <Form.Field
                  {...dataTest("answerOption")}
                  name="answerOption"
                  label="Answer"
                  fullWidth
                  hintText="Answer to the previous question"
                />
              )}
              {parentInteractionId && (
                <DeleteIcon
                  style={styles.pullRight}
                  onTouchTap={this.createDeleteStepHandler(interactionStep.id)}
                />
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
                type="script"
                fullWidth
                customFields={customFields}
                label="Script"
                multiLine
                hintText="This is what your texters will send to your contacts. E.g. Hi, {firstName}. It's {texterFirstName} here."
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
          {isAbleToAddResponse && (
            <RaisedButton
              {...dataTest("addResponse")}
              label="+ Add a response"
              onTouchTap={this.createAddStepHandler(interactionStep.id)}
              style={{ marginBottom: "10px" }}
            />
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

    return (
      <div>
        <CampaignFormSectionHeading
          title="What do you want to discuss?"
          subtitle="You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity."
        />
        {this.renderInteractionStep(tree)}
        <RaisedButton
          {...dataTest("interactionSubmit")}
          primary
          label={this.props.saveLabel}
          onTouchTap={this.onSave.bind(this)}
        />
      </div>
    );
  }
}

CampaignInteractionStepsForm.propTypes = {
  formValues: type.object.isRequired,
  customFields: type.array.isRequired,
  availableActions: type.array.isRequired,
  ensureComplete: type.bool.isRequired,
  saveLabel: type.string.isRequired,
  onChange: type.func.isRequired,
  onSubmit: type.func.isRequired
};

export default CampaignInteractionStepsForm;
