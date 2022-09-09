import { useTheme } from "@material-ui/core";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import DeleteIcon from "@material-ui/icons/Delete";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import HelpIconOutline from "@material-ui/icons/HelpOutline";
import type { CampaignVariable } from "@spoke/spoke-codegen";
import isNil from "lodash/isNil";
import React, { useCallback, useState } from "react";
import * as yup from "yup";

import type {
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
  campaignVariables: CampaignVariable[];
  integrationSourced: boolean;
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
  const [expanded, setExpanded] = useState(true);
  const stableMuiTheme = useTheme();

  const {
    interactionStep,
    customFields,
    campaignVariables,
    integrationSourced,
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
  const childStepsLength = childSteps?.length;

  const clipboardEnabled = supportsClipboard();

  const handleToggleExpanded = useCallback(() => setExpanded(!expanded), [
    expanded,
    setExpanded
  ]);

  const handleAddResponse = useCallback(() => {
    setExpanded(true);
    addStepFactory(stepId)();
  }, [setExpanded, addStepFactory, stepId]);

  const handlePasteBlock = useCallback(() => {
    setExpanded(true);
    pasteBlockFactory(stepId)();
  }, [setExpanded, pasteBlockFactory, stepId]);

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
          titleTypographyProps={{ variant: "body1" }}
          subheaderTypographyProps={{ variant: "body2" }}
          title={title}
          subheader={
            parentInteractionId
              ? ""
              : "Enter a script for your texter along with the question you want the texter be able to answer on behalf of the contact."
          }
          action={
            childStepsLength > 0 && (
              <Badge
                badgeContent={childStepsLength}
                color="primary"
                overlap="circular"
                invisible={expanded}
              >
                <IconButton onClick={handleToggleExpanded}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Badge>
            )
          }
        />
        <CardActions>
          <Button
            variant="contained"
            disabled={disabled || !clipboardEnabled}
            onClick={() => onCopyBlock(interactionStep)}
          >
            Copy Block
          </Button>
          {hasBlockCopied && isRootStep && (
            <Button
              variant="contained"
              disabled={disabled || !clipboardEnabled}
              onClick={onRequestRootPaste}
            >
              + Paste Block
            </Button>
          )}
          {!clipboardEnabled && (
            <span>Your browser does not support clipboard actions</span>
          )}
        </CardActions>
        <CardContent>
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
                <Tooltip title="An action is something that is triggered by this answer being chosen, often in an outside system">
                  <IconButton disabled={disabled}>
                    <HelpIconOutline />
                  </IconButton>
                </Tooltip>
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
              campaignVariables={campaignVariables}
              integrationSourced={integrationSourced}
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
        </CardContent>
      </Card>
      <div style={styles.answerContainer}>
        {isAbleToAddResponse && (
          <Button
            key="add"
            variant="contained"
            {...dataTest("addResponse")}
            style={{ marginBottom: "10px" }}
            disabled={disabled}
            onClick={handleAddResponse}
          >
            + Add a response
          </Button>
        )}
        {isAbleToAddResponse && hasBlockCopied && (
          <Button
            key="paste"
            variant="contained"
            disabled={disabled}
            style={{ marginBottom: "10px" }}
            onClick={handlePasteBlock}
          >
            + Paste Block
          </Button>
        )}
        {expanded &&
          (childSteps ?? [])
            .filter((is) => !is.isDeleted)
            .map((childStep) => (
              <InteractionStepCard
                key={childStep.id}
                title={`Question: ${questionText}`}
                interactionStep={childStep}
                customFields={customFields}
                campaignVariables={campaignVariables}
                integrationSourced={integrationSourced}
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
