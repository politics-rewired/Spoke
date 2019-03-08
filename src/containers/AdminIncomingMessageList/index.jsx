import React, { Component } from 'react'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import _ from 'lodash'

import IncomingMessageActions from '../../components/IncomingMessageActions'
import IncomingMessageFilter from '../../components/IncomingMessageFilter'
import IncomingMessageList from '../../components/IncomingMessageList'
import LoadingIndicator from '../../components/LoadingIndicator'
import PaginatedCampaignsRetriever from '../PaginatedCampaignsRetriever'
import gql from 'graphql-tag'
import loadData from '../hoc/load-data'
import { withRouter } from 'react-router'
import wrapMutations from '../hoc/wrap-mutations'
import PaginatedUsersRetriever from '../PaginatedUsersRetriever'

function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns,
  includeArchivedCampaigns
) {
  let isArchived = undefined
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false
  }

  if (isArchived !== undefined) {
    return { isArchived }
  }

  return {}
}

function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations,
  includeOptedOutConversations
) {
  let isOptedOut = undefined
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false
  }

  if (isOptedOut !== undefined) {
    return { isOptedOut }
  }

  return {}
}

/* Initialized as objects to later facillitate shallow comparison */
const initialCampaignsFilter = { isArchived: false }
const initialContactsFilter = { isOptedOut: false }
const initialAssignmentsFilter = {}

export class AdminIncomingMessageList extends Component {

  state = {
    page: 0,
    pageSize: 10,
    campaignsFilter: initialCampaignsFilter,
    contactsFilter: initialContactsFilter,
    assignmentsFilter: initialAssignmentsFilter,
    contactNameFilter: undefined,
    needsRender: false,
    utc: Date.now().toString(),
    campaigns: [],
    reassignmentTexters: [],
    campaignTexters: [],
    includeArchivedCampaigns: false,
    conversationCount: 0,
    includeActiveCampaigns: true,
    conversationCount: 0,
    includeNotOptedOutConversations: true,
    includeOptedOutConversations: false,
    selectedRows: [],
    campaignIdsContactIds: [],
    reassignmentAlert: undefined,
  }

  shouldComponentUpdate(dummy, nextState) {
    if (
      !nextState.needsRender &&
      _.isEqual(this.state.contactsFilter, nextState.contactsFilter) &&
      _.isEqual(this.state.campaignsFilter, nextState.campaignsFilter) &&
      _.isEqual(this.state.assignmentsFilter, nextState.assignmentsFilter)
    ) {
      return false
    }
    return true
  }

  handleCampaignChanged = async (campaignId) => {
    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    )
    if (campaignId !== -1) {
      campaignsFilter.campaignId = campaignId
    }

