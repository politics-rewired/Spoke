import { gql } from "@apollo/client";
import IconButton from "@material-ui/core/IconButton";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import DataTables from "material-ui-datatables";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import LoadingIndicator from "../../../../components/LoadingIndicator";
import { loadData } from "../../../hoc/with-operations";
import { MESSAGE_STATUSES } from "../IncomingMessageFilter";
import ConversationPreviewModal from "./ConversationPreviewModal";

const formatContactName = (contact) => {
  const { firstName, lastName, optOut } = contact;
  const suffix = optOut && optOut.cell ? " ⛔" : "";
  return `${firstName} ${lastName}${suffix}`;
};

const prepareDataTableData = (conversations) =>
  conversations.map(({ campaign, texter, contact }, index) => ({
    campaignTitle: `${campaign.id}: ${campaign.title}`,
    texter: texter.displayName,
    to: formatContactName(contact),
    status: contact.messageStatus,
    messages: contact.messages,
    updatedAt: contact.updatedAt,
    index
  }));

function prepareSelectedRowsData(conversations, rowsSelected) {
  let selection = rowsSelected;
  if (rowsSelected === "all") {
    selection = Array.from(Array(conversations.length).keys());
  } else if (rowsSelected === "none") {
    selection = [];
  }

  const selectedData = selection.map((selectedIndex) => {
    const conversation = conversations[selectedIndex];
    return {
      campaignId: conversation.campaign.id,
      campaignContactId: conversation.contact.id,
      messageIds: conversation.contact.messages.map((message) => message.id)
    };
  });

  return [selection, selectedData];
}

export class IncomingMessageList extends Component {
  state = {
    activeConversationIndex: -1
  };

  componentDidMount() {
    const { total = 0 } = this.props.conversations.conversations.pageInfo;
    this.props.onConversationCountChanged(total);
  }

  componentDidUpdate(prevProps) {
    const prevConvos = prevProps.conversations.conversations;
    const { total: prevTotal = 0 } = prevConvos.pageInfo;
    const { total = 0 } = this.props.conversations.conversations.pageInfo;

    if (prevTotal !== total) {
      this.props.onConversationCountChanged(total);
    }
  }

