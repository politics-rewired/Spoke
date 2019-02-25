import gql from 'graphql-tag'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import PropTypes from 'prop-types'
import React from 'react'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import UnarchiveIcon from 'material-ui/svg-icons/content/unarchive'
import IconButton from 'material-ui/IconButton'
import { withRouter } from 'react-router'
import theme from '../styles/theme'
import Chip from '../components/Chip'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import Empty from '../components/Empty'
import LoadingIndicator from '../components/LoadingIndicator'
import { dataTest } from '../lib/attributes'
import Dialog from 'material-ui/Dialog'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import FlatButton from 'material-ui/FlatButton'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  hasUnassignedContacts
  hasUnsentInitialMessages
  hasUnhandledMessages
  description
  dueBy
  creator {
    displayName
  }
`

const inlineStyles = {
  past: {
    opacity: 0.6
  },
  warn: {
    color: theme.colors.orange
  },
  good: {
    color: theme.colors.green
  },
  warnUnsent: {
    color: theme.colors.blue
  }
}

const operations = {
  releaseUnsentMessages: {
    title: campaign => `Release Unsent Messages for ${campaign.title}`,
    body: () => `Releasing unsent messages for this campaign will cause unsent messages in this campaign\
      to be removed from texter's assignments. This means that these texters will no longer be able to send\
      these messages, but these messages will become available to assign via the autoassignment\
      functionality.`,
    mutationName: 'releaseMessages'
  },
  markForSecondPass: {
    title: campaign => `Mark Unresponded to Messages in ${campaign.title} for a Second Pass`,
    body: () => `Marking unresponded to messages for this campaign will reset the state of messages that have\
      not been responded to by the contact, causing them to show up as needing a first text, as long as the campaign\
      is not past due. After running this operation, the texts will still be assigned to the same texter, so please\
      run 'Release Unsent Messages' after if you'd like these second pass messages to be available for auto-assignment.`
  },
  releaseUnrepliedMessages: {
    title: campaign => `Release Unreplied Conversations for ${campaign.title}`,
    body: () => `Releasing unreplied messages for this campaign will cause unreplied messages in this campaign\
      to be removed from texter's assignments. This means that these texters will no longer be able to respond\
      to these conversations, but these conversations will become available to assign via the autoassignment\
      functionality.`,
    mutationName: 'releaseMessages'
  }
}

class CampaignList extends React.Component {
  state ={
    inProgress: undefined,
    error: undefined,
    executing: false,
    finished: undefined
  }

  start = (operation, campaign, variables) => () => this.setState({ inProgress: [operation, campaign, variables]  })
  clearInProgress = () => this.setState({
    inProgress: undefined, 
    error: undefined, 
    executing: false,
    finished: undefined
  })

  executeOperation = () => {
    this.setState({ executing: true })
    const [operationName, campaign, variables] = this.state.inProgress

    this.props.mutations[operationName](campaign.id, variables)
      .then(resp => {
        const mutationName = operations[operationName].mutationName || operationName
        this.setState({finished: resp.data[mutationName], executing: false })
      })
      .catch(error => {
        this.setState({ error, executing: false })
      })
  }

  renderRow(campaign) {
    const {
      isStarted,
      isArchived,
      hasUnassignedContacts,
      hasUnsentInitialMessages,
      hasUnhandledMessages
    } = campaign
    const { adminPerms } = this.props


    let listItemStyle = {}
    let leftIcon = ''
    if (isArchived) {
      listItemStyle = inlineStyles.past
    } else if (!isStarted || hasUnassignedContacts) {
      listItemStyle = inlineStyles.warn
      leftIcon = <WarningIcon />
    } else if (hasUnsentInitialMessages) {
      listItemStyle = inlineStyles.warnUnsent
    } else {
      listItemStyle = inlineStyles.good
    }

    const dueByMoment = moment(campaign.dueBy)
    const creatorName = campaign.creator ? campaign.creator.displayName : null
    const tags = []
    if (!isStarted) {
      tags.push('Not started')
    }

    if (hasUnassignedContacts) {
      tags.push('Unassigned contacts')
    }

    if (isStarted && hasUnsentInitialMessages) {
      tags.push('Unsent initial messages')
    }

    if (isStarted && hasUnhandledMessages) {
      tags.push('Unhandled replies')
    }

    const primaryText = (
      <div>
        {campaign.title}
        {tags.map((tag) => <Chip key={tag} text={tag} />)}
      </div>
    )
    const secondaryText = (
      <span>
        <span>
          Campaign ID: {campaign.id}
          <br />
          {campaign.description}
          {creatorName ?
              (<span> &mdash; Created by {creatorName}</span>) : null}
          <br />
          {dueByMoment.isValid() ?
            dueByMoment.format('MMM D, YYYY') :
            'No due date set'}
        </span>
      </span>
    )


    const campaignUrl = `/admin/${this.props.organizationId}/campaigns/${campaign.id}`
    return (
      <ListItem
        {...dataTest('campaignRow')}
        style={listItemStyle}
        key={campaign.id}
        primaryText={primaryText}
        onClick={() => (!isStarted ?
          this.props.router.push(`${campaignUrl}/edit`) :
          this.props.router.push(campaignUrl))}
        secondaryText={secondaryText}
        leftIcon={leftIcon}
        rightIconButton={adminPerms && this.renderMenu(campaign)}
      />
    )
  }