    await this.setState({
      campaignsFilter,
      needsRender: true
    })
  }

  handleTexterChanged = async (texterId) => {
    const assignmentsFilter = {}
    if (texterId >= 0) {
      assignmentsFilter.texterId = texterId
    }
    await this.setState({
      assignmentsFilter,
      needsRender: true
    })
  }

  handleMessageFilterChange = async (messagesFilter) => {
    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ['messageStatus']),
      { messageStatus: messagesFilter }
    )
    await this.setState({
      contactsFilter,
      needsRender: true
    })
  }

  searchByContactName = ({firstName, lastName}) => {
    this.setState({
      contactNameFilter: { firstName, lastName },
      needsRender: true
    })
  }

  closeReassignmentDialog = () => this.setState({ reassignmentAlert: undefined })

  handleReassignmentCommon = async (fn) => {
    let newState = {
      needsRender: true,
      reassignmentAlert: {
        title: 'Success!',
        message: 'Your reassignment request succeeded'
      }
    }
    try {
      await fn()
      newState.selectedRows = []
    } catch (error) {
      newState.reassignmentAlert = {
        title: 'Error',
        message: `There was an error: ${error}`
      }
    }

    newState.utc = Date.now().toString()
    this.setState(newState)
  }

  handleReassignRequested = async (newTexterUserIds) => {
    await this.handleReassignmentCommon(async () => {
      await this.props.mutations.megaReassignCampaignContacts(
        this.props.params.organizationId,
        this.state.campaignIdsContactIds,
        newTexterUserIds
      )
    })
  }

  handleReassignAllMatchingRequested = async (newTexterUserIds) => {
    await this.handleReassignmentCommon(async () => {
      await this.props.mutations.megaBulkReassignCampaignContacts(
        this.props.params.organizationId,
        this.state.campaignsFilter || {},
        this.state.assignmentsFilter || {},
        this.state.contactsFilter || {},
        newTexterUserIds
      )
    })
  }

  markForSecondPass = async () => {
    await this.props.mutations.markForSecondPass(
      this.props.params.organizationId,
      this.state.campaignIdsContactIds
    )

    this.setState({
      utc: Date.now().toString(),
      needsRender: true
    })
  }

  handlePageChange = async (page) => {
    await this.setState({
      page,
      needsRender: true
    })
  }

  handlePageSizeChange = async (pageSize) => {
    await this.setState({ needsRender: true, pageSize })
  }

  handleRowSelection = async (newSelectedRows, data) => {
    const isDeselectAll = this.state.selectedRows === 'all' && newSelectedRows !== 'all'
    this.setState({
      selectedRows: isDeselectAll ? [] : newSelectedRows,
      campaignIdsContactIds: isDeselectAll ? [] : data,
      needsRender: true
    })
  }

  handleCampaignsReceived = async (campaigns) => {
    this.setState({ campaigns, needsRender: true })
  }

  handleCampaignTextersReceived = async (campaignTexters) => {
    this.setState({ campaignTexters, needsRender: true })
  }

  handleReassignmentTextersReceived = async (reassignmentTexters) => {
    this.setState({ reassignmentTexters, needsRender: true })
  }

  handleNotOptedOutConversationsToggled = async () => {
    if (
      this.state.includeNotOptedOutConversations &&
      !this.state.includeOptedOutConversations
    ) {
      return
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !this.state.includeNotOptedOutConversations,
      this.state.includeOptedOutConversations
    )

    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ['isOptedOut']),
      contactsFilterUpdate
    )

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations: !this.state
        .includeNotOptedOutConversations
    })
  }

  handleOptedOutConversationsToggled = async () => {
    const includeNotOptedOutConversations =
      this.state.includeNotOptedOutConversations ||
      !this.state.includeOptedOutConversations

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !this.state.includeOptedOutConversations
    )

    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ['isOptedOut']),
      contactsFilterUpdate
    )

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations,
      includeOptedOutConversations: !this.state.includeOptedOutConversations
    })
  }

  handleActiveCampaignsToggled = async () => {
    if (
      this.state.includeActiveCampaigns &&
      !this.state.includeArchivedCampaigns
    ) {
      return
    }

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      !this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    )
    this.setState({
      campaignsFilter,
      includeActiveCampaigns: !this.state.includeActiveCampaigns
    })
  }

  handleArchivedCampaignsToggled = async () => {
    const includeActiveCampaigns =
      this.state.includeActiveCampaigns || !this.state.includeArchivedCampaigns

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      !this.state.includeArchivedCampaigns
    )

    this.setState({
      campaignsFilter,
      includeActiveCampaigns,
      includeArchivedCampaigns: !this.state.includeArchivedCampaigns
    })
  }

  conversationCountChanged = (conversationCount) => this.setState({ conversationCount })

  /*
    Shallow comparison here done intentionally – we want to know if its changed, not if it's different,
    since we want to allow the user to make the same query as the default one, but we don't want to
    pre-emptively run the default (and most expensive) one
  */
  haveFiltersChangedFromDefaults = () => {
    const { campaignsFilter, contactsFilter, assignmentsFilter, contactNameFilter } = this.state
    return campaignsFilter !== initialCampaignsFilter 
      || contactsFilter !== initialContactsFilter
      || assignmentsFilter !== initialAssignmentsFilter
      || contactNameFilter !== undefined
  }

  render() {
    const { selectedRows, page, pageSize, reassignmentAlert } = this.state
    const areContactsSelected = selectedRows === 'all' || (Array.isArray(selectedRows) && selectedRows.length > 0)

    const cursor = {
      offset: page * pageSize,
      limit: pageSize
    }

    return (
      <div>
        <h3> Message Review </h3>
        <div>
          <PaginatedUsersRetriever
            organizationId={this.props.params.organizationId}
            onUsersReceived={this.handleReassignmentTextersReceived}
            pageSize={1000}
          />
          <PaginatedUsersRetriever
            organizationId={this.props.params.organizationId}
            onUsersReceived={this.handleCampaignTextersReceived}
            pageSize={1000}
            campaignsFilter={this.state.campaignsFilter}
          />
          <PaginatedCampaignsRetriever
            organizationId={this.props.params.organizationId}
            campaignsFilter={_.pick(this.state.campaignsFilter, 'isArchived')}
            onCampaignsReceived={this.handleCampaignsReceived}
            pageSize={1000}
          />
          <IncomingMessageFilter
            campaigns={this.state.campaigns}
            texters={this.state.campaignTexters}
            onCampaignChanged={this.handleCampaignChanged}
            onTexterChanged={this.handleTexterChanged}
            onMessageFilterChanged={this.handleMessageFilterChange}
            searchByContactName={this.searchByContactName}
            assignmentsFilter={this.state.assignmentsFilter}
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
            includeOptedOutConversations={
              this.state.includeOptedOutConversations
            }
          />
          <br />
          <IncomingMessageActions
            people={this.state.reassignmentTexters}
            onReassignRequested={this.handleReassignRequested}
            onReassignAllMatchingRequested={this.handleReassignAllMatchingRequested}
            markForSecondPass={this.markForSecondPass}
            contactsAreSelected={areContactsSelected}
            conversationCount={this.state.conversationCount}
          />
          <br />
          {this.haveFiltersChangedFromDefaults() 
            ? <IncomingMessageList
                organizationId={this.props.params.organizationId}
                cursor={cursor}
                contactsFilter={this.state.contactsFilter}
                campaignsFilter={this.state.campaignsFilter}
                assignmentsFilter={this.state.assignmentsFilter}
                contactNameFilter={this.state.contactNameFilter}
                selectedRows={this.state.selectedRows}
                utc={this.state.utc}
                onPageChanged={this.handlePageChange}
                onPageSizeChanged={this.handlePageSizeChange}
                onConversationSelected={this.handleRowSelection}
                onConversationCountChanged={this.conversationCountChanged}
              />
            : <h3> Please select filters in order to start searching! </h3>
          }
        </div>
        <Dialog
          title={reassignmentAlert && reassignmentAlert.title}
          actions={[
            <FlatButton
              label="Ok"
              primary={true}
              onClick={this.closeReassignmentDialog}
            />
          ]}
          modal={false}
          open={!!reassignmentAlert}
          onRequestClose={this.closeReassignmentDialog}
        >
          {reassignmentAlert && reassignmentAlert.message}
        </Dialog>
      </div>
    )
  }
}

