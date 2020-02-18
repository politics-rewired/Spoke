import PropTypes from "prop-types";
import React from "react";

import Avatar from "material-ui/Avatar";
import { Card, CardHeader, CardText, CardActions } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import CircularProgress from "material-ui/CircularProgress";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import DoneIcon from "material-ui/svg-icons/action/done";
import CancelIcon from "material-ui/svg-icons/navigation/cancel";

import { dataTest, camelCase } from "../../../lib/attributes";
import theme from "../../../styles/theme";

const inlineStyles = {
  card: { marginTop: 1 },
  title: { width: "100%" },
  avatarStyle: {
    display: "inline-block",
    verticalAlign: "middle"
  }
};

const extractStageAndStatus = percentComplete => {
  if (percentComplete > 100) {
    return `Filtering out landlines. ${percentComplete - 100}% complete`;
  } else {
    return `Uploading. ${percentComplete}% complete`;
  }
};

const SectionWrapper = props => {
  const {
    title,
    sectionCanExpandOrCollapse,
    sectionIsExpanded,
    sectionIsSaving,
    sectionIsDone,
    savePercent,
    canDiscardJob,
    jobMessage,
    onExpandChange,
    onDiscardJob,
    children
  } = props;

  const expandable = !sectionIsSaving && sectionCanExpandOrCollapse;

  let avatar = null;
  const cardHeaderStyle = {
    backgroundColor: theme.colors.lightGray
  };

  if (sectionIsSaving) {
    avatar = <CircularProgress style={inlineStyles.avatarStyle} size={25} />;
    cardHeaderStyle.background = theme.colors.lightGray;
    cardHeaderStyle.width = `${savePercent % 100}%`;
  } else if (sectionIsExpanded && sectionCanExpandOrCollapse) {
    cardHeaderStyle.backgroundColor = theme.colors.lightYellow;
  } else if (!sectionCanExpandOrCollapse) {
    cardHeaderStyle.backgroundColor = theme.colors.lightGray;
  } else if (sectionIsDone) {
    avatar = (
      <Avatar
        icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
        style={inlineStyles.avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = theme.colors.green;
  } else if (!sectionIsDone) {
    avatar = (
      <Avatar
        icon={<WarningIcon style={{ fill: theme.colors.orange }} />}
        style={inlineStyles.avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = theme.colors.yellow;
  }

  return (
    <Card
      {...dataTest(camelCase(title))}
      expanded={sectionIsExpanded && sectionCanExpandOrCollapse}
      expandable={sectionCanExpandOrCollapse}
      onExpandChange={onExpandChange}
      style={inlineStyles.card}
    >
      <CardHeader
        title={title}
        titleStyle={inlineStyles.title}
        style={cardHeaderStyle}
        actAsExpander={expandable}
        showExpandableButton={expandable}
        avatar={avatar}
      />
      <CardText expandable>{children}</CardText>
      {canDiscardJob && (
        <CardActions>
          <div>Current Status: {extractStageAndStatus(savePercent)}</div>
          {jobMessage && <div>Message: {jobMessage}</div>}
          <RaisedButton
            label="Discard Job"
            icon={<CancelIcon />}
            onClick={onDiscardJob}
          />
        </CardActions>
      )}
    </Card>
  );
};

SectionWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  sectionCanExpandOrCollapse: PropTypes.bool.isRequired,
  sectionIsExpanded: PropTypes.bool.isRequired,
  sectionIsSaving: PropTypes.bool.isRequired,
  sectionIsDone: PropTypes.bool.isRequired,
  savePercent: PropTypes.number.isRequired,
  canDiscardJob: PropTypes.bool.isRequired,
  jobMessage: PropTypes.string,
  onExpandChange: PropTypes.func.isRequired,
  onDiscardJob: PropTypes.func.isRequired
};

export default SectionWrapper;
