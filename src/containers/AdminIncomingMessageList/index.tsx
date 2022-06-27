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
import { useParams } from "react-router-dom";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";

import { ALL_TEXTERS, UNASSIGNED_TEXTER } from "../../lib/constants";
import IncomingMessageActions from "./components/IncomingMessageActions";
import IncomingMessageFilter from "./components/IncomingMessageFilter";
import IncomingMessageList from "./components/IncomingMessageList";
import {
  getCampaignsFilterForCampaignArchiveStatus,
  getContactsFilterForConversationOptOutStatus
} from "./filter-utils";
import {
  AssignmentsFilterParam,
  CampaignsFilterParam,
  ContactNameParam,
  ContactsFilterParam,
  TagsFilterParam
} from "./types";

/* Initialized as objects to later facillitate shallow comparison */
const initialCampaignsFilter = { isArchived: false };
const initialContactsFilter = { isOptedOut: false };
const initialAssignmentsFilter = {};
const initialTagsFilter = {
  excludeEscalated: false,
  escalatedConvosOnly: false,
  specificTagIds: []
};

interface AdminIncomingMessageListProps {
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

  // Query Params
  const [assignmentsFilter, setAssignmentsFilter] = useQueryParam(
    "assignmentsFilter",
    withDefault(AssignmentsFilterParam, initialAssignmentsFilter)
  );
  const [campaignsFilter, setCampaignsFilter] = useQueryParam(
    "campaignsFilter",
    withDefault(CampaignsFilterParam, initialCampaignsFilter)
  );
  const [contactsFilter, setContactsFilter] = useQueryParam(
    "contactsFilter",
    withDefault(ContactsFilterParam, defaultContactsFilter)
  );
  const [tagsFilter, setTagsFilter] = useQueryParam(
    "tagsFilter",
    withDefault(TagsFilterParam, defaultTagsFilter)
  );
  const [contactNameFilter, setContactNameFilter] = useQueryParam(
    "nameFilter",
    ContactNameParam
  );

  const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 0));
  const [pageSize, setPageSize] = useQueryParam(
    "pageSize",
    withDefault(NumberParam, 10)
  );

  // Get or Compute Default states
  const defaultArchivedCampaigns = campaignsFilter.isArchived ?? false;
  const defaultActiveCampaigns = !campaignsFilter.isArchived ?? true;
  const defaultIncludeNotOptedOut = contactsFilter.isOptedOut ?? false;
  const defaultIncludeOptedOut = !contactsFilter.isOptedOut ?? true;

  // State to help filter formations
  const [includeArchivedCampaigns, setIncludeArchivedCampaigns] = useState<
    boolean
  >(defaultArchivedCampaigns);
  const [includeActiveCampaigns, setIncludeActiveCampaigns] = useState<boolean>(
    defaultActiveCampaigns
  );
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [
    includeNotOptedOutConversations,
    setIncludeNotOptedOutConversations
  ] = useState<boolean>(defaultIncludeOptedOut);
  const [
    includeOptedOutConversations,
    setIncludeOptedOutConversations
  ] = useState<boolean>(defaultIncludeNotOptedOut);
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

  const { organizationId } = useParams<{ organizationId: string }>();

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

  const handleMessageFilterChange = (messageFilter: string) => {
    const newContactsFilter = Object.assign(
      omit(contactsFilter, ["messageStatus"]),
      { messageStatus: messageFilter }
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

export default AdminIncomingMessageList;