const mapMutationsToProps = () => ({
  reassignCampaignContacts: (
    organizationId,
    campaignIdsContactIds,
    newTexterUserId
  ) => ({
    mutation: gql`
      mutation reassignCampaignContacts(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
        $newTexterUserId: String!
      ) {
        reassignCampaignContacts(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
          newTexterUserId: $newTexterUserId
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: { organizationId, campaignIdsContactIds, newTexterUserId }
  }),
  megaReassignCampaignContacts: (
    organizationId,
    campaignIdsContactIds,
    newTexterUserIds
  ) => ({
    mutation: gql`
      mutation megaReassignCampaignContacts(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
        $newTexterUserIds: [String]!
      ) {
        megaReassignCampaignContacts(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
          newTexterUserIds: $newTexterUserIds
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: { organizationId, campaignIdsContactIds, newTexterUserIds }
  }),
  markForSecondPass: (organizationId, campaignIdsContactIds) => ({
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
  bulkReassignCampaignContacts: (
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    newTexterUserId
  ) => ({
    mutation: gql`
        mutation bulkReassignCampaignContacts(
        $organizationId: String!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $assignmentsFilter: AssignmentsFilter
        $newTexterUserId: String!
        ) {
            bulkReassignCampaignContacts(
                organizationId: $organizationId
                contactsFilter: $contactsFilter,
                campaignsFilter: $campaignsFilter,
                assignmentsFilter: $assignmentsFilter,
                newTexterUserId: $newTexterUserId
            ) {
                campaignId
                assignmentId
            }
        }
    `,
    variables: { organizationId, campaignsFilter, assignmentsFilter, contactsFilter, newTexterUserId }
  }),
  megaBulkReassignCampaignContacts: (
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    newTexterUserIds
  ) => ({
    mutation: gql`
      mutation megaBulkReassignCampaignContacts(
      $organizationId: String!
      $contactsFilter: ContactsFilter
      $campaignsFilter: CampaignsFilter
      $assignmentsFilter: AssignmentsFilter
      $newTexterUserIds: [String]!
      ) {
        megaBulkReassignCampaignContacts(
          organizationId: $organizationId
          contactsFilter: $contactsFilter,
          campaignsFilter: $campaignsFilter,
          assignmentsFilter: $assignmentsFilter,
          newTexterUserIds: $newTexterUserIds
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: { organizationId, campaignsFilter, assignmentsFilter, contactsFilter, newTexterUserIds }
  })
})

export default loadData(withRouter(wrapMutations(AdminIncomingMessageList)), {
  mapMutationsToProps
})
