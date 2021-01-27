import { ApolloQueryResult } from "apollo-client/core/types";
import gql from "graphql-tag";
import produce from "immer";
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
import {
  AddInteractionStepPayload,
  EditInteractionStepFragment,
  generateId,
  GET_CAMPAIGN_INTERACTIONS,
  UpdateInteractionStepPayload
} from "./resolvers";

interface Values {
  interactionSteps: InteractionStepWithChildren;
}

interface InteractionStepWithLocalState extends InteractionStep {
  isModified: boolean;
}

interface HocProps {
  mutations: {
    editCampaign(payload: Values): ApolloQueryResult<any>;
    stageDeleteInteractionStep(iStepId: string): Promise<void>;
    stageClearInteractionSteps(): Promise<void>;
    stageAddInteractionStep(payload: AddInteractionStepPayload): Promise<void>;
    stageUpdateInteractionStep(
      iStepId: string,
      payload: UpdateInteractionStepPayload
    ): Promise<void>;
  };
  data: {
    campaign: Pick<Campaign, "id" | "isStarted" | "customFields"> & {
      interactionSteps: InteractionStepWithLocalState[];
    };
  };
  availableActions: {
    availableActions: Action[];
  };
}

interface InnerProps extends FullComponentProps, HocProps {}

interface State {
  hasBlockCopied: boolean;
  confirmingRootPaste: boolean;
  isWorking: boolean;
}

class CampaignInteractionStepsForm extends React.Component<InnerProps, State> {
  state: State = {
    isWorking: false,
    hasBlockCopied: false,
    confirmingRootPaste: false
  };

  componentDidMount() {
    this.updateClipboardHasBlock();
  }

  pendingInteractionSteps = (options: {
    filterEmpty: boolean;
    filterDeleted: boolean;
    stripLocals: boolean;
  }) => {
    const hasEmptyScript = (step: InteractionStep) => {
      const hasNoOptions = step.scriptOptions.length === 0;
      const hasEmptyScriptOption =
        step.scriptOptions.find((version) => version.trim() === "") !==
        undefined;
      return hasNoOptions || hasEmptyScriptOption;
    };

    const {
      campaign: { interactionSteps = [] } = {
        campaign: { interactionSteps: [] }
      }
    } = this.props.data;
    const liveInteractionSteps = interactionSteps
      .filter(
        (step) =>
          (!options.filterDeleted || !step.isDeleted) &&
          (!options.filterEmpty || !hasEmptyScript(step))
      )
      .map((step) => {
        if (options.stripLocals) {
          const { isModified: _, ...stripped } = step;
          return stripped;
        }
        return step;
      });

    const didChange =
      interactionSteps.find(
        (step) => step.isDeleted || step.isModified || step.id.includes("new")
      ) !== undefined;

    const hasEmptyScripts =
      liveInteractionSteps.find(hasEmptyScript) !== undefined;

    return {
      interactionSteps: liveInteractionSteps,
      didChange,
      hasEmptyScripts
    };
  };

  handleSave = async () => {
    const { didChange } = this.pendingInteractionSteps({
      filterEmpty: true,
      filterDeleted: false,
      stripLocals: true
    });

    const interactionSteps = makeTree(
      this.props.data.campaign.interactionSteps.map(
        ({ isModified: _, ...step }) => step
      )
    );

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
    this.props.mutations.stageAddInteractionStep({ parentInteractionId });
  };

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
        idMap[interactionStep.id] = generateId();
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

      if (parentInteractionId === null) {
        this.props.mutations.stageClearInteractionSteps();
      }

