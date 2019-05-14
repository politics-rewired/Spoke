import React, { Component } from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'

import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'

import theme from '../../styles/theme'
import LoadingIndicator from '../../components/LoadingIndicator'

import ShortLinkDomainList from './ShortLinkDomainList'

class AdminShortLinkDomains extends Component {
  state = {
    disabledDomainIds: []
  }

  handleManualDisableToggle = (domainId, value) => {
    this.setState({
      disabledDomainIds: this.state.disabledDomainIds.concat([domainId])
    })
    // simulate mutation
    console.log(`sending request... ${domainId}, ${value}`)
    setTimeout(() => {
      this.setState({
        disabledDomainIds: this.state.disabledDomainIds.filter(disabledId => disabledId !== domainId)
      })
    }, 2000)
  }

  render() {
    const { shortLinkDomains } = this.props
    const { disabledDomainIds } = this.state

    if (shortLinkDomains.loading) {
      return <LoadingIndicator />
    }

    if (shortLinkDomains.errors) {
      return <p>{shortLinkDomains.errors}</p>
    }

    const { linkDomains } = shortLinkDomains.organization

    return (
      <div>
        <ShortLinkDomainList
          domains={linkDomains}
          disabledDomainIds={disabledDomainIds}
          onManualDisableToggle={this.handleManualDisableToggle}
        />
        <FloatingActionButton
          style={theme.components.floatingButton}
          onClick={console.log}
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    )
  }
}

AdminShortLinkDomains.propTypes = {
  params: PropTypes.object,
  shortLinkDomains: PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  shortLinkDomains: {
    query: gql`query getShortLinkDomains($organizationId: String!) {
      organization(id: $organizationId) {
        id
        linkDomains {
          id
          domain
          maxUsageCount
          currentUsageCount
          isManuallyDisabled
          isHealthy
          cycledOutAt
          createdAt
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  },
})

const mapMutationsToProps = ({ ownProps }) => ({
  bulkUpdateScript: (findAndReplace) => ({
    mutation: gql`
      mutation bulkUpdateScript($organizationId: String!, $findAndReplace: BulkUpdateScriptInput!) {
        bulkUpdateScript(organizationId: $organizationId, findAndReplace: $findAndReplace) {
          campaignId
          found
          replaced
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      findAndReplace
    }
  })
})

export default connect({
  mapQueriesToProps,
  mapMutationsToProps
})(AdminShortLinkDomains)
