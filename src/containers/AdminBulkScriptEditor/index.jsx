import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import pick from "lodash/pick";
import Paper from "material-ui/Paper";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import React, { Component } from "react";

import { formatErrorMessage, withOperations } from "../hoc/with-operations";
import CampaignPrefixSelector from "./CampaignPrefixSelector";

const PROTECTED_CHARACTERS = ["/"];

const styles = {
  paddedPaper: {
    padding: "10px",
    marginBottom: "15px"
  },
  code: {
    color: "#000000",
    backgroundColor: "#DDDDDD",
    fontFamily: "monospace",
    fontSize: "1.2em",
    fontStyle: "normal",
    padding: "2px 5px",
    borderRadius: "3px"
  }
};

class AdminBulkScriptEditor extends Component {
  state = {
    isSubmitting: false,
    error: "",
    result: null,
    flaggedCharacters: [],
    confirmFlaggedCharacters: false,
    searchString: "",
    replaceString: "",
    includeArchived: true,
    campaignTitlePrefixes: []
  };

  handleChangeSearchString = (_event, searchString) => {
    const flaggedCharacters = PROTECTED_CHARACTERS.filter(
      (character) => searchString.indexOf(character) > -1
    );
    this.setState({ searchString, flaggedCharacters });
  };

  handleChangeReplaceString = (_event, replaceString) => {
    this.setState({ replaceString });
  };

  handleToggleIncludeArchived = (_event, includeArchived) => {
    this.setState({ includeArchived });
  };

  handleCampaignPrefixChange = (campaignTitlePrefixes) => {
    this.setState({ campaignTitlePrefixes });
  };

  handleSubmitJob = async () => {
    const { flaggedCharacters } = this.state;
    if (flaggedCharacters.length > 0) {
      this.setState({ confirmFlaggedCharacters: true });
    } else {
      this.submitJob();
    }
  };

  handleConfirmSubmit = () => {
    this.setState({ confirmFlaggedCharacters: false });
    this.submitJob();
  };

  submitJob = async () => {
    this.setState({ isSubmitting: true });
    const findAndReplace = pick(this.state, [
      "searchString",
      "replaceString",
      "includeArchived",
      "campaignTitlePrefixes"
    ]);
    findAndReplace.campaignTitlePrefixes = findAndReplace.campaignTitlePrefixes.map(
      (prefix) => prefix.value
    );
    try {
      const response = await this.props.mutations.bulkUpdateScript(
        findAndReplace
      );
      if (response.errors) throw response.errors;
      this.setState({ result: response.data.bulkUpdateScript });
    } catch (error) {
      this.setState({ error: formatErrorMessage(error.message) });
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleClose = () => {
    this.setState({
      confirmFlaggedCharacters: false,
      error: "",
      result: null
    });
  };

  render() {
    const {
      isSubmitting,
      searchString,
      flaggedCharacters,
      confirmFlaggedCharacters,
      replaceString,
      includeArchived,
      campaignTitlePrefixes
    } = this.state;
    const isSubmitDisabled = isSubmitting || !searchString;

    const flaggedCharacterActions = [
      <Button key="cancel" onClick={this.handleClose}>
        Cancel
      </Button>,
      <Button key="confirm" color="primary" onClick={this.handleConfirmSubmit}>
        Confirm
      </Button>
    ];

    const dialogActions = [
      <Button key="ok" color="primary" onClick={this.handleClose}>
        OK
      </Button>
    ];

    return (
      <div>
        <h1>Bulk Script Editor</h1>
        <Paper style={styles.paddedPaper}>
          <p>Find and replace</p>
          <TextField
            hintText="Replace this text..."
            value={searchString}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeSearchString}
          />
          {flaggedCharacters.length > 0 && (
            <p style={{ color: "#FFAA00" }}>
              Warning: Your search text contains the following special
              characters:{" "}
              {flaggedCharacters.map((char) => (
                <span key={char} style={styles.code}>
                  {char}
                </span>
              ))}{" "}
              Be careful with this!
            </p>
          )}
          <TextField
            hintText="...with this text"
            value={replaceString}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeReplaceString}
          />
          <p style={{ fontStyle: "italic" }}>
            Note: the text must be an exact match! For example, there a couple
            apostraphe characters: <span style={styles.code}>'</span> vs{" "}
            <span style={styles.code}>’</span> )
          </p>
        </Paper>
        <Paper style={styles.paddedPaper}>
          <p>Filter campaigns</p>
          <Toggle
            label="Include archived campaigns"
            style={{ marginBottom: "25px" }}
            toggled={includeArchived}
            disabled={isSubmitting}
            onToggle={this.handleToggleIncludeArchived}
          />
          <p>Restrict to campaigns beginning with text (optional):</p>
          <CampaignPrefixSelector
            value={campaignTitlePrefixes}
            isDisabled={isSubmitting}
            onChange={this.handleCampaignPrefixChange}
          />
        </Paper>
        <Button
          variant="contained"
          color="primary"
          disabled={isSubmitDisabled}
          onClick={this.handleSubmitJob}
        >
          {isSubmitting ? "Working..." : "Find & replace"}
        </Button>
        {confirmFlaggedCharacters && (
          <Dialog open onClose={this.handleClose}>
            <DialogTitle>Confirm Flagged Characters</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to run a bulk script update with special
                characters?
              </DialogContentText>
              <DialogContentText>
                If you don't know what this means, you should cancel and ask an
                admin!
              </DialogContentText>
            </DialogContent>
            <DialogActions>{flaggedCharacterActions}</DialogActions>
          </Dialog>
        )}
        {this.state.error && (
          <Dialog open onClose={this.handleClose}>
            <DialogTitle>Error</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Spoke ran into the following error when trying to update
                scripts:
              </DialogContentText>
              <p style={{ fontFamily: "monospace" }}>{this.state.error}</p>
            </DialogContent>
            <DialogActions>{dialogActions}</DialogActions>
          </Dialog>
        )}
        {this.state.result !== null && (
          <Dialog
            open
            scroll="paper"
            fullWidth
            maxWidth="xl"
            onClose={this.handleClose}
          >
            <DialogTitle>{`Updated ${this.state.result.length} Occurence(s)`}</DialogTitle>
            <DialogContent>
              <ul>
                {this.state.result.map(({ campaignId, found, replaced }) => (
                  <li key={`${campaignId}|${found}|${replaced}`}>
                    Campaign ID: {campaignId}
                    <br />
                    Found: <span style={styles.code}>{found}</span>
                    <br />
                    Replaced with: <span style={styles.code}>{replaced}</span>
                  </li>
                ))}
              </ul>
              {this.state.result.length === 0 && (
                <DialogContentText>
                  No occurences were found. Check your search parameters and try
                  again.
                </DialogContentText>
              )}
            </DialogContent>
            <DialogActions>{dialogActions}</DialogActions>
          </Dialog>
        )}
      </div>
    );
  }
}

const mutations = {
  bulkUpdateScript: (ownProps) => (findAndReplace) => ({
    mutation: gql`
      mutation bulkUpdateScript(
        $organizationId: String!
        $findAndReplace: BulkUpdateScriptInput!
      ) {
        bulkUpdateScript(
          organizationId: $organizationId
          findAndReplace: $findAndReplace
        ) {
          campaignId
          found
          replaced
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      findAndReplace
    }
  })
};

export default withOperations({
  mutations
})(AdminBulkScriptEditor);
