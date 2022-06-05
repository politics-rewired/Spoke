import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import isEqual from "lodash/isEqual";
import omit from "lodash/omit";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import { ALL_TEXTERS, UNASSIGNED_TEXTER } from "../../lib/constants";
import { loadData } from "../hoc/with-operations";
import IncomingMessageActions from "./components/IncomingMessageActions";
import IncomingMessageFilter from "./components/IncomingMessageFilter";
import IncomingMessageList from "./components/IncomingMessageList";

function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns,
  includeArchivedCampaigns
) {
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
  includeNotOptedOutConversations,
  includeOptedOutConversations
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

export class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props);

    const tagsFilter = props.escalatedConvosOnly
      ? {
          ...initialTagsFilter,
          excludeEscalated: false,
          escalatedConvosOnly: true
        }
      : initialTagsFilter;

    const contactsFilter = props.escalatedConvosOnly
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

    this.state = {
      page: 0,
      pageSize: 10,
      campaignsFilter: initialCampaignsFilter,
      contactsFilter,
      assignmentsFilter: initialAssignmentsFilter,
      tagsFilter,
      contactNameFilter: undefined,
      needsRender: false,
      includeArchivedCampaigns: false,
      conversationCount: 0,
      includeActiveCampaigns: true,
      includeNotOptedOutConversations: true,
      includeOptedOutConversations: false,
      selectedRows: [],
      campaignIdsContactIds: [],
      reassignmentAlert: undefined
    };
  }

  shouldComponentUpdate(dummy, nextState) {
    if (
      !nextState.needsRender &&
      isEqual(this.state.contactsFilter, nextState.contactsFilter) &&
      isEqual(this.state.campaignsFilter, nextState.campaignsFilter) &&
      isEqual(this.state.assignmentsFilter, nextState.assignmentsFilter) &&
      isEqual(this.state.tagsFilter, nextState.tagsFilter)
    ) {
      return false;
    }
    return true;
  }

  handleCampaignChanged = async (campaignId) => {
    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    );
    if (campaignId !== -1) {
      campaignsFilter.campaignId = campaignId;
    }

    await this.setState({
      campaignsFilter,
      campaignIdsContactIds: [],
      needsRender: true
    });
  };

  handleTagsChanged = (event) => {
    this.setState((prevState) => {
      const newTagsFilter = { ...prevState.tagsFilter };
      newTagsFilter.specificTagIds = event.target.value;

      return {
        tagsFilter: newTagsFilter,
        campaignIdsContactIds: [],
        needsRender: true
      };
    });
  };

  handleTexterChanged = async (texterId) => {
    const assignmentsFilter = { ...this.state.assignmentsFilter };
    if (texterId === UNASSIGNED_TEXTER) {
      assignmentsFilter.texterId = texterId;
    } else if (texterId === ALL_TEXTERS) {
      assignmentsFilter.texterId = undefined;
    } else {
      assignmentsFilter.texterId = texterId;
    }
    await this.setState({
      assignmentsFilter,
      campaignIdsContactIds: [],
      needsRender: true
    });
  };

  handleIncludeEscalatedToggled = () => {
    const tagsFilter = { ...this.state.tagsFilter };
    tagsFilter.excludeEscalated = !(
      tagsFilter && !!tagsFilter.excludeEscalated
    );
    this.setState({ tagsFilter });
  };

  handleMessageFilterChange = async (messagesFilter) => {
    const contactsFilter = Object.assign(
      omit(this.state.contactsFilter, ["messageStatus"]),
      { messageStatus: messagesFilter }
    );
    await this.setState({
      contactsFilter,
      campaignIdsContactIds: [],
      needsRender: true
    });
  };

  searchByContactName = ({ firstName, lastName, cellNumber }) => {
    this.setState({
      contactNameFilter: { firstName, lastName, cellNumber },
      campaignIdsContactIds: [],
      needsRender: true
    });
  };

  closeReassignmentDialog = () =>
    this.setState({ reassignmentAlert: undefined });

  handleReassignmentCommon = async (fn) => {
    const newState = {
      needsRender: true,
      campaignIdsContactIds: [],
      reassignmentAlert: {
        title: "Success!",
        message: "Your reassignment request succeeded"
      }
    };

    try {
      await fn();
      newState.selectedRows = [];
    } catch (error) {
      newState.reassignmentAlert = {
        title: "Error",
        message: `There was an error: ${error}`
      };
    }

    this.setState(newState);
  };

  handleReassignRequested = async (newTexterUserIds) => {
    await this.handleReassignmentCommon(async () => {
      await this.props.mutations.megaReassignCampaignContacts(
        this.props.match.params.organizationId,
        this.state.campaignIdsContactIds,
        newTexterUserIds
      );
    });
  };

  handleReassignAllMatchingRequested = async (newTexterUserIds) => {
    await this.handleReassignmentCommon(async () => {
      await this.props.mutations.megaBulkReassignCampaignContacts(
        this.props.match.params.organizationId,
        this.state.campaignsFilter || {},
        this.state.assignmentsFilter || {},
        this.state.tagsFilter || {},
        this.state.contactsFilter || {},
        newTexterUserIds,
        this.state.contactNameFilter || {}
      );
    });
  };

  handleUnassignRequested = async () => {
    await this.handleReassignmentCommon(async () => {
      await this.props.mutations.megaReassignCampaignContacts(
        this.props.match.params.organizationId,
        this.state.campaignIdsContactIds,
        null
      );
    });
  };

  handleUnassignAllMatchingRequested = async () => {
    await this.handleReassignmentCommon(async () => {
      await this.props.mutations.megaBulkReassignCampaignContacts(
        this.props.match.params.organizationId,
        this.state.campaignsFilter || {},
        this.state.assignmentsFilter || {},
        this.state.tagsFilter || {},
        this.state.contactsFilter || {},
        null,
        this.state.contactNameFilter || {}
      );
    });
  };

  markForSecondPass = async () => {
    await this.props.mutations.markForSecondPass(
      this.props.match.params.organizationId,
      this.state.campaignIdsContactIds
    );

    this.setState({
      needsRender: true
    });
  };

  handlePageChange = async (page) => {
    await this.setState({
      page,
      needsRender: true
    });
  };

  handlePageSizeChange = async (pageSize) => {
    await this.setState({ needsRender: true, pageSize });
  };

  handleRowSelection = async (newSelectedRows, data) => {
    this.setState({
      selectedRows: newSelectedRows,
      campaignIdsContactIds: data,
      needsRender: true
    });
  };

  handleNotOptedOutConversationsToggled = async () => {
    if (
      this.state.includeNotOptedOutConversations &&
      !this.state.includeOptedOutConversations
    ) {
      return;
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !this.state.includeNotOptedOutConversations,
      this.state.includeOptedOutConversations
    );

    const contactsFilter = Object.assign(
      omit(this.state.contactsFilter, ["isOptedOut"]),
      contactsFilterUpdate
    );

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations: !this.state
        .includeNotOptedOutConversations
    });
  };

  handleOptedOutConversationsToggled = async () => {
    const includeNotOptedOutConversations =
      this.state.includeNotOptedOutConversations ||
      !this.state.includeOptedOutConversations;

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !this.state.includeOptedOutConversations
    );

    const contactsFilter = Object.assign(
      omit(this.state.contactsFilter, ["isOptedOut"]),
      contactsFilterUpdate
    );

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations,
      includeOptedOutConversations: !this.state.includeOptedOutConversations
    });
  };

  handleActiveCampaignsToggled = async () => {
    if (
      this.state.includeActiveCampaigns &&
      !this.state.includeArchivedCampaigns
    ) {
      return;
    }

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      !this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    );
    this.setState({
      campaignsFilter,
      includeActiveCampaigns: !this.state.includeActiveCampaigns
    });
  };

  handleArchivedCampaignsToggled = async () => {
    const includeActiveCampaigns =
      this.state.includeActiveCampaigns || !this.state.includeArchivedCampaigns;

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      !this.state.includeArchivedCampaigns
    );

    this.setState({
      campaignsFilter,
      includeActiveCampaigns,
      includeArchivedCampaigns: !this.state.includeArchivedCampaigns
    });
  };

  conversationCountChanged = (conversationCount) =>
    this.setState({ conversationCount, needsRender: true });

  /*
    Shallow comparison here done intentionally – we want to know if its changed, not if it's different,
    since we want to allow the user to make the same query as the default one, but we don't want to
    pre-emptively run the default (and most expensive) one
  */
  haveFiltersChangedFromDefaults = () => {
    const {
      campaignsFilter,
      contactsFilter,
      assignmentsFilter,
      tagsFilter,
      contactNameFilter
    } = this.state;
    return (
      campaignsFilter !== initialCampaignsFilter ||
      contactsFilter !== initialContactsFilter ||
      assignmentsFilter !== initialAssignmentsFilter ||
      tagsFilter !== initialTagsFilter ||
      contactNameFilter !== undefined
    );
  };

  render() {
    const {
      selectedRows,
      page,
      pageSize,
      reassignmentAlert,
      tagsFilter
    } = this.state;
    const areContactsSelected =
      selectedRows === "all" ||
      (Array.isArray(selectedRows) && selectedRows.length > 0);

    const cursor = {
      offset: page * pageSize,
      limit: pageSize
    };

    const includeEscalated = tagsFilter && !tagsFilter.excludeEscalated;
    const { organizationId } = this.props.match.params;

    return (
      <div>
        <IncomingMessageFilter
          organizationId={organizationId}
          onCampaignChanged={this.handleCampaignChanged}
          onTexterChanged={this.handleTexterChanged}
          includeEscalated={includeEscalated}
          onIncludeEscalatedChanged={this.handleIncludeEscalatedToggled}
          onMessageFilterChanged={this.handleMessageFilterChange}
          onTagsChanged={this.handleTagsChanged}
          searchByContactName={this.searchByContactName}
          assignmentsFilter={this.state.assignmentsFilter}
          tagsFilter={this.state.tagsFilter.specificTagIds}
          onActiveCampaignsToggled={this.handleActiveCampaignsToggled}
          onArchivedCampaignsToggled={this.handleArchivedCampaignsToggled}
          includeActiveCampaigns={this.state.includeActiveCampaigns}
          includeArchivedCampaigns={this.state.includeArchivedCampaigns}
          onNotOptedOutConversationsToggled={
            this.handleNotOptedOutConversationsToggled
          }
          onOptedOutConversationsToggled={
            this.handleOptedOutConversationsToggled
          }
          includeNotOptedOutConversations={
            this.state.includeNotOptedOutConversations
          }
          includeOptedOutConversations={this.state.includeOptedOutConversations}
          isTexterFilterable={!this.props.escalatedConvosOnly}
          isIncludeEscalatedFilterable={!this.props.escalatedConvosOnly}
        />
        <br />
        <IncomingMessageActions
          organizationId={organizationId}
          onReassignRequested={this.handleReassignRequested}
          onReassignAllMatchingRequested={
            this.handleReassignAllMatchingRequested
          }
          onUnassignRequested={this.handleUnassignRequested}
          onUnassignAllMatchingRequested={
            this.handleUnassignAllMatchingRequested
          }
          markForSecondPass={this.markForSecondPass}
          contactsAreSelected={areContactsSelected}
          conversationCount={this.state.conversationCount}
        />
        <br />
        {this.haveFiltersChangedFromDefaults() ? (
          <IncomingMessageList
            organizationId={organizationId}
            cursor={cursor}
            contactsFilter={this.state.contactsFilter}
            campaignsFilter={this.state.campaignsFilter}
            assignmentsFilter={this.state.assignmentsFilter}
            tagsFilter={this.state.tagsFilter}
            includeEscalated={includeEscalated}
            contactNameFilter={this.state.contactNameFilter}
            selectedRows={this.state.selectedRows}
            onPageChanged={this.handlePageChange}
            onPageSizeChanged={this.handlePageSizeChange}
            onConversationSelected={this.handleRowSelection}
            onConversationCountChanged={this.conversationCountChanged}
          />
        ) : (
          <h3> Please select filters in order to start searching! </h3>
        )}
        <Dialog
          open={!!reassignmentAlert}
          onClose={this.closeReassignmentDialog}
        >
          <DialogTitle>
            {reassignmentAlert && reassignmentAlert.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {reassignmentAlert && reassignmentAlert.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              key="ok"
              color="primary"
              onClick={this.closeReassignmentDialog}
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mutations = {
  megaReassignCampaignContacts: (_ownProps) => (
    organizationId,
    campaignIdsContactIds,
    newTexterUserIds
  ) => ({
    mutation: gql`
      mutation megaReassignCampaignContacts(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
        $newTexterUserIds: [String]
      ) {
        megaReassignCampaignContacts(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
          newTexterUserIds: $newTexterUserIds
        )
      }
    `,
    variables: { organizationId, campaignIdsContactIds, newTexterUserIds }
  }),

  markForSecondPass: (_ownProps) => (
    organizationId,
    campaignIdsContactIds
  ) => ({
    mutation: gql`
      mutation markForSecondPass(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
      ) {
        markForSecondPass(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
        ) {
          id
        }
      }
    `,
    variables: { organizationId, campaignIdsContactIds }
  }),

  megaBulkReassignCampaignContacts: (_ownProps) => (
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    tagsFilter,
    contactsFilter,
    newTexterUserIds,
    contactNameFilter
  ) => ({
    mutation: gql`
      mutation megaBulkReassignCampaignContacts(
        $organizationId: String!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $assignmentsFilter: AssignmentsFilter
        $tagsFilter: TagsFilter
        $contactNameFilter: ContactNameFilter
        $newTexterUserIds: [String]
      ) {
        megaBulkReassignCampaignContacts(
          organizationId: $organizationId
          contactsFilter: $contactsFilter
          campaignsFilter: $campaignsFilter
          assignmentsFilter: $assignmentsFilter
          tagsFilter: $tagsFilter
          contactNameFilter: $contactNameFilter
          newTexterUserIds: $newTexterUserIds
        )
      }
    `,
    variables: {
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      tagsFilter,
      contactsFilter,
      contactNameFilter,
      newTexterUserIds
    }
  })
};

AdminIncomingMessageList.propTypes = {
  mutations: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};

export default compose(
  withRouter,
  loadData({ mutations })
)(AdminIncomingMessageList);
