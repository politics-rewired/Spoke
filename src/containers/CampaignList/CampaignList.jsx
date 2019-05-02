import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import moment from 'moment'

import { List, ListItem } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import UnarchiveIcon from 'material-ui/svg-icons/content/unarchive'

import theme from '../../styles/theme'
import Chip from '../../components/Chip'
import Empty from '../../components/Empty'
import { dataTest } from '../../lib/attributes'

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

export class CampaignList extends React.Component {
  renderMenu(campaign) {
    const { startOperation, archiveCampaign, unarchiveCampaign } = this.props
    return (
      <IconMenu iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}>
        <MenuItem primaryText="Release Unsent Messages" onClick={startOperation('releaseUnsentMessages', campaign)} />
        <MenuItem primaryText="Mark for a Second Pass" onClick={startOperation('markForSecondPass', campaign)} />
        <MenuItem primaryText="Release Unreplied Conversations" onClick={startOperation('releaseUnrepliedMessages', campaign, { ageInHours: 1 })} />
        {!campaign.isArchived && (
          <MenuItem
            primaryText="Archive Campaign"
            leftIcon={<ArchiveIcon />}
            onClick={() => archiveCampaign(campaign.id)}
          />
        )}
        {campaign.isArchived && (
          <MenuItem
            primaryText="Unarchive Campaign"
            leftIcon={<UnarchiveIcon />}
            onClick={() => unarchiveCampaign(campaign.id)}
          />
        )}
      </IconMenu>
    )
  }

  renderRow(campaign) {
    const { organizationId, adminPerms, router } = this.props
    const {
      isStarted,
      isArchived,
      isAutoassignEnabled,
      hasUnassignedContacts,
      hasUnsentInitialMessages,
      hasUnhandledMessages
    } = campaign

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

    if (isStarted && !isArchived && isAutoassignEnabled) {
      tags.push('Autoassign eligible')
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
          {creatorName ? (
            <span> &mdash; Created by {creatorName}</span>
          ) : null}
          <br />
          {dueByMoment.isValid() ?
            dueByMoment.format('MMM D, YYYY') :
            'No due date set'}
        </span>
      </span>
    )


    const campaignUrl = `/admin/${organizationId}/campaigns/${campaign.id}${isStarted ? '': '/edit'}`
    return (
      <ListItem
        {...dataTest('campaignRow')}
        style={listItemStyle}
        key={campaign.id}
        primaryText={primaryText}
        onClick={() => router.push(campaignUrl)}
        secondaryText={secondaryText}
        leftIcon={leftIcon}
        rightIconButton={adminPerms && this.renderMenu(campaign)}
      />
    )
  }

  render() {
    const { campaigns } = this.props

    if (campaigns.length === 0) {
      return (
        <Empty
          title='No campaigns'
          icon={<SpeakerNotesIcon />}
        />
      )
    }

    return (
      <List>
        {campaigns.map(campaign => this.renderRow(campaign))}
      </List>
    )
  }
}

const campaignShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  dueBy: PropTypes.string,
})

CampaignList.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaigns: PropTypes.arrayOf(campaignShape).isRequired,
  adminPerms: PropTypes.bool.isRequired,
  router: PropTypes.object.isRequired,
  startOperation: PropTypes.func.isRequired,
  archiveCampaign: PropTypes.func.isRequired,
  unarchiveCampaign: PropTypes.func.isRequired
}

export default withRouter(CampaignList)
