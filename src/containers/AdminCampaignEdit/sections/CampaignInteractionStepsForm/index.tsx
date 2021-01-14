import { ApolloQueryResult } from "apollo-client/core/types";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { Dialog } from "material-ui";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import React from "react";
import { compose } from "recompose";

import { Campaign } from "../../../../api/campaign";
import {
  InteractionStep,
  InteractionStepWithChildren
} from "../../../../api/interaction-step";
import { Action } from "../../../../api/types";
import { dataTest } from "../../../../lib/attributes";
import { DateTime } from "../../../../lib/datetime";
import { makeTree } from "../../../../lib/interaction-step-helpers";
import { MutationMap, QueryMap } from "../../../../network/types";
import { loadData } from "../../../hoc/with-operations";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../../components/SectionWrapper";
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

interface Values {
  interactionSteps: InteractionStepWithChildren;
}

interface HocProps {
  mutations: {
    editCampaign(payload: Values): ApolloQueryResult<any>;
  };
  data: {
    campaign: Pick<
      Campaign,
      "id" | "isStarted" | "interactionSteps" | "customFields"
    >;
  };
  availableActions: {
    availableActions: Action[];
  };
}

interface InnerProps extends FullComponentProps, HocProps {}

interface State {
  hasBlockCopied: boolean;
  confirmingRootPaste: boolean;
  interactionSteps: InteractionStep[];
  isWorking: boolean;
}

class CampaignInteractionStepsForm extends React.Component<InnerProps, State> {
  state: State = {
    isWorking: false,
    hasBlockCopied: false,
    confirmingRootPaste: false,
    interactionSteps: [
      {
        id: "newId",
        parentInteractionId: null,
        questionText: "",
        answerOption: "",
        scriptOptions: [""],
        answerActions: "",
        isDeleted: false,
        createdAt: DateTime.local().toJSDate()
      }
    ]
  };

  componentDidMount() {
    this.updateClipboardHasBlock();

    const { interactionSteps } = this.props.data.campaign;
    if (interactionSteps.length > 0) {
      this.setState({ interactionSteps: cloneDeep(interactionSteps) });
    }
  }

  pendingInteractionSteps = (options: { filterEmpty: boolean }) => {
    const oldTree: InteractionStepWithChildren = makeTree(
      this.props.data.campaign.interactionSteps
    );

    const emptyScriptSteps = this.state.interactionSteps.filter((step) => {
      const hasNoOptions = step.scriptOptions.length === 0;
      const hasEmptyScripts =
        step.scriptOptions.filter((version) => version.trim() === "").length >
        0;
      return !step.isDeleted && (hasNoOptions || hasEmptyScripts);
    });

    const hasEmptyScripts = emptyScriptSteps.length > 0;

    // Strip all empty script versions. "Save" should be disabled in this case, but just in case...
    const interactionSteps = !options.filterEmpty
      ? this.state.interactionSteps
      : this.state.interactionSteps.map((step) => {
          const scriptOptions = step.scriptOptions.filter(
            (scriptOption) => scriptOption.trim() !== ""
          );
          return { ...step, scriptOptions };
        });
    const newTree: InteractionStepWithChildren = makeTree(interactionSteps);

    const didChange = !isEqual(oldTree, newTree);

    return { interactionSteps: newTree, didChange, hasEmptyScripts };
  };

  handleSave = async () => {
    const { interactionSteps, didChange } = this.pendingInteractionSteps({
      filterEmpty: true
    });

    if (!didChange) return;

    this.setState({ isWorking: true });
    try {
      const response = await this.props.mutations.editCampaign({
        interactionSteps
      });
      if (response.errors) throw response.errors;
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  createAddStepHandler = (parentInteractionId: string) => () => {
    const randId = this.generateId();

    const newStep: InteractionStep = {
      id: randId,
      parentInteractionId,
      questionText: "",
      scriptOptions: [""],
      answerOption: "",
      answerActions: "",
      isDeleted: false,
      createdAt: DateTime.local().toJSDate()
    };

    this.setState({
      interactionSteps: [...this.state.interactionSteps, newStep]
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

  handleFormChange = (changedStep: InteractionStepWithChildren) => {
    const updatedEvent = { ...changedStep, interactionSteps: undefined };
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

  render() {
    const { isWorking } = this.state;

    const {
      isNew,
      saveLabel,
      data: {
        campaign: { customFields }
      },
      availableActions: { availableActions }
    } = this.props;

    const {
      interactionSteps,
      didChange: hasPendingChanges,
      hasEmptyScripts
    } = this.pendingInteractionSteps({ filterEmpty: false });
    const isSaveDisabled =
      isWorking || hasEmptyScripts || (!isNew && !hasPendingChanges);
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

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
          interactionStep={interactionSteps}
          customFields={customFields}
          availableActions={availableActions}
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
          label={finalSaveLabel}
          disabled={isSaveDisabled}
          onClick={this.handleSave}
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

const queries: QueryMap<FullComponentProps> = {
  data: {
    query: gql`
      query getCampaignInteractions($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          isStarted
          interactionSteps {
            id
            questionText
            scriptOptions
            answerOption
            answerActions
            parentInteractionId
            isDeleted
          }
          customFields
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  availableActions: {
    query: gql`
      query getOrganizationAvailableActions($organizationId: String!) {
        availableActions(organizationId: $organizationId) {
          name
          display_name
          instructions
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations: MutationMap<FullComponentProps> = {
  editCampaign: (ownProps) => (payload: Values) => ({
    mutation: gql`
      mutation editCampaignInteractions(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          interactionSteps {
            id
            questionText
            scriptOptions
            answerOption
            answerActions
            parentInteractionId
            isDeleted
          }
          isStarted
          customFields
          readiness {
            id
            interactions
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    }
  })
};

export default compose<InnerProps, RequiredComponentProps>(
  asSection({
    title: "Interactions",
    readinessName: "interactions",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: true
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignInteractionStepsForm);
