import React, { Component } from 'react'
import type from "prop-types";

import Select from 'react-select'
import { Card, CardHeader, CardText } from "material-ui/Card";
import Dialog from "material-ui/Dialog"
import { getHighestRole } from "../lib/permissions";
import FlatButton from "material-ui/FlatButton";
import { css, StyleSheet } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  flexColumn: {
    flex: 0,
    flexBasis: '30%',
    display: 'flex'
  },
  spacer: {
    marginRight: '30px'
  }
})

class IncomingMessageActions extends Component {
  state = {
    selectedTexters: [],
    confirmDialogOpen: false
  }

  onReassignmentClicked = () => {
    const { selectedTexters } = this.state
    const texterIds = selectedTexters.map(texter => texter.value)
    this.props.onReassignRequested(texterIds)
  }

  onReassignAllMatchingClicked = () => {
    this.setState({confirmDialogOpen: true})
  }

  handleTextersChanged = (selectedTexters) => {
    this.setState({ selectedTexters })
  }

  handleConfirmDialogCancel = () => {
    this.setState({confirmDialogOpen: false})
  }

  handleConfirmDialogReassign = () => {
    this.setState({confirmDialogOpen: false})
    const { selectedTexters } = this.state
    const texterIds = selectedTexters.map(texter => texter.value)
    this.props.onReassignAllMatchingRequested(texterIds)
  }

  render() {
    let texters = this.props.people || []
    texters = texters.map(texter => ({
      value: parseInt(texter.id, 10),
      label: texter.displayName + ' ' + getHighestRole(texter.roles)
    }))

    const confirmDialogActions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleConfirmDialogCancel}
      />,
      <FlatButton
        label="Reassign"
        primary={true}
        onClick={this.handleConfirmDialogReassign}
      />
    ]

    const { selectedTexters } = this.state
    const hasSeletedTexters = selectedTexters.length > 0
    return (
      <Card>
        <CardHeader
          title={' Message Actions '}
          actAsExpander
          showExpandableButton
        />
        <CardText expandable>
          <div>
            <p>
              In order to do a second pass on contacts who haven't responded,
              select a batch of contacts based on a Contact message status of
              "First Message Sent", which means they've been sent a message,
              but haven't replied.
            </p>
            <p>
              Once you have the batch selected, first reassign them to another
              texter by clicking Reassign Selected, and then click "Reset Message
              Status". The selected messages will now have a status of "Needs First Message",
              which means that they will show up in the texter view as needing a message.
            </p>
            <p>
              Then, change the first message in the campaign script to reflect that you're
              texting them a second time!
            </p>
            <p>
              <Select
                onChange={this.handleTextersChanged}
                options={texters}
                isMulti
                placeholder="Select at least one texter"
              />
            </p>
          </div>
          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <FlatButton
                label={'Reassign selected'}
                onClick={this.onReassignmentClicked}
                disabled={!hasSeletedTexters}
              />
            </div>
            {this.props.conversationCount ? (
              <div className={css(styles.flexColumn)}>
                <FlatButton
                  label={`Reassign all ${this.props.conversationCount} matching`}
                  onClick={this.onReassignAllMatchingClicked}
                  disabled={!hasSeletedTexters}
                />
              </div>) : ''
            }
            <Dialog
              actions={confirmDialogActions}
              open={this.state.confirmDialogOpen}
              modal={true}
              onRequestClose={this.handleConfirmDialogCancel}
            >
              {
                `Reassign all ${this.props.conversationCount} matching conversations?`
              }
            </Dialog>
          </div>
          {/* <br/>
          <div>
            <FlatButton
              label="Reset Message Status"
              primary={true}
              onClick={this.props.markForSecondPass}
              disabled={!this.props.contactsAreSelected}
            />
          </div> */}
        </CardText>
      </Card>
    )
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  conversationCount: type.number
}

export default IncomingMessageActions
