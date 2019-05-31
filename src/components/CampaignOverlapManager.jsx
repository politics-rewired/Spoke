import React from 'react'
import loadData from '../containers/hoc/load-data'
import wrapMutations from '../containers/hoc/wrap-mutations'
import CircularProgress from 'material-ui/CircularProgress'
import gql from 'graphql-tag'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import IconButton from 'material-ui/IconButton'
import FlatButton from 'material-ui/FlatButton'
import DeleteIcon from 'material-ui/svg-icons/action/delete-forever'
import RefreshIcon from 'material-ui/svg-icons/navigation/refresh'

class CampaignOverlapManager extends React.Component {
  state = {
    deleting: new Set(),
    errored: new Set()
  }

  delete = id => async ev => {
    const { deleting, errored } = this.state

    errored.delete(id)
    deleting.add(id)

    this.setState({ deleting, errored })

    try {
      const response = await this.props.mutations.deleteCampaignOverlap(id)
      if (response.errors) throw new Error(response.errors)
    } catch (exc) {
      errored.add(id)
    } finally {
      deleting.delete(id)
      this.setState({ deleting, errored })
    }
  }

  render() {
    const { fetchCampaignOverlaps: overlaps } = this.props
    const { deleting, errored } = this.state

    if (overlaps.loading && !overlaps.fetchCampaignOverlaps) return <CircularProgress/>

    return (
      <div>
        Warning: clicking the trashcan will trigger an irreversible delete.
      <Table selectable={false}>
        <TableHeader>
          <TableHeaderColumn>Campaign</TableHeaderColumn>
          <TableHeaderColumn>Overlap Count</TableHeaderColumn>
          <TableHeaderColumn>Delete</TableHeaderColumn>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {overlaps.fetchCampaignOverlaps.map(fco =>
            <TableRow key={fco.id}>
              <TableRowColumn>{fco.campaign.id + ' ' + fco.campaign.title} </TableRowColumn>
              <TableRowColumn>{fco.overlapCount}</TableRowColumn>
              <TableRowColumn>
                <IconButton onClick={this.delete(fco.campaign.id)}>
                  {deleting.has(fco.campaign.id)
                    ? <CircularProgress/>
                    : errored.has(fco.campaign.id)
                      ? <FlatButton
                          label="Error. Retry?"
                          labelPosition="before"
                          labelStyle={{ color: 'red' }}
                          primary={true}
                          icon={<RefreshIcon color="red" />}
                        />
                      : <DeleteIcon color="red" />}
                </IconButton>
              </TableRowColumn>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    )
  }
}

const mapQueriesToProps = ({ownProps}) => ({
  fetchCampaignOverlaps: {
    query: gql`
      query fetchCampaignOverlaps($organizationId: String! $campaignId: String!) {
        fetchCampaignOverlaps(organizationId: $organizationId, campaignId: $campaignId) {
          campaign { id title }
          overlapCount
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      organizationId: ownProps.organizationId
    }
  }
})

const mapMutationsToProps = ({ownProps}) => ({
  deleteCampaignOverlap: (overlappingCampaignId) => ({
    mutation: gql`
      mutation deleteCampaignOverlap($organizationId: String!, $campaignId: String!, $overlappingCampaignId: String!) {
        deleteCampaignOverlap(organizationId: $organizationId, campaignId: $campaignId, overlappingCampaignId: $overlappingCampaignId) {
          campaign { id title }
          deletedRowCount
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      campaignId: ownProps.campaignId,
      overlappingCampaignId
    },
    refetchQueries: ['fetchCampaignOverlaps']
  })
})

export default loadData(wrapMutations(CampaignOverlapManager), {
  mapQueriesToProps,
  mapMutationsToProps
})
