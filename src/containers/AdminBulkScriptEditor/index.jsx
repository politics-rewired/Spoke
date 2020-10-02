import React, { Component } from "react";
import gql from "graphql-tag";
import pick from "lodash/pick";

import Paper from "material-ui/Paper";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";

import {
  formatErrorMessage,
  PrettyErrors,
  withOperations
} from "../hoc/with-operations";
import CampaignPrefixSelector from "./CampaignPrefixSelector";

const PROTECTED_CHARACTERS = ["/"];

const styles = {
  bold: {
    fontWeight: "bold"
  },
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
      character => searchString.indexOf(character) > -1
    );
    this.setState({ searchString, flaggedCharacters });
  };

  handleChangeReplaceString = (_event, replaceString) => {
    this.setState({ replaceString });
  };

  handleToggleIncludeArchived = (_event, includeArchived) => {
    this.setState({ includeArchived });
  };

  handleCampaignPrefixChange = campaignTitlePrefixes => {
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
      prefix => prefix.value
    );
    try {
      const response = await this.props.mutations.bulkUpdateScript(
        findAndReplace
      );
      if (response.errors) {
        return <PrettyErrors errors={response.errors} />;
      }
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
      <FlatButton label="Cancel" onClick={this.handleClose} />,
      <FlatButton
        label="Confirm"
        primary={true}
        onClick={this.handleConfirmSubmit}
      />
    ];

    const dialogActions = [
      <FlatButton label="OK" primary={true} onClick={this.handleClose} />
    ];

    return (
      <div>
        <h1>Bulk Script Editor</h1>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Find and replace</p>
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
              {flaggedCharacters.map(char => (
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
          <p style={styles.bold}>Filter campaigns</p>
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
        <RaisedButton
          label={isSubmitting ? "Working..." : "Find & replace"}
          primary={true}
          disabled={isSubmitDisabled}
          onClick={this.handleSubmitJob}
        />
        {confirmFlaggedCharacters && (
          <Dialog
            title="Confirm Flagged Characters"
            actions={flaggedCharacterActions}
            open
            onRequestClose={this.handleClose}
          >
            <p>
              Are you sure you want to run run a bulk script update with special
              characters?
            </p>
            <p>
              If you don't know what this means, you should cancel and ask an
              admin!
            </p>
          </Dialog>
        )}
        {this.state.error && (
          <Dialog
            title="Error"
            actions={dialogActions}
            open
            onRequestClose={this.handleClose}
          >
            <p>
              Spoke ran into the following error when trying to update scripts:
            </p>
            <p style={{ fontFamily: "monospace" }}>{this.state.error}</p>
          </Dialog>
        )}
        {this.state.result !== null && (
          <Dialog
            title={`Updated ${this.state.result.length} Occurence(s)`}
            actions={dialogActions}
            modal={false}
            open
            autoScrollBodyContent
            contentStyle={{
              width: "100%",
              maxWidth: "none"
            }}
            onRequestClose={this.handleClose}
          >
            <ul>
              {this.state.result.map((replacedText, index) => (
                <li key={index}>
                  Campaign ID: {replacedText.campaignId}
                  <br />
                  Found: <span style={styles.code}>{replacedText.found}</span>
                  <br />
                  Replaced with:{" "}
                  <span style={styles.code}>{replacedText.replaced}</span>
                </li>
              ))}
            </ul>
            {this.state.result.length === 0 && (
              <p>
                No occurences were found. Check your search parameters and try
                again.
              </p>
            )}
          </Dialog>
        )}
      </div>
    );
  }
}

const mutations = {
  bulkUpdateScript: ownProps => findAndReplace => ({
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
