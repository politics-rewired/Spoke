import React from "react";

import { ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import PollIcon from "material-ui/svg-icons/social/poll";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { ExternalSurveyQuestionResponseOption } from "../../../api/external-survey-question-response-option";
import { RelayPaginatedResponse } from "../../../api/pagination";
import { ExternalSurveyQuestion } from "../../../api/external-survey-question";

interface Props {
  responseOption: ExternalSurveyQuestionResponseOption;
  surveyQuestions: RelayPaginatedResponse<ExternalSurveyQuestion>;
}

export const ResponseOptionMapping: React.SFC<Props> = props => {
  const question = props.surveyQuestions.edges.find(
    ({ node }) =>
      node.externalId === props.responseOption.externalSurveyQuestionId
  );
  return (
    <ListItem
      primaryText={props.responseOption.name}
      secondaryText={question && question.node.scriptQuestion}
      leftIcon={<PollIcon />}
      rightIconButton={
        <IconButton>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};
