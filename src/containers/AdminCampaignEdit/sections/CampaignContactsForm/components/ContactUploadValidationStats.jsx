import PropTypes from "prop-types";
import React from "react";

import Divider from "material-ui/Divider";
import { ListItem, List } from "material-ui/List";
import WarningIcon from "material-ui/svg-icons/alert/warning";

const ContactUploadValidationStats = ({ validationStats }) => {
  const {
    dupeCount,
    missingCellCount,
    invalidCellCount,
    optOutCount
  } = validationStats;

  const stats = [
    [dupeCount, "duplicates"],
    [missingCellCount, "rows with missing numbers"],
    [invalidCellCount, "rows with invalid numbers"],
    [optOutCount, "opt-outs"]
  ]
    .filter(([count]) => count > 0)
    .map(([count, label]) => ({ label, count }));
  return (
    <List>
      <Divider />
      {stats.map(({ label, count }) => (
        <ListItem
          key={label}
          leftIcon={<WarningIcon color={theme.colors.orange} />}
          innerDivStyle={innerStyles.nestedItem}
          primaryText={`${count} ${label} removed`}
        />
      ))}
    </List>
  );
};

ContactUploadValidationStats.propTypes = {
  validationStats: PropTypes.shape({
    dupeCount: PropTypes.number.isRequired,
    missingCellCount: PropTypes.number.isRequired,
    invalidCellCount: PropTypes.number.isRequired,
    optOutCount: PropTypes.number.isRequired
  }).isRequired
};

export default ContactUploadValidationStats;
