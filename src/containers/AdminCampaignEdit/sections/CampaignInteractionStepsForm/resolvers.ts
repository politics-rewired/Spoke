import type { Resolver, Resolvers } from "@apollo/client";
import { gql } from "@apollo/client";
import produce from "immer";

import type { InteractionStep } from "../../../../api/interaction-step";
import { DateTime } from "../../../../lib/datetime";
import type { LocalResolverContext } from "../../../../network/types";

export const generateId = () =>
  `new${Math.random()
    .toString(36)
    .replace(/[^a-zA-Z1-9]+/g, "")}`;

export const EditInteractionStepFragment = gql`
  fragment EditInteractionStep on InteractionStep {
    id
    questionText
    scriptOptions
    answerOption
    answerActions
    parentInteractionId
    isDeleted
    isModified @client
  }
`;

export const GET_CAMPAIGN_INTERACTIONS = gql`
  query GetEditCampaignInteractions($campaignId: String!) {
    campaign(id: $campaignId) {
      id
      isStarted
      isApproved
      isTemplate
      interactionSteps {
        ...EditInteractionStep
      }
      customFields
      invalidScriptFields
      campaignVariables {
        edges {
          node {
            id
            name
            value
          }
        }
      }
      externalSystem {
        id
      }
    }
  }
  ${EditInteractionStepFragment}
`;

export interface StageDeleteInteractionStepVars {
  iStepId: string;
}

export const stageDeleteInteractionStep: Resolver = (
  _root,
  variables: StageDeleteInteractionStepVars,
  { client, getCacheKey }: LocalResolverContext
) => {
  const id = getCacheKey({
    __typename: "InteractionStep",
    id: variables.iStepId
  });
  const fragment = gql`
    fragment pendingDeleteInteractionStep on InteractionStep {
      isDeleted
    }
  `;

  const iStep = client.readFragment({ fragment, id });
  const data = { ...iStep, isDeleted: true };
  client.writeFragment({ id, fragment, data });
  return null;
};

export const stageClearInteractionSteps: Resolver = (
  _root,
  { campaignId }: { campaignId: string },
  { client }: LocalResolverContext
) => {
  const variables = { campaignId };
  const cachedResult = client.readQuery({
    query: GET_CAMPAIGN_INTERACTIONS,
    variables
  });
  const data = produce(cachedResult, (draft: any) => {
    draft.campaign.interactionSteps = [];
  });
  client.writeQuery({
    query: GET_CAMPAIGN_INTERACTIONS,
    variables,
    data
  });
  return null;
};

export type AddInteractionStepPayload = Partial<
  Pick<
    InteractionStep,
    | "id"
    | "parentInteractionId"
    | "answerOption"
    | "answerActions"
    | "questionText"
    | "scriptOptions"
  >
>;

export interface StageAddInteractionStepVars extends AddInteractionStepPayload {
  campaignId: string;
}

export const stageAddInteractionStep: Resolver = (
  _root,
  { campaignId, ...payload }: StageAddInteractionStepVars,
  { client }: LocalResolverContext
) => {
  const variables = { campaignId };
  const cachedResult = client.readQuery({
    query: GET_CAMPAIGN_INTERACTIONS,
    variables
  });
  const data = produce(cachedResult, (draft: any) => {
    draft.campaign.interactionSteps.push({
      __typename: "InteractionStep",
      id: payload.id ?? generateId(),
      parentInteractionId: payload.parentInteractionId ?? null,
      questionText: payload.questionText ?? "",
      scriptOptions: payload.scriptOptions ?? [""],
      answerOption: payload.answerOption ?? "",
      answerActions: payload.answerActions ?? "",
      isDeleted: false,
      isModified: true,
      createdAt: DateTime.local().toISO()
    });
  });
  client.writeQuery({
    query: GET_CAMPAIGN_INTERACTIONS,
    variables,
    data
  });
  return null;
};

export type UpdateInteractionStepPayload = Partial<
  Pick<InteractionStep, "answerOption" | "questionText" | "scriptOptions">
>;

export interface StageUpdateInteractionStepVars
  extends UpdateInteractionStepPayload {
  iStepId: string;
}

const EditableIStepFragment = gql`
  fragment EditableIStep on InteractionStep {
    questionText
    scriptOptions
    answerOption
    isModified @client
  }
`;

export const stageUpdateInteractionStep: Resolver = (
  _root,
  { iStepId, ...payload }: StageUpdateInteractionStepVars,
  { client, getCacheKey }: LocalResolverContext
) => {
  const id = getCacheKey({ __typename: "InteractionStep", id: iStepId });
  const iStep = client.readFragment({ fragment: EditableIStepFragment, id });
  const data = { ...iStep, ...payload, isModified: true };
  client.writeFragment({ id, fragment: EditableIStepFragment, data });
  return null;
};

const ModifiedStepFragment = gql`
  fragment ModifiableStep on InteractionStep {
    id
    isModified
  }
`;

export const isModified: Resolver = (
  { id: iStepId },
  _variables,
  { client, getCacheKey }: LocalResolverContext
) => {
  const id = getCacheKey({ __typename: "InteractionStep", id: iStepId });
  const iStep = client.readFragment<{ isModified: boolean }>({
    fragment: ModifiedStepFragment,
    id
  });
  return iStep?.isModified ?? false;
};

const resolvers: Resolvers = {
  Mutation: {
    stageDeleteInteractionStep,
    stageClearInteractionSteps,
    stageAddInteractionStep,
    stageUpdateInteractionStep
  },
  InteractionStep: {
    isModified
  }
};

export default resolvers;