  render() {
    const { inProgress, error, finished, executing } = this.state

    if (this.props.data.loading) {
      return <LoadingIndicator />
    }
    const { campaigns, currentAssignmentTarget } = this.props.data.organization
    return campaigns.length === 0 ? (
      <Empty
        title='No campaigns'
        icon={<SpeakerNotesIcon />}
      />
    ) : (
        <div>
          {inProgress && 
            <Dialog 
              title={operations[inProgress[0]].title(inProgress[1])}
              onRequestClose={this.clearInProgress} open={true}
              actions={ finished
                ? [<FlatButton label="Done" primary={true} onClick={this.clearInProgress} />]
                : [<FlatButton
                    label="Cancel"
                    primary={true}
                    disabled={executing}
                    onClick={this.clearInProgress}
                  />,
                  <FlatButton
                    label="Execute Operation"
                    primary={true}
                    onClick={this.executeOperation}
                  />]
              }
            >
              {executing
                ? <LoadingIndicator />
                : error
                  ? <span style={{color: 'red'}}> {JSON.stringify(error)} </span>
                  : finished
                    ? finished
                    : inProgress[0] === 'releaseUnrepliedMessages'
                      ? (<div>
                          {operations[inProgress[0]].body(inProgress[1])}
                          <br/>
                          <p> 
                            <label> How many hours ago should a conversation have been idle for it to be unassigned? </label> 
                            <TextField type="number" floatingLabelText="Number of Hours" defaultValue={1}
                              onChange={(ev, val) => this.setState(prevState => {
                                const nextInProgress = prevState.inProgress.slice()
                                nextInProgress[2] = { ageInHours: parseInt(val) }
                                return {
                                  inProgress: nextInProgress
                                }
                              })}
                            />
                          </p>
                        </div>)
                      : operations[inProgress[0]].body(inProgress[1])
              }
            </Dialog>
          }
          {currentAssignmentTarget &&
            <Paper style={{padding: 10}}>
              <h3> Currently Assigning {currentAssignmentTarget.type} to {currentAssignmentTarget.campaign.id}: {currentAssignmentTarget.campaign.title} </h3>
              <h4> {currentAssignmentTarget.countLeft} Left </h4>
            </Paper>
          }
          <List>
            {campaigns.campaigns.map((campaign) => this.renderRow(campaign))}
          </List>
        </div>
      )
  }

  renderMenu(campaign) {
    return (
      <IconMenu
        iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
      >
        <MenuItem primaryText="Release Unsent Messages" onClick={this.start('releaseUnsentMessages', campaign)} />
        <MenuItem primaryText="Mark for a Second Pass" onClick={this.start('markForSecondPass', campaign)} />
        <MenuItem primaryText="Release Unreplied Conversations" onClick={this.start('releaseUnrepliedMessages', campaign, { ageInHours: 1 })} />
        {!campaign.isArchived && <MenuItem primaryText="Archive Campaign" leftIcon={<ArchiveIcon />} onClick={() => this.props.mutations.archiveCampaign(campaign.id)} />}
        {campaign.isArchived && <MenuItem primaryText="Unarchive Campaign" leftIcon={<UnarchiveIcon />} onClick={() => this.props.mutations.unarchiveCampaign(campaign.id)} />}

      </IconMenu>
    )
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      dueBy: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string
    })
  ),
  router: PropTypes.object,
  adminPerms: PropTypes.bool,
  organizationId: PropTypes.string,
  data: PropTypes.object,
  mutations: PropTypes.object
}

const mapMutationsToProps = () => ({
  archiveCampaign: (campaignId) => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: (campaignId) => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  releaseUnsentMessages: (campaignId) => ({
    mutation: gql`mutation releaseUnsentMessages($campaignId: String!, $target: ReleaseActionTarget!) {
        releaseMessages(campaignId: $campaignId, target: $target)
      }`,
    variables: {
      target: 'UNSENT',
      campaignId
    }
  }),
  markForSecondPass: (campaignId) => ({
    mutation: gql`mutation markForSecondPass($campaignId: String!) {
        markForSecondPass(campaignId: $campaignId)
      }`,
    variables: { campaignId }
  }),
  releaseUnrepliedMessages: (campaignId, { ageInHours }) => ({
    mutation: gql`mutation releaseUnrepliedMessages($campaignId: String!, $target: ReleaseActionTarget!, $ageInHours: Int!) {
        releaseMessages(campaignId: $campaignId, target: $target, ageInHours: $ageInHours)
      }`,
    variables: {
      target: 'UNREPLIED',
      campaignId,
      ageInHours
    }
  })
})

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!, $campaignsFilter: CampaignsFilter) {
      organization(id: $organizationId) {
        id
        currentAssignmentTarget {
          type
          campaign {
            id
            title
          }
          countLeft
        }
        campaigns(campaignsFilter: $campaignsFilter, cursor: {offset: 0, limit: 5000}) {
          campaigns{
            ${campaignInfoFragment}
          }
        }
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter
    },
    forceFetch: true
  }
})

export default loadData(wrapMutations(
  withRouter(CampaignList)), {
    mapQueriesToProps,
    mapMutationsToProps
  })