      mappedBlocks.forEach((newStep) =>
        this.props.mutations.stageAddInteractionStep(newStep)
      );
    });
  };

  createDeleteStepHandler = (id: string) => () =>
    this.props.mutations.stageDeleteInteractionStep(id);

  handleFormChange = (changedStep: InteractionStepWithChildren) => {
    const { answerOption, questionText, scriptOptions } = changedStep;
    this.props.mutations.stageUpdateInteractionStep(changedStep.id, {
      answerOption,
      questionText,
      scriptOptions
    });
  };

  copyBlock = (interactionStep: InteractionStepWithChildren) => {
    const interactionStepsInBlock = new Set([interactionStep.id]);
    const {
      parentInteractionId: _id,
      interactionSteps: _interactionSteps,
      ...orphanedInteractionStep
    } = interactionStep;
    const block = [orphanedInteractionStep];

    let interactionStepsAdded = 1;

    const { interactionSteps } = this.pendingInteractionSteps({
      filterEmpty: false,
      filterDeleted: true,
      stripLocals: true
    });

    while (interactionStepsAdded !== 0) {
      interactionStepsAdded = 0;

      for (const is of interactionSteps) {
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
      data: { campaign: { customFields } = { customFields: [] } },
      availableActions: { availableActions }
    } = this.props;

    const {
      interactionSteps,
      didChange: hasPendingChanges,
      hasEmptyScripts
    } = this.pendingInteractionSteps({
      filterEmpty: false,
      filterDeleted: true,
      stripLocals: true
    });
    const isSaveDisabled =
      isWorking || hasEmptyScripts || (!isNew && !hasPendingChanges);
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    const tree = makeTree(interactionSteps);
    const finalFree: InteractionStepWithChildren = isEqual(tree, {
      interactionSteps: []
    })
      ? {
          id: "newId",
          parentInteractionId: null,
          questionText: "",
          answerOption: "",
          scriptOptions: [""],
          answerActions: "",
          interactionSteps: [],
          isDeleted: false,
          createdAt: DateTime.local().toISO()
        }
      : tree;

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
          interactionStep={finalFree}
          customFields={customFields}
          availableActions={availableActions}
          hasBlockCopied={this.state.hasBlockCopied}
          disabled={isWorking}
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
    query: GET_CAMPAIGN_INTERACTIONS,
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
            ...EditInteractionStep
          }
          isStarted
          customFields
          readiness {
            id
            interactions
          }
        }
      }
      ${EditInteractionStepFragment}
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    },
    update: (store, { data: { editCampaign } }) => {
      const variables = { campaignId: ownProps.campaignId };
      const old = store.readQuery({
        query: GET_CAMPAIGN_INTERACTIONS,
        variables
      });
      const data = produce(old, (draft: any) => {
        draft.campaign.interactionSteps = editCampaign.interactionSteps;
      });
      store.writeQuery({ query: GET_CAMPAIGN_INTERACTIONS, variables, data });
    }
  }),
  stageDeleteInteractionStep: (_ownProps) => (iStepId: string) => ({
    mutation: gql`
      mutation StageDeleteInteractionStep($iStepId: String!) {
        stageDeleteInteractionStep(iStepId: $iStepId) @client
      }
    `,
    variables: { iStepId }
  }),
  stageClearInteractionSteps: ({ campaignId }) => () => ({
    mutation: gql`
      mutation StageClearInteractionSteps($campaignId: String!) {
        stageClearInteractionSteps(campaignId: $campaignId) @client
      }
    `,
    variables: { campaignId }
  }),
  stageAddInteractionStep: ({ campaignId }) => (
    payload: AddInteractionStepPayload
  ) => ({
    mutation: gql`
      mutation StageAddInteractionStep(
        $campaignId: String!
        $id: String
        $parentInteractionId: String
        $questionText: String
        $scriptOptions: [String]
        $answerOption: String
      ) {
        stageAddInteractionStep(
          campaignId: $campaignId
          id: $id
          parentInteractionId: $parentInteractionId
          questionText: $questionText
          scriptOptions: $scriptOptions
          answerOption: $answerOption
        ) @client
      }
    `,
    variables: { campaignId, ...payload }
  }),
  stageUpdateInteractionStep: (_ownProps) => (
    iStepId: string,
    payload: UpdateInteractionStepPayload
  ) => ({
    mutation: gql`
      mutation StageUpdateInteractionStep(
        $iStepId: String!
        $questionText: String
        $scriptOptions: [String]
        $answerOption: String
      ) {
        stageUpdateInteractionStep(
          iStepId: $iStepId
          questionText: $questionText
          scriptOptions: $scriptOptions
          answerOption: $answerOption
        ) @client
      }
    `,
    variables: { iStepId, ...payload }
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
