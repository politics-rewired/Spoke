import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import PropTypes from "prop-types";
import React, { Component } from "react";

import LoadingIndicator from "../../components/LoadingIndicator";
import theme from "../../styles/theme";
import { PrettyErrors, withOperations } from "../hoc/with-operations";
import AddDomainDialog from "./components/AddDomainDialog";
import ShortLinkDomainList from "./components/ShortLinkDomainList";

class AdminShortLinkDomains extends Component {
  state = {
    disabledDomainIds: [],
    webRequestError: undefined,
    showAddDomainDialog: false,
    addDomainIsWorking: false,
    warnDeleteDomainId: undefined
  };

  handleManualDisableToggle = async (domainId, isManuallyDisabled) => {
    this.setState({
      disabledDomainIds: this.state.disabledDomainIds.concat([domainId])
    });
    try {
      const response = await this.props.mutations.setDomainManuallyDisabled(
        domainId,
        isManuallyDisabled
      );
      if (response.errors) throw new Error(response.errors);
    } catch (exc) {
      this.setState({ webRequestError: exc });
    } finally {
      this.setState({
        disabledDomainIds: this.state.disabledDomainIds.filter(
          (disabledId) => disabledId !== domainId
        )
      });
    }
  };

  handleErrorDialogClose = () => this.setState({ webRequestError: undefined });

  handleAddDomainClick = () => this.setState({ showAddDomainDialog: true });

  handleAddDomainDialogClose = () =>
    this.setState({ showAddDomainDialog: false });

  handleAddDomain = async (domain, maxUsageCount) => {
    this.setState({ showAddDomainDialog: false, addDomainIsWorking: true });
    try {
      const response = await this.props.mutations.insertLinkDomain(
        domain,
        maxUsageCount
      );
      if (response.errors) throw new Error(response.errors);
      await this.props.shortLinkDomains.refetch();
    } catch (exc) {
      this.setState({ webRequestError: exc });
    } finally {
      this.setState({ addDomainIsWorking: false });
    }
  };

  handleConfirmDeleteDomain = (warnDeleteDomainId) =>
    this.setState({ warnDeleteDomainId });

  handleCancelDeleteDomain = () =>
    this.setState({ warnDeleteDomainId: undefined });

  handleDeleteDomain = async () => {
    const { warnDeleteDomainId: domainId } = this.state;
    this.setState({
      disabledDomainIds: this.state.disabledDomainIds.concat([domainId]),
      warnDeleteDomainId: undefined
    });
    try {
      const response = await this.props.mutations.deleteLinkDomain(domainId);
      if (response.errors) throw new Error(response.errors);
      await this.props.shortLinkDomains.refetch();
    } catch (exc) {
      this.setState({ webRequestError: exc });
    } finally {
      this.setState({
        disabledDomainIds: this.state.disabledDomainIds.filter(
          (disabledId) => disabledId !== domainId
        )
      });
    }
  };

  render() {
    const { shortLinkDomains } = this.props;
    const {
      disabledDomainIds,
      webRequestError,
      showAddDomainDialog,
      addDomainIsWorking,
      warnDeleteDomainId
    } = this.state;

    if (shortLinkDomains.loading) {
      return <LoadingIndicator />;
    }

    if (shortLinkDomains.errors) {
      return <PrettyErrors errors={shortLinkDomains.errors} />;
    }

    const { linkDomains } = shortLinkDomains.organization;
    const warnDomainName =
      warnDeleteDomainId &&
      linkDomains.filter((domain) => domain.id === warnDeleteDomainId)[0]
        .domain;

    const deleteDomainActions = [
      <Button key="cancel" onClick={this.handleCancelDeleteDomain}>
        Cancel
      </Button>,
      <Button
        key="delete"
        variant="contained"
        color="primary"
        onClick={this.handleDeleteDomain}
      >
        Delete
      </Button>
    ];

    const errorActions = [
      <Button key="close" color="primary" onClick={this.handleErrorDialogClose}>
        Close
      </Button>
    ];

    return (
      <div>
        <ShortLinkDomainList
          domains={linkDomains}
          disabledDomainIds={disabledDomainIds}
          onManualDisableToggle={this.handleManualDisableToggle}
          onDeleteDomain={this.handleConfirmDeleteDomain}
        />
        <Fab
          color="primary"
          style={theme.components.floatingButton}
          disabled={addDomainIsWorking}
          onClick={this.handleAddDomainClick}
        >
          {addDomainIsWorking ? <CloudUploadIcon /> : <AddIcon />}
        </Fab>
        <AddDomainDialog
          open={showAddDomainDialog}
          onRequestClose={this.handleAddDomainDialogClose}
          onAddNewDomain={this.handleAddDomain}
        />
        {warnDomainName && (
          <Dialog open onClose={this.handleCancelDeleteDomain}>
            <DialogTitle>Confirm Delete Domain</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete the short link domain{" "}
                <span style={{ color: "#000000" }}>{warnDomainName}</span>?
              </DialogContentText>
            </DialogContent>
            <DialogActions>{deleteDomainActions}</DialogActions>
          </Dialog>
        )}
        {webRequestError && (
          <Dialog open onClose={this.handleErrorDialogClose}>
            <DialogTitle>Error Completing Request</DialogTitle>
            <DialogContent>
              <DialogContentText>{webRequestError.message}</DialogContentText>
            </DialogContent>
            <DialogActions>{errorActions}</DialogActions>
          </Dialog>
        )}
      </div>
    );
  }
}

AdminShortLinkDomains.propTypes = {
  match: PropTypes.object.isRequired,
  shortLinkDomains: PropTypes.object.isRequired,
  mutations: PropTypes.shape({
    insertLinkDomain: PropTypes.func.isRequired,
    setDomainManuallyDisabled: PropTypes.func.isRequired,
    deleteLinkDomain: PropTypes.func.isRequired
  }).isRequired
};

const queries = {
  shortLinkDomains: {
    query: gql`
      query getShortLinkDomains($organizationId: String!) {
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
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      },
      fetchPolicy: "cache-and-network"
    })
  }
};

const mutations = {
  insertLinkDomain: (ownProps) => (domain, maxUsageCount) => ({
    mutation: gql`
      mutation insertLinkDomain(
        $organizationId: String!
        $domain: String!
        $maxUsageCount: Int!
      ) {
        insertLinkDomain(
          organizationId: $organizationId
          domain: $domain
          maxUsageCount: $maxUsageCount
        ) {
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
      organizationId: ownProps.match.params.organizationId,
      domain,
      maxUsageCount
    }
  }),
  setDomainManuallyDisabled: (ownProps) => (domainId, isManuallyDisabled) => ({
    mutation: gql`
      mutation setDomainManuallyDisabled(
        $organizationId: String!
        $domainId: String!
        $payload: UpdateLinkDomain!
      ) {
        updateLinkDomain(
          organizationId: $organizationId
          domainId: $domainId
          payload: $payload
        ) {
          id
          isManuallyDisabled
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      domainId,
      payload: {
        isManuallyDisabled
      }
    }
  }),
  deleteLinkDomain: (ownProps) => (domainId) => ({
    mutation: gql`
      mutation deleteLinkDomain($organizationId: String!, $domainId: String!) {
        deleteLinkDomain(organizationId: $organizationId, domainId: $domainId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      domainId
    }
  })
};

export default withOperations({
  queries,
  mutations
})(AdminShortLinkDomains);
