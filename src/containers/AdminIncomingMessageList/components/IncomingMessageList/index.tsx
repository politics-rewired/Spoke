import IconButton from "@material-ui/core/IconButton";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import type {
  GridColDef,
  GridRenderCellParams,
  GridSelectionModel
} from "@mui/x-data-grid-pro";
import { DataGridPro } from "@mui/x-data-grid-pro";
import type {
  CampaignContact,
  Conversation,
  Message,
  PageInfo
} from "@spoke/spoke-codegen";
import { useGetConversationsForMessageReviewQuery } from "@spoke/spoke-codegen";
import React, { useEffect } from "react";
import { DateTime } from "src/lib/datetime";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";

import LoadingIndicator from "../../../../components/LoadingIndicator";
import { MESSAGE_STATUSES } from "../IncomingMessageFilter";
import ConversationPreviewModal from "./ConversationPreviewModal";

type Conversations = {
  conversations: Array<Conversation>;
  pageInfo: PageInfo;
};

const formatContactName = (contact: CampaignContact) => {
  const { firstName, lastName, optOut } = contact;
  const suffix = optOut && optOut.cell ? " ⛔" : "";
  return `${firstName} ${lastName}${suffix}`;
};

const prepareDataTableData = (conversationsData: Array<any>) =>
  conversationsData.map(({ campaign, texter, contact }, index) => ({
    id: index,
    campaignTitle: `${campaign.id}: ${campaign.title}`,
    texter: texter.displayName,
    to: formatContactName(contact),
    status: contact.messageStatus,
    messages: contact.messages,
    updatedAt: contact.updatedAt
  }));

function prepareSelectedRowsData(
  conversations: Array<any>,
  rowsSelected: Array<any>
) {
  const selectedData = rowsSelected.map((selectedIndex: number) => {
    const conversation = conversations[selectedIndex];
    return {
      campaignId: conversation.campaign.id,
      campaignContactId: conversation.contact.id,
      messageIds: conversation.contact.messages.map(
        (message: Message) => message.id
      )
    };
  });

  return [rowsSelected, selectedData];
}

interface IncomingMessageListProps {
  organizationId: string;
  cursor: any;
  contactsFilter: any;
  campaignsFilter: any;
  assignmentsFilter: any;
  tagsFilter: any;
  contactNameFilter: any;
  selectedRows: Array<number>;
  onPageChanged(page: number): void;
  onPageSizeChanged(pageSize: number): void;
  onConversationSelected(selection: Array<any>, selectedData: Array<any>): void;
  onConversationCountChanged(total: number): void;
}

const IncomingMessageList: React.FC<IncomingMessageListProps> = (props) => {
  const [activeConversationIndex, setActiveConversationIndex] = useQueryParam(
    "activeConversation",
    withDefault(NumberParam, -1)
  );

  const {
    data: conversationsData,
    loading: conversationsLoading
  } = useGetConversationsForMessageReviewQuery({
    variables: {
      organizationId: props.organizationId,
      cursor: props.cursor,
      contactsFilter: props.contactsFilter,
      campaignsFilter: props.campaignsFilter,
      assignmentsFilter: props.assignmentsFilter,
      tagsFilter: props.tagsFilter,
      contactNameFilter: props.contactNameFilter
    }
  });

  const conversations = conversationsData?.conversations as Conversations;
  const conversationsCount = conversations?.pageInfo?.total ?? 0;

  useEffect(() => {
    props.onConversationCountChanged(conversationsCount);
  }, [conversationsCount]);

  const handlePageChanged = (page: number) => props.onPageChanged(page);

  const handleRowSizeChanged = (pageSize: number) => {
    props.onPageSizeChanged(pageSize);
  };

  const handleRowsSelected = (rowsSelected: GridSelectionModel) => {
    const [selection, selectedData] = prepareSelectedRowsData(
      conversations?.conversations,
      rowsSelected
    );
    props.onConversationSelected(
      selection as Array<any>,
      selectedData as Array<any>
    );
  };

  const handleOpenConversation = (index: number) =>
    setActiveConversationIndex(index);

  const handleRequestPreviousConversation = () => {
    if (activeConversationIndex >= 1) {
      setActiveConversationIndex(activeConversationIndex - 1);
    }
  };

  const handleRequestNextConversation = () => {
    if (activeConversationIndex < conversationsCount) {
      setActiveConversationIndex(activeConversationIndex + 1);
    }
  };

  const handleCloseConversation = () => setActiveConversationIndex(-1);

  const columns: GridColDef[] = [
    {
      field: "campaignTitle",
      headerName: "Campaign",
      flex: 4
    },
    {
      field: "texter",
      headerName: "Texter",
      flex: 2
    },
    {
      field: "to",
      headerName: "To",
      flex: 2
    },
    {
      field: "status",
      headerName: "Conversation Status",
      flex: 3,
      renderCell: (params: GridRenderCellParams) => {
        const statusName = MESSAGE_STATUSES[params.row.status].name;
        return statusName;
      }
    },
    {
      field: "updatedAt",
      headerName: "Last Updated At",
      flex: 3,
      renderCell: (params: GridRenderCellParams) =>
        new DateTime(params.row.updatedAt).toLocaleString(DateTime.DATETIME_MED)
    },
    {
      field: "latestMessage",
      headerName: "Latest Message",
      flex: 3,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params;
        let lastMessage = null;
        let lastMessageEl = <p>No Messages</p>;

        if (row?.messages?.length > 0) {
          lastMessage = row.messages.at(-1);

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
                <b>{lastMessage.isFromContact ? "Contact: " : "Texter: "}</b>
              </span>
              {lastMessage.text}
            </p>
          );
        }
        return lastMessageEl;
      }
    },
    {
      field: "viewConversation",
      headerName: "View Conversation",
      flex: 2,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            handleOpenConversation(params.row.id);
          }}
        >
          <OpenInNewIcon />
        </IconButton>
      )
    }
  ];

  if (conversationsLoading) {
    return <LoadingIndicator />;
  }

  const { conversations: allConversations, pageInfo } = conversations;
  const { limit, offset, total } = pageInfo;
  const displayPage = Math.floor(offset / limit);
  const tableData = prepareDataTableData(allConversations);

  const activeConversation = allConversations[activeConversationIndex];
  const navigation = {
    previous: allConversations[activeConversationIndex - 1] !== undefined,
    next: allConversations[activeConversationIndex + 1] !== undefined
  };

  return (
    <div style={{ width: "100%", background: "#fff" }}>
      <DataGridPro
        autoHeight
        rows={tableData}
        columns={columns}
        checkboxSelection
        pagination
        page={displayPage}
        pageSize={limit}
        rowCount={total}
        rowsPerPageOptions={[10, 30, 50, 100, 500, 1000, 2000]}
        paginationMode="server"
        onPageChange={handlePageChanged}
        onPageSizeChange={handleRowSizeChanged}
        onSelectionModelChange={handleRowsSelected}
      />
      <ConversationPreviewModal
        conversation={activeConversation}
        organizationId={props.organizationId}
        navigation={navigation}
        onRequestPrevious={handleRequestPreviousConversation}
        onRequestNext={handleRequestNextConversation}
        onRequestClose={handleCloseConversation}
      />
    </div>
  );
};

export default IncomingMessageList;
