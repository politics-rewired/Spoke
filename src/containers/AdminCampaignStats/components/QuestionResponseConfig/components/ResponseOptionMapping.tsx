import { green, orange } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import DeleteIcon from "@material-ui/icons/Delete";
import PollIcon from "@material-ui/icons/Poll";
import type {
  ExternalSurveyQuestion,
  ExternalSurveyQuestionResponseOption
} from "@spoke/spoke-codegen";
import React from "react";

import { ExternalDataCollectionStatus } from "../../../../../api/types";
import type { RelayPaginatedResponse } from "../../../api/pagination";

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
    <ListItem>
      <ListItemIcon>
        <PollIcon style={{ color: isActive ? green[200] : orange[200] }} />
      </ListItemIcon>
      <ListItemText
        primary={primaryText}
        secondary={question && question.node.scriptQuestion}
      />
      <ListItemSecondaryAction>
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default ResponseOptionMapping;