  prepareTableColumns = () => {
    return [
      {
        key: "campaignTitle",
        label: "Campaign",
        style: {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "pre-line"
        }
      },
      {
        key: "texter",
        label: "Texter",
        style: {
          textOverflow: "ellipsis",
          overflow: "scroll",
          whiteSpace: "pre-line"
        }
      },
      {
        key: "to",
        label: "To",
        style: {
          textOverflow: "ellipsis",
          overflow: "scroll",
          whiteSpace: "pre-line"
        }
      },
      {
        key: "status",
        label: "Conversation Status",
        style: {
          textOverflow: "ellipsis",
          overflow: "scroll",
          whiteSpace: "pre-line"
        },
        render: (columnKey, row) => MESSAGE_STATUSES[row.status].name
      },
      {
        key: "updatedAt",
        label: "Last Updated At",
        style: {
          textOverflow: "ellipsis",
          overflow: "scroll",
          whiteSpace: "pre-line"
        },
        render: (columnKey, row) => new Date(row.updatedAt).toLocaleString()
      },
      {
        key: "latestMessage",
        label: "Latest Message",
        style: {
          textOverflow: "ellipsis",
          overflow: "scroll",
          whiteSpace: "pre-line"
        },
        render: (columnKey, row) => {
          let lastMessage = null;
          let lastMessageEl = <p>No Messages</p>;
          if (row.messages && row.messages.length > 0) {
            lastMessage = row.messages[row.messages.length - 1];
            lastMessageEl = (
              <p
                style={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap"
                }}
              >
                <span
                  style={{
                    color: lastMessage.isFromContact ? "blue" : "black"
                  }}
                >
                  <b>{lastMessage.isFromContact ? "Contact:" : "Texter:"} </b>
                </span>
                {lastMessage.text}
              </p>
            );
          }
          return lastMessageEl;
        }
      },
      {
        key: "viewConversation",
        label: "View Conversation",
        style: {
          textOverflow: "ellipsis",
          overflow: "scroll",
          whiteSpace: "pre-line"
        },
        render: (columnKey, row) => (
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              this.handleOpenConversation(row.index);
            }}
          >
            <OpenInNewIcon />
          </IconButton>
        )
      }
    ];
  };

  handleNextPageClick = () => {
    const {
      limit,
      offset,
      total
    } = this.props.conversations.conversations.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const maxPage = Math.floor(total / limit);
    const newPage = Math.min(maxPage, currentPage + 1);
    this.props.onPageChanged(newPage);
  };

  handlePreviousPageClick = () => {
    const { limit, offset } = this.props.conversations.conversations.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const newPage = Math.max(0, currentPage - 1);
    this.props.onPageChanged(newPage);
  };

  handleRowSizeChanged = (index, value) => {
    this.props.onPageSizeChanged(value);
  };

  handleRowsSelected = (rowsSelected) => {
    const { conversations } = this.props.conversations.conversations;
    const [selection, selectedData] = prepareSelectedRowsData(
      conversations,
      rowsSelected
    );
    this.props.onConversationSelected(selection, selectedData);
  };

  handleOpenConversation = (index) =>
    this.setState({ activeConversationIndex: index });

  handleRequestPreviousConversation = () =>
    this.setState((prevState) => {
      const { activeConversationIndex: oldIndex } = prevState;
      const newIndex = oldIndex - 1;
      if (newIndex < 0) return;
      return { activeConversationIndex: newIndex };
    });

  handleRequestNextConversation = () =>
    this.setState((prevState) => {
      const { activeConversationIndex: oldIndex } = prevState;
      const { conversations } = this.props.conversations.conversations;
      const newIndex = oldIndex + 1;
      if (newIndex >= conversations.length) return;
      return { activeConversationIndex: newIndex };
    });

  handleCloseConversation = () =>
    this.setState({ activeConversationIndex: -1 });

  render() {
    if (this.props.conversations.loading) {
      return <LoadingIndicator />;
    }

    const { conversations, pageInfo } = this.props.conversations.conversations;
    const { limit, offset, total } = pageInfo;
    const displayPage = Math.floor(offset / limit) + 1;
    const tableData = prepareDataTableData(conversations);

    const { activeConversationIndex } = this.state;
    const activeConversation = conversations[activeConversationIndex];
    const navigation = {
      previous: conversations[activeConversationIndex - 1] !== undefined,
      next: conversations[activeConversationIndex + 1] !== undefined
    };
    return (
      <div>
        <DataTables
          data={tableData}
          columns={this.prepareTableColumns()}
          multiSelectable
          selectable
          enableSelectAll
          showCheckboxes
          page={displayPage}
          rowSize={limit}
          count={total}
          onNextPageClick={this.handleNextPageClick}
          onPreviousPageClick={this.handlePreviousPageClick}
          onRowSizeChange={this.handleRowSizeChanged}
          onRowSelection={this.handleRowsSelected}
          rowSizeList={[10, 30, 50, 100, 500, 1000, 2000]}
          selectedRows={this.props.selectedRows}
        />
        <ConversationPreviewModal
          conversation={activeConversation}
          organizationId={this.props.organizationId}
          navigation={navigation}
          onRequestPrevious={this.handleRequestPreviousConversation}
          onRequestNext={this.handleRequestNextConversation}
          onRequestClose={this.handleCloseConversation}
        />
      </div>
    );
  }
}

IncomingMessageList.propTypes = {
  organizationId: PropTypes.string,
  cursor: PropTypes.object,
  contactsFilter: PropTypes.object,
  campaignsFilter: PropTypes.object,
  assignmentsFilter: PropTypes.object,
  tagsFilter: PropTypes.object,
  selectedRows: PropTypes.arrayOf(PropTypes.number).isRequired,
  onPageChanged: PropTypes.func,
  onPageSizeChanged: PropTypes.func,
  onConversationSelected: PropTypes.func,
  onConversationCountChanged: PropTypes.func
};

const queries = {
  conversations: {
    query: gql`
      query Q(
        $organizationId: String!
        $cursor: OffsetLimitCursor!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $assignmentsFilter: AssignmentsFilter
        $tagsFilter: TagsFilter
        $contactNameFilter: ContactNameFilter
      ) {
        conversations(
          cursor: $cursor
          organizationId: $organizationId
          campaignsFilter: $campaignsFilter
          contactsFilter: $contactsFilter
          assignmentsFilter: $assignmentsFilter
          tagsFilter: $tagsFilter
          contactNameFilter: $contactNameFilter
        ) {
          pageInfo {
            limit
            offset
            total
          }
          conversations {
            texter {
              id
              displayName
            }
            contact {
              id
              assignmentId
              firstName
              lastName
              cell
              messageStatus
              messages {
                id
                text
                isFromContact
                createdAt
                userId
                sendStatus
              }
              optOut {
                cell
              }
              updatedAt
            }
            campaign {
              id
              title
              previewUrl
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId,
        cursor: ownProps.cursor,
        contactsFilter: ownProps.contactsFilter,
        campaignsFilter: ownProps.campaignsFilter,
        assignmentsFilter: ownProps.assignmentsFilter,
        tagsFilter: ownProps.tagsFilter,
        contactNameFilter: ownProps.contactNameFilter
      },
      fetchPolicy: "network-only"
    })
  }
};

export default compose(
  withRouter,
  loadData({
    queries
  })
)(IncomingMessageList);
