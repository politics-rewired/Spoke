import { ApolloQueryResult } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import gql from "graphql-tag";
import FlatButton from "material-ui/FlatButton";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import React, { useEffect, useState } from "react";

import { Campaign } from "../../../api/campaign";
import { CampaignContact } from "../../../api/campaign-contact";
import { InteractionStep } from "../../../api/interaction-step";
import {
  formatErrorMessage,
  PrettyErrors,
  withOperations
} from "../../../containers/hoc/with-operations";
import { MutationMap, QueryMap } from "../../../network/types";
import LoadingIndicator from "../../LoadingIndicator";

type QuestionResponseMap = Record<string, string>;

interface UpdateQuestionResponsePayload {
  campaignContactId: string;
  interactionStepId: string;
  value: string | null;
}

interface Mutations {
  updateQuestionResponses: (
    questionResponses: UpdateQuestionResponsePayload[],
    campaignContactId: string
  ) => Promise<ApolloQueryResult<{ id: string }>>;
  deleteQuestionResponses: (
    interactionStepIds: string[],
    campaignContactId: string
  ) => Promise<ApolloQueryResult<{ id: string }>>;
}

export interface ManageSurveyResponsesProps {
  campaign: Pick<Campaign, "interactionSteps">;
  contact: CampaignContact;
  mutations: Mutations;
}

