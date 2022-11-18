import Chip from "@material-ui/core/Chip";
import { useTheme } from "@material-ui/core/styles";
import type { AssignmentTarget } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import { Card, CardHeader, CardText } from "material-ui/Card";
import React from "react";

const styles = StyleSheet.create({
  row: { display: "flex", alignItems: "baseline", marginBottom: "10px" },
  chip: { marginRight: "10px" },
  disabledChip: { marginRight: "10px" },
  prefix: { whiteSpace: "nowrap", marginRight: "10px" },
  title: {},
  spacer: { flex: 1 },
  count: { whiteSpace: "nowrap", marginLeft: "10px" }
});

interface Props {
  assignmentTargets: AssignmentTarget[];
}

const AssignmentHUD: React.FC<Props> = (props) => {
  const { assignmentTargets } = props;
  const theme = useTheme();
  const disabledStyle = {
    backgroundColor: theme.palette.error.main
  };

  return (
    <Card initiallyExpanded>
      <CardHeader
        title="Assignment Targets"
        actAsExpander
        showExpandableButton
      />
      <CardText expandable>
        {assignmentTargets.map((target) => (
          <div key={target.teamTitle} className={css(styles.row)}>
            {!target.enabled && (
              <Chip
                label="Disabled"
                className={css(styles.disabledChip)}
                style={disabledStyle}
              />
            )}
            <Chip className={css(styles.chip)} label={target.teamTitle} />
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

export default AssignmentHUD;
