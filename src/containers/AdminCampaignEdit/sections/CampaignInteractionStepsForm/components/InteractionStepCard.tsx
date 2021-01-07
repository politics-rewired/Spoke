import isNil from "lodash/isNil";
import { Card, CardActions, CardHeader, CardText } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import {
  InteractionStep,
  InteractionStepWithChildren
} from "../../../../../api/interaction-step";
import GSForm from "../../../../../components/forms/GSForm";
import { dataTest } from "../../../../../lib/attributes";
import theme from "../../../../../styles/theme";

const styles: Record<string, React.CSSProperties> = {
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

type BlockHandlerFactory = (stepId: string) => () => Promise<void> | void;

interface Props {
  interactionStep: InteractionStepWithChildren;
  customFields: string[];
  availableActions: any[];
  hasBlockCopied: boolean;
  title?: string;
  onFormChange(e: any): void;
  onCopyBlock(interactionStep: InteractionStep): void;
  onRequestRootPaste(): void;
  deleteStepFactory: BlockHandlerFactory;
  addStepFactory: BlockHandlerFactory;
  pasteBlockFactory: BlockHandlerFactory;
}

export const InteractionStepCard: React.SFC<Props> = (props) => {
  const {
    interactionStep,
    customFields,
    availableActions,
    hasBlockCopied,
    title = "Start",
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

  const stepHasScript = scriptOptions.length > 0;
  const stepHasQuestion = questionText;
  const stepCanHaveChildren = !parentInteractionId || answerOption;
  const isAbleToAddResponse =
    stepHasQuestion && stepHasScript && stepCanHaveChildren;

  return (
    <div key={stepId}>
      <Card key={stepId} style={styles.interactionStep}>
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
          <RaisedButton onClick={() => onCopyBlock(interactionStep)}>
            Copy Block
          </RaisedButton>
          {hasBlockCopied && (
            <RaisedButton label="+ Paste Block" onClick={onRequestRootPaste} />
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
                <Form.Field
                  {...dataTest("answerOption")}
                  name="answerOption"
                  label="Answer"
                  fullWidth
                  hintText="Answer to the previous question"
                />
                <IconButton onClick={deleteStepFactory(stepId)}>
                  <DeleteIcon />
                </IconButton>
              </div>
            )}
            {displayActions && (
              <div key={`answeractions-${stepId}`}>
                <Form.Field
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
                />
                <IconButton tooltip="An action is something that is triggered by this answer being chosen, often in an outside system">
                  <HelpIconOutline />
                </IconButton>
                <div>
                  {answerActions &&
                    availableActions.filter((a) => a.name === answerActions)[0]
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
        {isAbleToAddResponse && (
          <RaisedButton
            key="add"
            {...dataTest("addResponse")}
            label="+ Add a response"
            onClick={addStepFactory(stepId)}
            style={{ marginBottom: "10px" }}
          />
        )}
        {isAbleToAddResponse && hasBlockCopied && (
          <RaisedButton
            key="paste"
            label="+ Paste Block"
            onClick={pasteBlockFactory(stepId)}
            style={{ marginBottom: "10px" }}
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
