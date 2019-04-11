import React, { Component } from 'react'
import type from "prop-types";

import Select from 'react-select'
import { Card, CardHeader, CardText } from "material-ui/Card";
import {Tabs, Tab} from 'material-ui/Tabs';
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

  onUnassignClicked = () => {
    this.props.onUnassignRequested()
  }

  onReassignAllMatchingClicked = () => {
    this.setState({confirmDialogOpen: 'reassign'})
  }

  onUnassignAllMatchingClicked = () => {
    this.setState({confirmDialogOpen: 'unassign'})
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

  handleConfirmDialogUnassign = () => {
    this.setState({confirmDialogOpen: false})
    this.props.onUnassignAllMatchingRequested()
  }

  render() {
    let texters = this.props.people || []
    texters = texters.map(texter => ({
      value: parseInt(texter.id, 10),
      label: texter.displayName + ' ' + getHighestRole(texter.roles)
    }))

    const confirmDialogActions = (actionVerb, confirmAction) => [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleConfirmDialogCancel}
      />,
      <FlatButton
        label={actionVerb || "Reassign"}
        primary={true}
        onClick={confirmAction}
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
          <Tabs>
            <Tab label="Reassign">
              <div>
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
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={`Reassign all ${this.props.conversationCount} matching`}
                    onClick={this.onReassignAllMatchingClicked}
                    disabled={!hasSeletedTexters || this.props.conversationCount === 0}
                  />
                </div>
                <Dialog
                  actions={confirmDialogActions('Reassign', this.handleConfirmDialogReassign)}
                  open={this.state.confirmDialogOpen == 'reassign'}
                  modal={true}
                  onRequestClose={this.handleConfirmDialogCancel}
                >
                  {
                    `Reassign all ${this.props.conversationCount} matching conversations?`
                  }
                </Dialog>
              </div>

            </Tab>
            <Tab label="Unassign">

              <div className={css(styles.container)}>
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={'Unassign selected'}
                    onClick={this.onUnassignClicked}
                    disabled={this.props.conversationCount === 0}
                  />
                </div>
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={`Unassign all ${this.props.conversationCount} matching`}
                    onClick={this.onUnassignAllMatchingClicked}
                    disabled={this.props.conversationCount === 0}
                  />
                </div>
                <Dialog
                  actions={confirmDialogActions('Unassign', this.handleConfirmDialogUnassign)}
                  open={this.state.confirmDialogOpen == 'unassign'}
                  modal={true}
                  onRequestClose={this.handleConfirmDialogCancel}
                >
                  {
                    `Unassign all ${this.props.conversationCount} matching conversations?`
                  }
                </Dialog>
              </div>

            </Tab>
          </Tabs>

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
