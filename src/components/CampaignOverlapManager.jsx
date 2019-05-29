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
import DeleteIcon from 'material-ui/svg-icons/action/delete-forever'

class CampaignOverlapManager extends React.Component {
  state = {
    deleting: new Set()
  }

  delete = id => ev => {
    console.log(this.props)
    this.state.deleting.add(id)

    this.setState({
      deleting: this.state.deleting
    })

    this.props.mutations.deleteCampaignOverlap(id)
  }

  render() {
    if (this.props.fetchCampaignOverlaps.loading && !this.props.fetchCampaignOverlaps.fetchCampaignOverlaps) return <CircularProgress/>;

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
          {this.props.fetchCampaignOverlaps.fetchCampaignOverlaps.map(fco =>
            <TableRow key={fco.id}>
              <TableRowColumn>{fco.campaign.id + ' ' + fco.campaign.title} </TableRowColumn>
              <TableRowColumn>{fco.overlapCount}</TableRowColumn>
              <TableRowColumn>
                <IconButton onClick={this.delete(fco.campaign.id)}>
                  {this.state.deleting.has(fco.campaign.id) ? <CircularProgress/> : <DeleteIcon color="red"></DeleteIcon>}
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
