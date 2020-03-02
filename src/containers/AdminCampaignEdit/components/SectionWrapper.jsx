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
  card: {
    marginTop: 1
  },
  title: {
    width: "100%"
  },
  avatarStyle: {
    display: "inline-block",
    verticalAlign: "middle"
  }
};

const extractStageAndStatus = percentComplete =>
  percentComplete > 100
    ? `Filtering out landlines. ${percentComplete - 100}% complete`
    : `Uploading. ${percentComplete}% complete`;

const SectionWrapper = props => {
  const {
    title,
    expandable,
    active,
    saving,
    done,
    adminPerms,
    pendingJob,
    onDiscardJob,
    onExpandChange,
    children
  } = props;

  const canDiscardJob = pendingJob && adminPerms;
  const { resultMessage, status: savePercent = -1 } = pendingJob || {};

  let avatar = null;
  const cardHeaderStyle = {
    backgroundColor: theme.colors.lightGray
  };

  if (saving) {
    avatar = <CircularProgress style={inlineStyles.avatarStyle} size={25} />;
    cardHeaderStyle.background = theme.colors.lightGray;
    cardHeaderStyle.width = `${savePercent % 100}%`;
  } else if (active && expandable) {
    cardHeaderStyle.backgroundColor = theme.colors.lightYellow;
  } else if (!expandable) {
    cardHeaderStyle.backgroundColor = theme.colors.lightGray;
  } else if (done) {
    avatar = (
      <Avatar
        icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
        style={inlineStyles.avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = theme.colors.green;
  } else if (!done) {
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
      expanded={active && expandable && !saving}
      expandable={expandable}
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
          {resultMessage && <div>Message: {resultMessage}</div>}
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
  expandable: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  done: PropTypes.bool.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  pendingJob: PropTypes.shape({
    resultMessage: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired
  }),
  onExpandChange: PropTypes.func.isRequired,
  onDiscardJob: PropTypes.func.isRequired
};

export default SectionWrapper;
