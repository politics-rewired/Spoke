/* eslint-disable react/display-name */
import { gql } from "@apollo/client";
import { red } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import AlarmIcon from "@material-ui/icons/Alarm";
import AlarmOffIcon from "@material-ui/icons/AlarmOff";
import SaveIcon from "@material-ui/icons/Save";
import DataTable from "material-ui-datatables";
import PropTypes from "prop-types";
import React from "react";

import { loadData } from "../../hoc/with-operations";

const ROW_SIZE_OPTIONS = [25, 50, 100, 250, 500];

export const TrollAlarmList = (props) => {
  const { selectedAlarmIds, dismissed, token, pageSize, page } = props;
  const { totalCount, alarms: trollAlarms } = props.trollAlarms.trollAlarms;

  if (trollAlarms.length === 0) {
    const state = dismissed ? "dismissed" : "triggered";
    const tokenSuffix = token ? ` for ${token}` : "";
    return <p>{`No ${state} alarms${tokenSuffix}.`}</p>;
  }

  const selectedRows = trollAlarms
    .map(({ id }, idx) => (selectedAlarmIds.includes(id) ? idx : false))
    .filter((idxOrFalse) => idxOrFalse !== false);
  const handleRowsSelected = (rows) => {
    // Default handles the "none" case
    let newSelection = [];

    if (rows === "all") {
      newSelection = trollAlarms.map((alarm) => alarm.id);
    }

    if (Array.isArray(rows)) {
      newSelection = rows.map((idx) => trollAlarms[idx].id);
    }

    props.onAlarmSelectionChange(newSelection);
  };

  const handleRowSizeChange = (_index, newPageSize) =>
    props.onPageSizeChange(newPageSize);

  const handlePreviousPageClick = () => {
    const nextPage = Math.max(0, page - 1);
    props.onPageChange(nextPage);
  };

  const handleNextPageClick = () => {
    const pageCount = Math.ceil(totalCount / pageSize);
    const nextPage = Math.min(pageCount - 1, page + 1);
    props.onPageChange(nextPage);
  };

  const handleClickCopyAlarm = (alarm) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    props.onCopyAlarm(alarm);
  };

  const columns = [
    {
      key: "dismissed",
      label: "Status",
      style: { width: 40 },
      render: (isRowDismissed, _row) =>
        isRowDismissed ? (
          <AlarmOffIcon />
        ) : (
          <AlarmIcon style={{ color: red[500] }} />
        )
    },
    {
      key: "token",
      label: "Token",
      style: { width: 60 }
    },
    {
      key: "user",
      label: "Texter",
      style: { width: 60 },
      render: (user, _row) => user.displayName
    },
    {
      key: "messageText",
      label: "Message Text"
    },
    {
      label: "Actions",
      style: { width: "50px" },
      render: (_value, row) => {
        return (
          <IconButton
            tooltip="Copy Texter Details"
            onClick={handleClickCopyAlarm(row)}
            onMouseEnter={(event) => event.stopPropagation()}
          >
            <SaveIcon />
          </IconButton>
        );
      }
    }
  ];

  return (
    <DataTable
      multiSelectable
      selectable
      enableSelectAll
      showCheckboxes
      showRowHover={false}
      data={trollAlarms}
      columns={columns}
      selectedRows={selectedRows}
      onRowSelection={handleRowsSelected}
      rowSize={pageSize}
      rowSizeList={ROW_SIZE_OPTIONS}
      onRowSizeChange={handleRowSizeChange}
      page={page + 1}
      count={totalCount}
      onNextPageClick={handleNextPageClick}
      onPreviousPageClick={handlePreviousPageClick}
    />
  );
};

TrollAlarmList.propTypes = {
  // UI
  selectedAlarmIds: PropTypes.arrayOf(PropTypes.string).isRequired,

  // Query params
  // eslint-disable-next-line react/no-unused-prop-types
  organizationId: PropTypes.string.isRequired,
  pageSize: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  dismissed: PropTypes.bool.isRequired,
  token: PropTypes.string,

  // Func
  onAlarmSelectionChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onCopyAlarm: PropTypes.func.isRequired,

  // HOC props
  trollAlarms: PropTypes.shape({
    trollAlarms: PropTypes.shape({
      totalCount: PropTypes.number.isRequired,
      alarms: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          messageId: PropTypes.string.isRequired,
          messageText: PropTypes.string.isRequired,
          token: PropTypes.string.isRequired,
          dismissed: PropTypes.bool.isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const queries = {
  trollAlarms: {
    query: gql`
      query getTrollAlarmsForOrg(
        $organizationId: String!
        $limit: Int!
        $offset: Int!
        $token: String
        $dismissed: Boolean!
      ) {
        trollAlarms(
          organizationId: $organizationId
          limit: $limit
          offset: $offset
          token: $token
          dismissed: $dismissed
        ) {
          totalCount
          alarms {
            id
            messageId
            messageText
            token
            dismissed
            user {
              id
              email
              displayName
            }
            contact {
              id
              firstName
              lastName
              campaign {
                id
              }
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId,
        offset: ownProps.page * ownProps.pageSize,
        limit: ownProps.pageSize,
        dismissed: ownProps.dismissed,
        token: ownProps.token
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(TrollAlarmList);
