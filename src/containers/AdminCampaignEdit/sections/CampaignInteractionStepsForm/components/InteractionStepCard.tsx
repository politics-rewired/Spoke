import { useTheme } from "@material-ui/core";
import isNil from "lodash/isNil";
import { Card, CardActions, CardHeader, CardText } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import React from "react";
import * as yup from "yup";

import {
  InteractionStep,
  InteractionStepWithChildren
} from "../../../../../api/interaction-step";
import { supportsClipboard } from "../../../../../client/lib";
import GSForm from "../../../../../components/forms/GSForm";
import SpokeFormField from "../../../../../components/forms/SpokeFormField";
import { dataTest } from "../../../../../lib/attributes";
import theme from "../../../../../styles/theme";

const styles: Record<string, React.CSSProperties> = {
  cardHeader: {
    backgroundColor: theme.colors.veryLightGray
  },

  interactionStep: {
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

type BlockHandlerFactory = (stepId: string) => () => Promise<void> | void;

interface Props {
  interactionStep: InteractionStepWithChildren;
  customFields: string[];
  availableActions: any[];
  hasBlockCopied: boolean;
  title?: string;
  disabled?: boolean;
  onFormChange(e: any): void;
  onCopyBlock(interactionStep: InteractionStep): void;
  onRequestRootPaste(): void;
  deleteStepFactory: BlockHandlerFactory;
  addStepFactory: BlockHandlerFactory;
  pasteBlockFactory: BlockHandlerFactory;
}

export const InteractionStepCard: React.FC<Props> = (props) => {
  const stableMuiTheme = useTheme();
  const {
    interactionStep,
    customFields,
    availableActions,
    hasBlockCopied,
    title = "Start",
    disabled = false,
    onFormChange,
    onCopyBlock,
    onRequestRootPaste,
    addStepFactory,
    deleteStepFactory,
    pasteBlockFactory
  } = props;

  const {
    id: stepId,
    scriptOptions,
    questionText,
    parentInteractionId,
    answerOption,
    answerActions,
    interactionSteps: childSteps
  } = interactionStep;

  const displayActions =
    !isNil(parentInteractionId) &&
    availableActions &&
    availableActions.length > 0;

  const stepHasScript = scriptOptions && scriptOptions.length > 0;
  const stepHasQuestion = questionText;
  const isRootStep = !parentInteractionId;
  const stepCanHaveChildren = isRootStep || answerOption;
  const isAbleToAddResponse =
    stepHasQuestion && stepHasScript && stepCanHaveChildren;

  const clipboardEnabled = supportsClipboard();

  return (
    <div key={stepId}>
      <Card
        key={stepId}
        style={{
          ...styles.interactionStep,
          borderLeft: `5px solid ${stableMuiTheme.palette.primary.main}`
        }}
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
          <RaisedButton
            label="Copy Block"
            disabled={disabled || !clipboardEnabled}
            onClick={() => onCopyBlock(interactionStep)}
          />
          {hasBlockCopied && isRootStep && (
            <RaisedButton
              label="+ Paste Block"
              disabled={disabled || !clipboardEnabled}
              onClick={onRequestRootPaste}
            />
          )}
          {!clipboardEnabled && (
            <span>Your browser does not support clipboard actions</span>
          )}
        </CardActions>
        <CardText>
          <GSForm
            {...dataTest("childInteraction", !parentInteractionId)}
            schema={interactionStepSchema}
            value={interactionStep}
            onChange={onFormChange}
          >
            {parentInteractionId && (
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <SpokeFormField
                  {...dataTest("answerOption")}
                  name="answerOption"
                  label="Answer"
                  fullWidth
                  hintText="Answer to the previous question"
                  disabled={disabled}
                />
                <IconButton
                  disabled={disabled}
                  onClick={deleteStepFactory(stepId)}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            )}
            {displayActions && (
              <div key={`answeractions-${stepId}`}>
                <SpokeFormField
                  name="answerActions"
                  type="select"
                  default=""
                  choices={[
                    { value: "", label: "Action..." },
                    ...availableActions.map((action) => ({
                      value: action.name,
                      label: action.display_name
                    }))
                  ]}
                  disabled={disabled}
                />
                <IconButton
                  tooltip="An action is something that is triggered by this answer being chosen, often in an outside system"
                  disabled={disabled}
                >
                  <HelpIconOutline />
                </IconButton>
                <div>
                  {answerActions &&
                    availableActions.filter((a) => a.name === answerActions)[0]
                      .instructions}
                </div>
              </div>
            )}
            <SpokeFormField
              {...dataTest("editorInteraction")}
              name="scriptOptions"
              type="scriptoptions"
              label="Script"
              hintText="This is what your texters will send to your contacts. E.g. Hi, {firstName}. It's {texterFirstName} here."
              customFields={customFields}
              fullWidth
              multiLine
              disabled={disabled}
            />
            <SpokeFormField
              {...dataTest("questionText")}
              name="questionText"
              label="Question"
              fullWidth
              hintText="A question for texters to answer. E.g. Can this person attend the event?"
              disabled={disabled}
            />
          </GSForm>
        </CardText>
      </Card>
      <div style={styles.answerContainer}>
        {isAbleToAddResponse && (
          <RaisedButton
            key="add"
            {...dataTest("addResponse")}
            label="+ Add a response"
            style={{ marginBottom: "10px" }}
            disabled={disabled}
            onClick={addStepFactory(stepId)}
          />
        )}
        {isAbleToAddResponse && hasBlockCopied && (
          <RaisedButton
            key="paste"
            label="+ Paste Block"
            disabled={disabled}
            style={{ marginBottom: "10px" }}
            onClick={pasteBlockFactory(stepId)}
          />
        )}
        {childSteps
          .filter((is) => !is.isDeleted)
          .map((childStep) => (
            <InteractionStepCard
              key={childStep.id}
              title={`Question: ${questionText}`}
              interactionStep={childStep}
              customFields={customFields}
              availableActions={availableActions}
              hasBlockCopied={hasBlockCopied}
              disabled={disabled}
              onFormChange={onFormChange}
              onCopyBlock={onCopyBlock}
              onRequestRootPaste={onRequestRootPaste}
              addStepFactory={addStepFactory}
              deleteStepFactory={deleteStepFactory}
              pasteBlockFactory={pasteBlockFactory}
            />
          ))}
      </div>
    </div>
  );
};

export default InteractionStepCard;
