import IconButton from "material-ui/IconButton";
import { ListItem } from "material-ui/List";
import { green200, orange200 } from "material-ui/styles/colors";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import PollIcon from "material-ui/svg-icons/social/poll";
import React from "react";

import { ExternalSurveyQuestion } from "../../../api/external-survey-question";
import { ExternalSurveyQuestionResponseOption } from "../../../api/external-survey-question-response-option";
import { RelayPaginatedResponse } from "../../../api/pagination";
import { ExternalDataCollectionStatus } from "../../../api/types";

interface Props {
  responseOption: ExternalSurveyQuestionResponseOption;
  surveyQuestions: RelayPaginatedResponse<ExternalSurveyQuestion>;
  onClickDelete(): void;
}

export const ResponseOptionMapping: React.SFC<Props> = (props) => {
  const question = props.surveyQuestions.edges.find(
    ({ node }) => node.id === props.responseOption.externalSurveyQuestionId
  );

  const status = question
    ? question.node.status
    : ExternalDataCollectionStatus.ACTIVE;
  const isActive = status === ExternalDataCollectionStatus.ACTIVE;
  const prefix = isActive ? "" : `[${status}] `;
  const primaryText = `${prefix}${props.responseOption.name}`;

  return (
    <ListItem
      primaryText={primaryText}
      secondaryText={question && question.node.scriptQuestion}
      leftIcon={<PollIcon color={isActive ? green200 : orange200} />}
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};