export const ManageSurveyResponses: React.FC<ManageSurveyResponsesProps> = (
  props
) => {
  const [isMakingRequest, setIsMakingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [questionResponses, setQuestionResponses] = useState<
    QuestionResponseMap
  >({});

  useEffect(() => {
    const { interactionSteps } = props.campaign;
    const newQuestionResponses = interactionSteps.reduce<QuestionResponseMap>(
      (collector, iStep) => {
        return iStep.questionResponse
          ? { ...collector, [iStep.id]: iStep.questionResponse.value }
          : collector;
      },
      {}
    );
    setQuestionResponses(newQuestionResponses);
  }, [props.campaign.interactionSteps]);

  const getResponsesFrom = (startingStepId: string) => {
    const { interactionSteps } = props.campaign;

    const iSteps: (InteractionStep & { children: InteractionStep[] })[] = [];
    let currentStep: InteractionStep | null =
      interactionSteps.find(
        (iStep) => iStep.questionText && iStep.id === startingStepId
      ) ?? null;
    while (currentStep) {
      const currentStepId = currentStep.id;
      const children = interactionSteps.filter(
        (iStep) => iStep.parentInteractionId === currentStepId
      );
      iSteps.push({ ...currentStep, children });
      const value = questionResponses[currentStep.id];
      currentStep = value
        ? // Only show actionable questions
          children.find(
            (iStep) => iStep.questionText && iStep.answerOption === value
          ) ?? null
        : null;
    }
    return iSteps;
  };

  const createHandler = (iStepId: string) => {
    const {
      updateQuestionResponses,
      deleteQuestionResponses
    } = props.mutations;
    return async (
      _event: React.SyntheticEvent<unknown>,
      index: number,
      value: string | null
    ) => {
      setIsMakingRequest(true);
      const { contact } = props;
      const affectedSteps = getResponsesFrom(iStepId);

      try {
        // Delete response for this and all children (unless this is a single question change)
        if (affectedSteps.length > 1 || !value) {
          const affectedIStepIds = affectedSteps.map((iStep) => iStep.id);
          const response = await deleteQuestionResponses(
            affectedIStepIds,
            contact.id
          );
          if (response.errors) throw response.errors;
          setQuestionResponses(
            Object.fromEntries(
              Object.entries(questionResponses).filter(
                ([stepId]) => !affectedIStepIds.includes(stepId)
              )
            )
          );
        }

        if (value) {
          const input = {
            campaignContactId: contact.id,
            interactionStepId: iStepId,
            value
          };
          const response = await updateQuestionResponses([input], contact.id);
          if (response.errors) throw response.errors;
          setQuestionResponses({ ...questionResponses, [iStepId]: value });
        }
      } catch (error) {
        setRequestError(formatErrorMessage(error.message));
      } finally {
        setIsMakingRequest(false);
        setQuestionResponses(questionResponses);
      }
    };
  };

  const handleCloseError = () => {
    setRequestError("");
  };

  const { interactionSteps } = props.campaign;

  const startingStep = interactionSteps.find(
    (iStep) => iStep.parentInteractionId === null
  );

  // There may not be an interaction step, or it may not define a question
  const renderSteps = startingStep ? getResponsesFrom(startingStep.id) : [];

  if (renderSteps.length === 0) {
    return <p>No answerable questions for this campaign.</p>;
  }

  const errorActions = [
    <FlatButton key="ok" label="OK" primary onClick={handleCloseError} />
  ];

  return (
    <div style={{ maxHeight: "400px", overflowY: "scroll" }}>
      {renderSteps.map((iStep) => {
        const responseValue = questionResponses[iStep.id];
        return (
          <SelectField
            key={iStep.id}
            floatingLabelText={iStep.questionText}
            value={responseValue}
            disabled={isMakingRequest}
            onChange={createHandler(iStep.id)}
            style={{ width: "100%" }}
          >
            <MenuItem value={null} primaryText="" />
            {iStep.children.map((option) => (
              <MenuItem
                key={option.answerOption}
                value={option.answerOption}
                primaryText={option.answerOption}
              />
            ))}
          </SelectField>
        );
      })}
      <Dialog open={!!requestError} onClose={handleCloseError}>
        <DialogTitle>Error Updating Question Response</DialogTitle>
        <DialogContent>
          <DialogContentText>{requestError}</DialogContentText>
        </DialogContent>
        <DialogActions>{errorActions}</DialogActions>
      </Dialog>
    </div>
  );
};

export interface WrapperProps {
  campaign: Campaign;
  contact: CampaignContact;
  mutations: Mutations;
  surveyQuestions: {
    campaign: Pick<Campaign, "id" | "interactionSteps">;
  } & ApolloQueryResult<unknown>;
}

const ManageSurveyResponsesWrapper: React.FC<WrapperProps> = (props) => {
  const { surveyQuestions, mutations, contact } = props;
  return (
    <div>
      <h4>Survey Responses</h4>
      {surveyQuestions.loading && <LoadingIndicator />}
      {surveyQuestions.errors && (
        <PrettyErrors errors={surveyQuestions.errors} />
      )}
      {surveyQuestions.campaign && (
        <ManageSurveyResponses
          campaign={surveyQuestions.campaign}
          contact={contact}
          mutations={mutations}
        />
      )}
    </div>
  );
};

const queries: QueryMap<WrapperProps> = {
  surveyQuestions: {
    query: gql`
      query getSurveyQuestions($campaignId: String!, $contactId: String!) {
        campaign(id: $campaignId) {
          id
          interactionSteps {
            id
            questionText
            answerOption
            parentInteractionId
            isDeleted
            answerActions

            questionResponse(campaignContactId: $contactId) {
              id
              value
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaign.id,
        contactId: ownProps.contact.id
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations: MutationMap<WrapperProps> = {
  updateQuestionResponses: () => (
    questionResponses: UpdateQuestionResponsePayload[],
    campaignContactId: string
  ) => ({
    mutation: gql`
      mutation updateQuestionResponses(
        $questionResponses: [QuestionResponseInput]
        $campaignContactId: String!
      ) {
        updateQuestionResponses(
          questionResponses: $questionResponses
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      questionResponses,
      campaignContactId
    }
  }),
  deleteQuestionResponses: () => (
    interactionStepIds: string[],
    campaignContactId: string
  ) => ({
    mutation: gql`
      mutation deleteQuestionResponses(
        $interactionStepIds: [String]
        $campaignContactId: String!
      ) {
        deleteQuestionResponses(
          interactionStepIds: $interactionStepIds
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      interactionStepIds,
      campaignContactId
    }
  })
};

export default withOperations({
  queries,
  mutations
})(ManageSurveyResponsesWrapper);
