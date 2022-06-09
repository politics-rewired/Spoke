import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import {
  useMegaBulkReassignCampaignContactsMutation,
  useMegaReassignCampaignContactsMutation
} from "@spoke/spoke-codegen";
import omit from "lodash/omit";
import React, { useState } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { ALL_TEXTERS, UNASSIGNED_TEXTER } from "../../lib/constants";
import IncomingMessageActions from "./components/IncomingMessageActions";
import IncomingMessageFilter from "./components/IncomingMessageFilter";
import IncomingMessageList from "./components/IncomingMessageList";

function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns: boolean,
  includeArchivedCampaigns: boolean
): Record<string, any> {
  let isArchived;
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true;
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false;
  }

  if (isArchived !== undefined) {
    return { isArchived };
  }

  return {};
}

function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations: boolean,
  includeOptedOutConversations: boolean
) {
  let isOptedOut;
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true;
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false;
  }

  if (isOptedOut !== undefined) {
    return { isOptedOut };
  }

  return {};
}

/* Initialized as objects to later facillitate shallow comparison */
const initialCampaignsFilter = { isArchived: false };
const initialContactsFilter = { isOptedOut: false };
const initialAssignmentsFilter = {};
const initialTagsFilter = {
  excludeEscalated: false,
  escalatedConvosOnly: false,
  specificTagIds: []
};

interface AdminIncomingMessageListProps
  extends RouteComponentProps<{ organizationId: string }> {
  escalatedConvosOnly?: boolean;
}

type ReassignmentAlert = {
  title?: string;
  message?: string;
};

