import React, { Component } from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'

import FloatingActionButton from 'material-ui/FloatingActionButton'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import ContentAddIcon from 'material-ui/svg-icons/content/add'
import CloudUploadIcon from 'material-ui/svg-icons/file/cloud-upload'

import theme from '../../styles/theme'
import LoadingIndicator from '../../components/LoadingIndicator'

import ShortLinkDomainList from './ShortLinkDomainList'
import AddDomainDialog from './AddDomainDialog'

class AdminShortLinkDomains extends Component {
  state = {
    disabledDomainIds: [],
    webRequestError: undefined,
    showAddDomainDialog: false,
    addDomainIsWorking: false
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

  handleAddDomainClick = () => this.setState({ showAddDomainDialog: true })
  handleAddDomainDialogClose = () => this.setState({ showAddDomainDialog: false })

  handleAddDomain = async (domain, maxUsageCount) => {
    this.setState({ showAddDomainDialog: false, addDomainIsWorking: true })
    try {
      const response = await this.props.mutations.insertLinkDomain(domain, maxUsageCount)
      if (response.errors) throw new Error(response.errors)
      await this.props.shortLinkDomains.refetch()
    } catch (exc) {
      this.setState({ webRequestError: exc })
    } finally {
      this.setState({ addDomainIsWorking: false })
    }
  }

  handleDeleteDomain = async domainId => {
    this.setState({
      disabledDomainIds: this.state.disabledDomainIds.concat([domainId])
    })
    try {
      const response = await this.props.mutations.deleteLinkDomain(domainId)
      if (response.errors) throw new Error(response.errors)
      await this.props.shortLinkDomains.refetch()
    } catch (exc) {
      this.setState({ webRequestError: exc })
    } finally {
      this.setState({
        disabledDomainIds: this.state.disabledDomainIds.filter(disabledId => disabledId !== domainId)
      })
    }
  }

  render() {
    const { shortLinkDomains } = this.props
    const { disabledDomainIds, webRequestError, showAddDomainDialog, addDomainIsWorking } = this.state

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
          onDeleteDomain={this.handleDeleteDomain}
        />
        <FloatingActionButton
          style={theme.components.floatingButton}
          disabled={addDomainIsWorking}
          onClick={this.handleAddDomainClick}
        >
          {addDomainIsWorking
            ? <CloudUploadIcon />
            : <ContentAddIcon />}
        </FloatingActionButton>
        <AddDomainDialog
          open={showAddDomainDialog}
          onRequestClose={this.handleAddDomainDialogClose}
          onAddNewDomain={this.handleAddDomain}
        />
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
  insertLinkDomain: (domain, maxUsageCount) => ({
    mutation: gql`
      mutation insertLinkDomain($organizationId: String!, $domain: String!, $maxUsageCount: Int!) {
        insertLinkDomain(organizationId: $organizationId, domain: $domain, maxUsageCount: $maxUsageCount) {
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
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      domain,
      maxUsageCount,
    }
  }),
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
  }),
  deleteLinkDomain: (domainId) => ({
    mutation: gql`
      mutation deleteLinkDomain($organizationId: String!, $domainId: String!) {
        deleteLinkDomain(organizationId: $organizationId, domainId: $domainId)
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      domainId
    }
  })
})

export default connect({
  mapQueriesToProps,
  mapMutationsToProps
})(AdminShortLinkDomains)
