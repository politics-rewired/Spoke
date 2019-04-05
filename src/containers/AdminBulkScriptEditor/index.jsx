import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import Toggle from 'material-ui/Toggle'
import RaisedButton from 'material-ui/RaisedButton'

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
    searchText: '',
    replaceText: '',
    includeArchived: true,
    campaignPrefixes: []
  }

  handleChangeSearchText = (_event, searchText) => {
    this.setState({ searchText })
  }

  handleChangeReplaceText = (_event, replaceText) => {
    this.setState({ replaceText })
  }

  handleToggleIncludeArchived = (_event, includeArchived) => {
    this.setState({ includeArchived })
  }

  handleCampaignPrefixChange = (campaignPrefixes) => {
    this.setState({ campaignPrefixes })
  }

  handleSubmitJob = () => {
    this.setState({ isSubmitting: true })
  }

  render() {
    const { isSubmitting, searchText, replaceText, includeArchived, campaignPrefixes } = this.state
    const isSubmitDisabled = isSubmitting || !searchText
    return (
      <div>
        <h1>Bulk Script Editor</h1>
        <Paper style={styles.paddedPaper}>
          <p style={styles.bold}>Find and replace</p>
          <TextField
            hintText="Replace this text..."
            value={searchText}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeSearchText}
          />
          <TextField
            hintText="...with this text"
            value={replaceText}
            fullWidth
            disabled={isSubmitting}
            onChange={this.handleChangeReplaceText}
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
            value={campaignPrefixes}
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
      </div>
    )
  }
}

export default AdminBulkScriptEditor
