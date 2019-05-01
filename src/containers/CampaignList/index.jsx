import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'

import Paper from 'material-ui/Paper'
import Dialog from 'material-ui/Dialog'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import UnarchiveIcon from 'material-ui/svg-icons/content/unarchive'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'

import loadData from '../hoc/load-data'
import wrapMutations from '../hoc/wrap-mutations'
import LoadingIndicator from '../../components/LoadingIndicator'
import CampaignListLoader from './CampaignListLoader'

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

export class CampaignList extends React.Component {
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

  render() {
    const { inProgress, error, finished, executing } = this.state
    const { organizationId, pageSize, currentPageIndex, campaignsFilter, adminPerms, data, mutations, resultCountDidUpdate } = this.props
    const { currentAssignmentTarget } = data.organization
    const { archiveCampaign, unarchiveCampaign } = mutations
    return (
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
        <CampaignListLoader
          organizationId={organizationId}
          campaignsFilter={campaignsFilter}
          offset={currentPageIndex * pageSize}
          limit={pageSize}
          adminPerms={adminPerms}
          resultCountDidUpdate={resultCountDidUpdate}
          startOperation={this.start}
          archiveCampaign={archiveCampaign}
          unarchiveCampaign={unarchiveCampaign}
        />
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
  organizationId: PropTypes.string.isRequired,
  campaignsFilter: PropTypes.object.isRequired,
  pageSize: PropTypes.number.isRequired,
  currentPageIndex: PropTypes.number,
  adminPerms: PropTypes.bool.isRequired,
  router: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  mutations: PropTypes.object.isRequired,
  resultCountDidUpdate: PropTypes.func.isRequired
}

CampaignList.defaultProps = {
  currentPageIndex: 0
}

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
    query: gql`query adminGetCampaigns($organizationId: String!) {
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
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId
    },
    forceFetch: true
  }
})

export default loadData(wrapMutations(
  withRouter(CampaignList)), {
    mapQueriesToProps,
    mapMutationsToProps
  })
