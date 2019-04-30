import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'

import LoadingIndicator from '../../components/LoadingIndicator'
import CampaignList from './CampaignList'


export class CampaignListLoader extends React.Component {
  render() {
    const { organizationId, data, adminPerms, startOperation, archiveCampaign, unarchiveCampaign } = this.props

    if (data.loading) {
      return <LoadingIndicator />
    }

    const { campaigns } = data.organization.campaigns

    return (
      <CampaignList
        organizationId={organizationId}
        campaigns={campaigns}
        adminPerms={adminPerms}
        startOperation={startOperation}
        archiveCampaign={archiveCampaign}
        unarchiveCampaign={unarchiveCampaign}
      />
    )
  }
}

CampaignListLoader.defaultProps = {
  offset: 0
}

CampaignListLoader.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaignsFilter: PropTypes.object,
  offset: PropTypes.number,
  limit: PropTypes.number.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  startOperation: PropTypes.func.isRequired,
  archiveCampaign: PropTypes.func.isRequired,
  unarchiveCampaign: PropTypes.func.isRequired
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!, $campaignsFilter: CampaignsFilter, $offset: Int!, $limit: Int!) {
      organization(id: $organizationId) {
        id
        campaigns(campaignsFilter: $campaignsFilter, cursor: {offset: $offset, limit: $limit}) {
          campaigns{
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
          }
        }
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter,
      offset: ownProps.offset,
      limit: ownProps.limit
    },
    forceFetch: true
  }
})

export default connect({
  mapQueriesToProps
})(CampaignListLoader)
