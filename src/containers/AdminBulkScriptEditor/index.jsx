import React, { Component } from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import Toggle from 'material-ui/Toggle'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import pick from 'lodash/pick'

import CampaignPrefixSelector from './CampaignPrefixSelector'

const styles = {
  bold: {
    fontWeight: 'bold'
  },
  paddedPaper: {
    padding: '10px',
    marginBottom: '15px'
  },
  code: {
    backgroundColor: '#DDDDDD',
    fontFamily: 'monospace',
    fontSize: '1.2em',
    fontStyle: 'normal',
    padding: '2px 5px',
    borderRadius: '3px'
  }
}

class AdminBulkScriptEditor extends Component {
  state = {
    isSubmitting: false,
    error: '',
    result: null,
    searchString: '',
    replaceString: '',
    includeArchived: true,
    campaignTitlePrefixes: []
  }

  handleChangeSearchString = (_event, searchString) => {
    this.setState({ searchString })
  }

  handleChangeReplaceString = (_event, replaceString) => {
    this.setState({ replaceString })
  }

  handleToggleIncludeArchived = (_event, includeArchived) => {
    this.setState({ includeArchived })
  }

  handleCampaignPrefixChange = (campaignTitlePrefixes) => {
    this.setState({ campaignTitlePrefixes })
  }

  handleSubmitJob = async () => {
    this.setState({ isSubmitting: true })
    const findAndReplace = pick(this.state, ['searchString', 'replaceString', 'includeArchived', 'campaignTitlePrefixes'])
    try {
      const response = await this.props.mutations.bulkUpdateScript(findAndReplace)
      if (response.errors) throw response.errors
      this.setState({ result: response.data.bulkUpdateScript })
    } catch (error) {
      this.setState({ error: error.message })
    } finally {
      this.setState({ isSubmitting: false })
    }
  }

  handleClose = () => {
    this.setState({ error: '', result: null })
  }

  render() {
    const { isSubmitting, searchString, replaceString, includeArchived, campaignTitlePrefixes } = this.state
    const isSubmitDisabled = isSubmitting || !searchString

    const dialogActions = [
      <FlatButton
        label="OK"
        primary={true}
        onClick={this.handleClose}
      />
    ]

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
          <TextField
            hintText="...with this text"
            value={replaceString}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeReplaceString}
          />
          <p style={{fontStyle: 'italic'}}>Note: the text must be an exact match! For example, there a couple apostraphe characters: {' '}
            <span style={styles.code}>'</span> vs <span style={styles.code}>’</span> )
          </p>
        </Paper>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Filter campaigns</p>
          <Toggle
            label="Include archived campaigns"
            style={{marginBottom: '25px'}}
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
          label={isSubmitting ? 'Working...' : 'Find & replace'}
          primary={true}
          disabled={isSubmitDisabled}
          onClick={this.handleSubmitJob}
        />
        {this.state.error && (
          <Dialog
            title="Error"
            actions={dialogActions}
            open
            onRequestClose={this.handleClose}
          >
            <p>Spoke ran into the following error when trying to update scripts:</p>
            <p style={{ fontFamily: 'monospace' }}>{this.state.error}</p>
          </Dialog>
        )}
        {this.state.result !== null && (
          <Dialog
            title={`Updated ${this.state.result.length} Occurence(s)`}
            actions={dialogActions}
            modal={false}
            open
            autoScrollBodyContent
            onRequestClose={this.handleClose}
          >
            <ul>
              {this.state.result.map((replacedText, index) => (
                <li key={index}>
                  Campaign ID: {replacedText.campaignId}<br />
                  Found: {replacedText.found}<br />
                  Replaced with: {replacedText.replaced}
                </li>
              ))}
            </ul>
            {this.state.result.length === 0 && (
              <p>No occurences were found. Check your search parameters and try again.</p>
            )}
          </Dialog>
        )}
      </div>
    )
  }
}

const mapMutationsToProps = ({ ownProps }) => ({
  bulkUpdateScript: (findAndReplace) => ({
    mutation: gql`
      mutation bulkUpdateScript($organizationId: String!, $findAndReplace: BulkUpdateScriptInput!) {
        bulkUpdateScript(organizationId: $organizationId, findAndReplace: $findAndReplace) {
          campaignId
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
  mapMutationsToProps
})(AdminBulkScriptEditor)
