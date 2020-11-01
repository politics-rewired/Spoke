import React from "react";
import PropTypes from "prop-types";
import { red200 } from "material-ui/styles/colors";

import { Card, CardHeader, CardText } from "material-ui/Card";
import Chip from "material-ui/Chip";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  row: { display: "flex", alignItems: "baseline", marginBottom: "10px" },
  chip: { marginRight: "10px" },
  disabledChip: { backgroundColor: red200, marginRight: "10px" },
  prefix: { whiteSpace: "nowrap", marginRight: "10px" },
  title: {},
  spacer: { flex: 1 },
  count: { whiteSpace: "nowrap", marginLeft: "10px" }
});

const AssignmentHUD = (props) => {
  const { assignmentTargets } = props;

  return (
    <Card initiallyExpanded={true}>
      <CardHeader
        title="Assignment Targets"
        actAsExpander={true}
        showExpandableButton={true}
      />
      <CardText expandable={true}>
        {assignmentTargets.map((target) => (
          <div key={target.teamTitle} className={css(styles.row)}>
            {!target.enabled && (
              <Chip className={css(styles.disabledChip)}>Disabled</Chip>
            )}
            <Chip className={css(styles.chip)}>{target.teamTitle}</Chip>
            <div className={css(styles.prefix)}>{target.type} &#8594;</div>
            <div className={css(styles.title)}>
              {target.campaign.id}: {target.campaign.title}
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.count)}>({target.countLeft} left)</div>
          </div>
        ))}
      </CardText>
    </Card>
  );
};

AssignmentHUD.propTypes = {
  assignmentTargets: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default AssignmentHUD;