const AdminIncomingMessageList: React.FC<AdminIncomingMessageListProps> = (
  props
) => {
  const defaultTagsFilter = props.escalatedConvosOnly
    ? {
        ...initialTagsFilter,
        excludeEscalated: false,
        escalatedConvosOnly: true
      }
    : initialTagsFilter;

  const defaultContactsFilter = props.escalatedConvosOnly
    ? {
        ...initialContactsFilter,
        messageStatus: [
          "needsResponse",
          "needsMessage",
          "convo",
          "messaged"
        ].join(",")
      }
    : initialContactsFilter;

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [campaignsFilter, setCampaignsFilter] = useState<any>(
    initialCampaignsFilter
  );
  const [contactsFilter, setContactsFilter] = useState<any>(
    defaultContactsFilter
  );
  const [assignmentsFilter, setAssignmentsFilter] = useState<any>(
    initialAssignmentsFilter
  );
  const [tagsFilter, setTagsFilter] = useState<any>(defaultTagsFilter);
  const [contactNameFilter, setContactNameFilter] = useState<any>(undefined);
  const [includeArchivedCampaigns, setIncludeArchivedCampaigns] = useState<
    boolean
  >(false);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [includeActiveCampaigns, setIncludeActiveCampaigns] = useState<boolean>(
    true
  );
  const [
    includeNotOptedOutConversations,
    setIncludeNotOptedOutConversations
  ] = useState<boolean>(true);
  const [
    includeOptedOutConversations,
    setIncludeOptedOutConversations
  ] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<
    Array<any> | string | undefined
  >([]);
  const [campaignIdsContactIds, setCampaignIdsContactIds] = useState<
    Array<any>
  >([]);
  const [reassignmentAlert, setReassignmentAlert] = useState<
    ReassignmentAlert | undefined
  >(undefined);

  const [
    megaReassignCampaignContacts
  ] = useMegaReassignCampaignContactsMutation();
  const [
    megaBulkReassignCampaignContacts
  ] = useMegaBulkReassignCampaignContactsMutation();

  const { organizationId } = props.match.params;

  const handleCampaignChanged = async (campaignId: number) => {
    const newCampaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      includeArchivedCampaigns
    );
    if (campaignId !== -1) {
      newCampaignsFilter.campaignId = campaignId;
    }

    setCampaignsFilter(newCampaignsFilter);
    setCampaignIdsContactIds([]);
  };

  const handleTagsChanged = (event: React.ChangeEvent<{ value: any }>) => {
    const newTagsFilter = { ...tagsFilter };
    newTagsFilter.specificTagIds = event.target.value;

    setTagsFilter(newTagsFilter);
    setCampaignIdsContactIds([]);
  };

  const handleTexterChanged = async (texterId: number) => {
    const newAssignmentsFilter = { ...assignmentsFilter };
    if (texterId === UNASSIGNED_TEXTER) {
      newAssignmentsFilter.texterId = texterId;
    } else if (texterId === ALL_TEXTERS) {
      newAssignmentsFilter.texterId = undefined;
    } else {
      newAssignmentsFilter.texterId = texterId;
    }

    setAssignmentsFilter(newAssignmentsFilter);
    setCampaignIdsContactIds([]);
  };

  const handleIncludeEscalatedToggled = () => {
    const newTagsFilter = { ...tagsFilter };
    newTagsFilter.excludeEscalated = !(
      newTagsFilter && !!newTagsFilter.excludeEscalated
    );

    setTagsFilter(newTagsFilter);
  };

  const handleMessageFilterChange = async (messagesFilter: Array<string>) => {
    const newContactsFilter = Object.assign(
      omit(contactsFilter, ["messageStatus"]),
      { messageStatus: messagesFilter }
    );

    setContactsFilter(newContactsFilter);
    setCampaignIdsContactIds([]);
  };

  const searchByContactName = ({
    firstName,
    lastName,
    cellNumber
  }: {
    firstName?: string;
    lastName?: string;
    cellNumber?: string;
  }) => {
    setContactNameFilter({ firstName, lastName, cellNumber });
    setCampaignIdsContactIds([]);
  };

  const closeReassignmentDialog = () => setReassignmentAlert(undefined);

  const handleReassignmentCommon = async (fn: () => void) => {
    try {
      fn();
      setCampaignIdsContactIds([]);
      setReassignmentAlert({
        title: "Success!",
        message: "Your reassignment request succeeded"
      });
      setSelectedRows([]);
    } catch (error) {
      setReassignmentAlert({
        title: "Error",
        message: `There was an error: ${error}`
      });
    }
  };

  const handleReassignRequested = async (newTexterUserIds: Array<string>) => {
    await handleReassignmentCommon(() =>
      megaReassignCampaignContacts({
        variables: {
          organizationId,
          campaignIdsContactIds,
          newTexterUserIds
        }
      })
    );
  };

  const handleReassignAllMatchingRequested = async (
    newTexterUserIds: Array<string>
  ) => {
    await handleReassignmentCommon(() =>
      megaBulkReassignCampaignContacts({
        variables: {
          organizationId,
          campaignsFilter,
          assignmentsFilter,
          tagsFilter,
          contactsFilter,
          newTexterUserIds,
          contactNameFilter
        }
      })
    );
  };

  const handleUnassignRequested = async () => {
    await handleReassignmentCommon(() =>
      megaReassignCampaignContacts({
        variables: {
          organizationId,
          campaignIdsContactIds,
          newTexterUserIds: null
        }
      })
    );
  };

  const handleUnassignAllMatchingRequested = async () => {
    await handleReassignmentCommon(() =>
      megaBulkReassignCampaignContacts({
        variables: {
          organizationId,
          campaignsFilter,
          assignmentsFilter,
          tagsFilter,
          contactsFilter,
          newTexterUserIds: null,
          contactNameFilter
        }
      })
    );
  };

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handlePageSizeChange = (newPageSize: number) =>
    setPageSize(newPageSize);

  const handleRowSelection = async (
    newSelectedRows: Array<any>,
    data: Array<any>
  ) => {
    setSelectedRows(newSelectedRows);
    setCampaignIdsContactIds(data);
  };

  const conversationCountChanged = (newConversationCount: number) =>
    setConversationCount(newConversationCount);

  const handleNotOptedOutConversationsToggled = async () => {
    if (includeNotOptedOutConversations && !includeOptedOutConversations) {
      return;
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !includeNotOptedOutConversations,
      includeOptedOutConversations
    );

    const newContactsFilter = Object.assign(
      omit(contactsFilter, ["isOptedOut"]),
      contactsFilterUpdate
    );

    setContactsFilter(newContactsFilter);
    setIncludeNotOptedOutConversations(!includeNotOptedOutConversations);
  };

  const handleOptedOutConversationsToggled = async () => {
    const newIncludeNotOptedOutConversations =
      includeNotOptedOutConversations || !includeOptedOutConversations;

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !includeOptedOutConversations
    );

    const newContactsFilter = Object.assign(
      omit(contactsFilter, ["isOptedOut"]),
      contactsFilterUpdate
    );

    setContactsFilter(newContactsFilter);
    setIncludeNotOptedOutConversations(newIncludeNotOptedOutConversations);
    setIncludeOptedOutConversations(!includeOptedOutConversations);
  };

  const handleActiveCampaignsToggled = async () => {
    if (includeActiveCampaigns && !includeArchivedCampaigns) {
      return;
    }

    const newCampaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      !includeActiveCampaigns,
      includeArchivedCampaigns
    );

    setCampaignsFilter(newCampaignsFilter);
    setIncludeActiveCampaigns(!includeActiveCampaigns);
  };

  const handleArchivedCampaignsToggled = async () => {
    const newIncludeActiveCampaigns =
      includeActiveCampaigns || !includeArchivedCampaigns;

    const newCampaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      !includeArchivedCampaigns
    );

    setCampaignsFilter(newCampaignsFilter);
    setIncludeActiveCampaigns(newIncludeActiveCampaigns);
    setIncludeArchivedCampaigns(!includeArchivedCampaigns);
  };

  /*
    Shallow comparison here done intentionally – we want to know if its changed, not if it's different,
    since we want to allow the user to make the same query as the default one, but we don't want to
    pre-emptively run the default (and most expensive) one
  */
  const haveFiltersChangedFromDefaults = () => {
    return (
      campaignsFilter !== initialCampaignsFilter ||
      contactsFilter !== initialContactsFilter ||
      assignmentsFilter !== initialAssignmentsFilter ||
      tagsFilter !== initialTagsFilter ||
      contactNameFilter !== undefined
    );
  };

  const areContactsSelected =
    selectedRows === "all" ||
    (Array.isArray(selectedRows) && selectedRows.length > 0);

  const cursor = {
    offset: page * pageSize,
    limit: pageSize
  };

  const includeEscalated = tagsFilter && !tagsFilter.excludeEscalated;

  return (
    <div>
      <IncomingMessageFilter
        organizationId={organizationId}
        onCampaignChanged={handleCampaignChanged}
        onTexterChanged={handleTexterChanged}
        includeEscalated={includeEscalated}
        onIncludeEscalatedChanged={handleIncludeEscalatedToggled}
        onMessageFilterChanged={handleMessageFilterChange}
        onTagsChanged={handleTagsChanged}
        searchByContactName={searchByContactName}
        assignmentsFilter={assignmentsFilter}
        tagsFilter={tagsFilter.specificTagIds}
        onActiveCampaignsToggled={handleActiveCampaignsToggled}
        onArchivedCampaignsToggled={handleArchivedCampaignsToggled}
        includeActiveCampaigns={includeActiveCampaigns}
        includeArchivedCampaigns={includeArchivedCampaigns}
        onNotOptedOutConversationsToggled={
          handleNotOptedOutConversationsToggled
        }
        onOptedOutConversationsToggled={handleOptedOutConversationsToggled}
        includeNotOptedOutConversations={includeNotOptedOutConversations}
        includeOptedOutConversations={includeOptedOutConversations}
        isTexterFilterable={!props.escalatedConvosOnly}
        isIncludeEscalatedFilterable={!props.escalatedConvosOnly}
      />
      <br />
      <IncomingMessageActions
        organizationId={organizationId}
        onReassignRequested={handleReassignRequested}
        onReassignAllMatchingRequested={handleReassignAllMatchingRequested}
        onUnassignRequested={handleUnassignRequested}
        onUnassignAllMatchingRequested={handleUnassignAllMatchingRequested}
        contactsAreSelected={areContactsSelected}
        conversationCount={conversationCount}
      />
      <br />
      {haveFiltersChangedFromDefaults() ? (
        <IncomingMessageList
          organizationId={organizationId}
          cursor={cursor}
          contactsFilter={contactsFilter}
          campaignsFilter={campaignsFilter}
          assignmentsFilter={assignmentsFilter}
          tagsFilter={tagsFilter}
          includeEscalated={includeEscalated}
          contactNameFilter={contactNameFilter}
          selectedRows={selectedRows}
          onPageChanged={handlePageChange}
          onPageSizeChanged={handlePageSizeChange}
          onConversationSelected={handleRowSelection}
          onConversationCountChanged={conversationCountChanged}
        />
      ) : (
        <h3> Please select filters in order to start searching! </h3>
      )}
      <Dialog open={!!reassignmentAlert} onClose={closeReassignmentDialog}>
        <DialogTitle>
          {reassignmentAlert && reassignmentAlert.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {reassignmentAlert && reassignmentAlert.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button key="ok" color="primary" onClick={closeReassignmentDialog}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default withRouter(AdminIncomingMessageList);
