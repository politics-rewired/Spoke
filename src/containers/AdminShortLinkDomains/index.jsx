import React, { Component } from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'

import FloatingActionButton from 'material-ui/FloatingActionButton'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import ContentAdd from 'material-ui/svg-icons/content/add'

import theme from '../../styles/theme'
import LoadingIndicator from '../../components/LoadingIndicator'

import ShortLinkDomainList from './ShortLinkDomainList'

class AdminShortLinkDomains extends Component {
  state = {
    disabledDomainIds: [],
    webRequestError: undefined
  }

  handleManualDisableToggle = async (domainId, isManuallyDisabled) => {
    this.setState({
      disabledDomainIds: this.state.disabledDomainIds.concat([domainId])
    })
    try {
      const response = await this.props.mutations.setDomainManuallyDisabled(domainId, isManuallyDisabled)
      if (response.errors) throw new Error(response.errors)
    } catch (exc) {
      this.setState({ webRequestError: exc })
    } finally {
      this.setState({
        disabledDomainIds: this.state.disabledDomainIds.filter(disabledId => disabledId !== domainId)
      })
    }
  }

  handleErrorDialogClose = () => this.setState({ webRequestError: undefined })

  render() {
    const { shortLinkDomains } = this.props
    const { disabledDomainIds, webRequestError } = this.state

    if (shortLinkDomains.loading) {
      return <LoadingIndicator />
    }

    if (shortLinkDomains.errors) {
      return <p>{shortLinkDomains.errors}</p>
    }

    const { linkDomains } = shortLinkDomains.organization

    const errorActions = [
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.handleErrorDialogClose}
      />
    ]

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
        {webRequestError && (
          <Dialog
            title="Error Completing Request"
            actions={errorActions}
            modal={false}
            open={true}
            onRequestClose={this.handleErrorDialogClose}
          >
            {webRequestError.message}
          </Dialog>
        )}
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
  setDomainManuallyDisabled: (domainId, isManuallyDisabled) => ({
    mutation: gql`
      mutation setDomainManuallyDisabled($organizationId: String!, $domainId: String!, $payload: UpdateLinkDomain!) {
        updateLinkDomain(organizationId: $organizationId, domainId: $domainId, payload: $payload) {
          id,
          isManuallyDisabled
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      domainId,
      payload: {
        isManuallyDisabled
      }
    }
  })
})

export default connect({
  mapQueriesToProps,
  mapMutationsToProps
})(AdminShortLinkDomains)
