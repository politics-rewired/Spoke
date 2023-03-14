import { green, red } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import BlockIcon from "@material-ui/icons/Block";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import DataTables from "material-ui-datatables";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { DateTime } from "../../../lib/datetime";

class ShortLinkDomainList extends Component {
  tableColumns = () => [
    {
      label: "Eligible",
      tooltip: "Whether the domain eligible for rotation.",
      render: (value, row) => {
        const isEligible = row.isHealthy && !row.isManuallyDisabled;
        return isEligible ? (
          <CheckCircleIcon style={{ color: green[500] }} />
        ) : (
          <BlockIcon style={{ color: red[500] }} />
        );
      }
    },
    {
      key: "domain",
      label: "Domain"
    },
    {
      key: "currentUsageCount",
      label: "Current Usage",
      tooltip:
        "How many times the domain has been used in the current rotation."
    },
    {
      key: "maxUsageCount",
      label: "Maximum Usage",
      tooltip:
        "Maximum numbers of times the domain should be used per rotation."
    },
    {
      key: "isManuallyDisabled",
      label: "Manual Disable",
      tooltip: "Whether an admin has manually disabled this domain.",
      render: (value, row) => {
        return (
          <Toggle
            toggled={value}
            disabled={row.isRowDisabled}
            onToggle={this.createHandleDisableToggle(row.id)}
          />
        );
      }
    },
    {
      key: "isHealthy",
      label: "Health",
      tooltip: "Health of the domain based on text delivery report summaries.",
      render: (value) => {
        return value ? (
          <ThumbUpIcon style={{ color: green[500] }} />
        ) : (
          <ThumbDownIcon style={{ color: red[500] }} />
        );
      }
    },
    {
      key: "cycledOutAt",
      label: "Last Cycled Out",
      tooltip: "The last time this domain was cycled out of rotation.",
      render: (value) => DateTime.fromISO(value).toRelative()
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => new Date(value).toLocaleString()
    },
    {
      label: "",
      style: { width: "50px" },
      render: (value, row) => {
        return (
          <IconButton
            disabled={row.isRowDisabled}
            onClick={this.createHandleDeleteClick(row.id)}
          >
            <DeleteForeverIcon style={{ color: red[500] }} />
          </IconButton>
        );
      }
    }
  ];

  createHandleDisableToggle = (domainId) => (event, value) => {
    // These don't appear to be doing anything to stop handleCellClick being called...
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    event.preventDefault();

    this.props.onManualDisableToggle(domainId, value);
  };

  createHandleDeleteClick = (domainId) => (event) => {
    // These don't appear to be doing anything to stop handleCellClick being called...
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    event.preventDefault();

    this.props.onDeleteDomain(domainId);
  };

  render() {
    const { disabledDomainIds } = this.props;
    let { domains } = this.props;
    domains = domains.map((domain) => {
      const isRowDisabled = disabledDomainIds.indexOf(domain.id) > -1;
      return { ...domain, isRowDisabled };
    });

    return (
      <DataTables
        height="auto"
        selectable={false}
        showRowHover={false}
        columns={this.tableColumns()}
        data={domains}
        showHeaderToolbar={false}
        showFooterToolbar={false}
        showCheckboxes={false}
      />
    );
  }
}

ShortLinkDomainList.defaultProps = {
  disabledDomainIds: []
};

ShortLinkDomainList.propTypes = {
  domains: PropTypes.arrayOf(PropTypes.object).isRequired,
  disabledDomainIds: PropTypes.arrayOf(PropTypes.string),
  onManualDisableToggle: PropTypes.func.isRequired,
  onDeleteDomain: PropTypes.func.isRequired
};

export default ShortLinkDomainList;
