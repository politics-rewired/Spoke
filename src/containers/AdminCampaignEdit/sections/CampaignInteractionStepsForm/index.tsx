import isEqual from "lodash/isEqual";
import { Dialog } from "material-ui";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import React from "react";

import {
  InteractionStep,
  InteractionStepWithChildren
} from "../../../../api/interaction-step";
import { dataTest } from "../../../../lib/attributes";
import { makeTree } from "../../../../lib/interaction-step-helpers";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import InteractionStepCard from "./components/InteractionStepCard";

/**
 * Returns `interactionSteps` with `stepId` and all its children marked as `isDeleted`.
 * @param {string} stepId The ID of the interaction step to mark as deleted.
 * @param {string[]} interactionSteps The list of interaction steps to work on.
 */
const markDeleted = (stepId: string, interactionSteps: InteractionStep[]) => {
  interactionSteps = interactionSteps.map((step) => {
    const updates = step.id === stepId ? { isDeleted: true } : {};
    return { ...step, ...updates };
  });

  const childSteps = interactionSteps.filter(
    (step) => step.parentInteractionId === stepId
  );
  for (const childStep of childSteps) {
    interactionSteps = markDeleted(childStep.id, interactionSteps);
  }

  return interactionSteps;
};

interface Props {
  formValues: any;
  customFields: string[];
  availableActions: any[];
  ensureComplete: boolean;
  saveLabel: string;
  onChange(options: {
    interactionSteps: InteractionStepWithChildren;
  }): Promise<void> | void;
  onSubmit(): Promise<void> | void;
}

interface State {
  hasBlockCopied: boolean;
  confirmingRootPaste: boolean;
  interactionSteps: InteractionStep[];
}

class CampaignInteractionStepsForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { interactionSteps } = props.formValues;
    this.state = {
      hasBlockCopied: false,
      confirmingRootPaste: false,
      interactionSteps: interactionSteps[0]
        ? interactionSteps
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
  }

  componentDidMount() {
    this.updateClipboardHasBlock();
  }

  onSave = async () => {
    // Strip all empty script versions. "Save" should be disabled in this case, but just in case...
    const interactionSteps = this.state.interactionSteps.map((step) => {
      const scriptOptions = step.scriptOptions.filter(
        (scriptOption) => scriptOption.trim() !== ""
      );
      return Object.assign(step, { scriptOptions });
    });

    const interactionStepTree: InteractionStepWithChildren = makeTree(
      interactionSteps
    );
    await this.props.onChange({ interactionSteps: interactionStepTree });
    this.props.onSubmit();
  };

  createAddStepHandler = (parentInteractionId: string) => () => {
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

  onRequestRootPaste = () => {
    this.setState({ confirmingRootPaste: true });
  };

  confirmRootPaste = () => {
    this.setState({ confirmingRootPaste: false });
    this.createPasteBlockHandler(null)();
  };

  createPasteBlockHandler = (parentInteractionId: string | null) => () => {
    navigator.clipboard.readText().then((text) => {
      const idMap: Record<string, string> = {};

      const newBlocks: InteractionStep[] = JSON.parse(text);

      newBlocks.forEach((interactionStep) => {
        idMap[interactionStep.id] = this.generateId();
      });

      const mappedBlocks: InteractionStep[] = newBlocks.map(
        (interactionStep) => {
          // Prepend new to force it to create a new one, even if it was already new
          return {
            ...interactionStep,
            id: idMap[interactionStep.id],
            parentInteractionId: interactionStep.parentInteractionId
              ? idMap[interactionStep.parentInteractionId]
              : parentInteractionId
          };
        }
      );

      this.setState({
        interactionSteps:
          parentInteractionId === null
            ? mappedBlocks
            : this.state.interactionSteps.concat(mappedBlocks)
      });
    });
  };

  createDeleteStepHandler = (id: string) => () => {
    const interactionSteps = markDeleted(id, this.state.interactionSteps);
    this.setState({ interactionSteps });
  };

  handleFormChange = (event: any) => {
    const updatedEvent = { ...event, interactionSteps: undefined };
    const interactionSteps = this.state.interactionSteps.map((step) =>
      step.id === updatedEvent.id ? updatedEvent : step
    );
    this.setState({ interactionSteps });
  };

  copyBlock = (interactionStep: InteractionStep) => {
    const interactionStepsInBlock = new Set([interactionStep.id]);
    const {
      parentInteractionId: _id,
      ...orphanedInteractionStep
    } = interactionStep;
    const block = [orphanedInteractionStep];

    let interactionStepsAdded = 1;

    while (interactionStepsAdded !== 0) {
      interactionStepsAdded = 0;

      for (const is of this.state.interactionSteps) {
        if (
          !interactionStepsInBlock.has(is.id) &&
          is.parentInteractionId &&
          interactionStepsInBlock.has(is.parentInteractionId)
        ) {
          block.push(is);
          interactionStepsInBlock.add(is.id);
          interactionStepsAdded += 1;
        }
      }
    }

    navigator.clipboard.writeText(JSON.stringify(block));
    this.updateClipboardHasBlock();
  };

  updateClipboardHasBlock = () => {
    navigator.clipboard.readText().then((text) => {
      try {
        const _newBlock = JSON.parse(text);
        if (!this.state.hasBlockCopied) this.setState({ hasBlockCopied: true });
      } catch (ex) {
        if (this.state.hasBlockCopied) this.setState({ hasBlockCopied: false });
      }
    });
  };

  checkUnsavedChanges = () => {
    const { interactionSteps: pendingSteps } = this.state;
    const { interactionSteps } = this.props.formValues;

    const hasUnsavedChanges = !isEqual(pendingSteps, interactionSteps);

    return hasUnsavedChanges;
  };

  render() {
    const { saveLabel } = this.props;
    const { interactionSteps } = this.state;

    const tree: InteractionStepWithChildren = makeTree(interactionSteps);

    const emptyScriptSteps = interactionSteps.filter((step) => {
      const hasNoOptions = step.scriptOptions.length === 0;
      const hasEmptyScripts =
        step.scriptOptions.filter((version) => version.trim() === "").length >
        0;
      return hasNoOptions || hasEmptyScripts;
    });

    const hasEmptyScripts = emptyScriptSteps.length > 0;
    const hasUnsavedSteps = this.checkUnsavedChanges();

    const shouldDisableSave = !hasUnsavedSteps || hasEmptyScripts;

    return (
      <div
        onFocus={this.updateClipboardHasBlock}
        onClick={this.updateClipboardHasBlock}
      >
        <Dialog
          open={this.state.confirmingRootPaste}
          actions={[
            <FlatButton
              key="cancel"
              label="Cancel"
              primary
              onClick={() => this.setState({ confirmingRootPaste: false })}
            />,
            <FlatButton
              key="paste"
              label="Paste"
              primary
              onClick={this.confirmRootPaste}
            />
          ]}
        >
          Pasting over the initial message will overwrite the whole script and
          you may need to change your sync configuration. Are you sure you want
          to continue?
        </Dialog>
        <CampaignFormSectionHeading
          title="What do you want to discuss?"
          subtitle="You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity."
        />
        <InteractionStepCard
          interactionStep={tree}
          customFields={this.props.customFields}
          availableActions={this.props.availableActions}
          hasBlockCopied={this.state.hasBlockCopied}
          onFormChange={this.handleFormChange}
          onCopyBlock={this.copyBlock}
          onRequestRootPaste={this.onRequestRootPaste}
          deleteStepFactory={this.createDeleteStepHandler}
          addStepFactory={this.createAddStepHandler}
          pasteBlockFactory={this.createPasteBlockHandler}
        />
        <RaisedButton
          {...dataTest("interactionSubmit")}
          primary
          label={saveLabel}
          disabled={shouldDisableSave}
          onClick={this.onSave}
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

export default CampaignInteractionStepsForm;
