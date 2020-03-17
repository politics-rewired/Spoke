import React from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import DataTable from "material-ui-datatables";
import AlarmIcon from "material-ui/svg-icons/action/alarm";
import AlarmOffIcon from "material-ui/svg-icons/action/alarm-off";
import { red500 } from "material-ui/styles/colors";

import { loadData } from "../../hoc/with-operations";

const ROW_SIZE_OPTIONS = [25, 50, 100, 250, 500];

const columns = [
  {
    key: "dismissed",
    label: "Status",
    style: { width: 40 },
    render: (dismissed, _row) =>
      dismissed ? <AlarmOffIcon /> : <AlarmIcon color={red500} />
  },
  {
    key: "token",
    label: "Token",
    style: { width: 60 }
  },
  {
    key: "messageText",
    label: "Message Text"
  }
];

export const TrollAlarmList = props => {
  const { selectedAlarmIds, dismissed, token, pageSize, page } = props;
  const { totalCount, alarms: trollAlarms } = props.trollAlarms.trollAlarms;

  if (trollAlarms.length === 0) {
    const state = dismissed ? "dismissed" : "triggered";
    const tokenSuffix = token ? ` for ${token}` : "";
    return <p>{`No ${state} alarms${tokenSuffix}.`}</p>;
  }

  const selectedRows = trollAlarms
    .map(({ id }, idx) => (selectedAlarmIds.includes(id) ? idx : false))
    .filter(idxOrFalse => idxOrFalse !== false);
  const handleRowsSelected = rows => {
    // Default handles the "none" case
    let newSelection = [];

    if (rows === "all") {
      newSelection = trollAlarms.map(alarm => alarm.id);
    }

    if (Array.isArray(rows)) {
      newSelection = rows.map(idx => trollAlarms[idx].id);
    }

    props.onAlarmSelectionChange(newSelection);
  };

  const handleRowSizeChange = (_index, pageSize) =>
    props.onPageSizeChange(pageSize);

  const handlePreviousPageClick = () => {
    const nextPage = Math.max(0, page - 1);
    props.onPageChange(nextPage);
  };

  const handleNextPageClick = () => {
    const pageCount = Math.ceil(totalCount / pageSize);
    const nextPage = Math.min(pageCount - 1, page + 1);
    props.onPageChange(nextPage);
  };

  return (
    <DataTable
      multiSelectable
      selectable
      enableSelectAll
      showCheckboxes
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
  organizationId: PropTypes.string.isRequired,
  pageSize: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  dismissed: PropTypes.bool.isRequired,
  token: PropTypes.string,

  // Func
  onAlarmSelectionChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,

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
          }
        }
      }
    `,
    options: ownProps => ({
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
