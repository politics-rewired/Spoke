import { green, orange } from "@material-ui/core/colors";
import DeleteIcon from "@material-ui/icons/Delete";
import PollIcon from "@material-ui/icons/Poll";
import IconButton from "material-ui/IconButton";
import { ListItem } from "material-ui/List";
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
      leftIcon={
        <PollIcon style={{ color: isActive ? green[200] : orange[200] }} />
      }
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};

export default ResponseOptionMapping;
