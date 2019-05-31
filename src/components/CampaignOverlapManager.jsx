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

const hoverBoxStyle = {
  position: 'fixed',
  top: '120px',
  left: '50%',
  width: '400px',
  marginLeft: '-200px',
  backgroundColor: '#D0D0D0',
  padding: '20px'
}

const hoveredCampaignStyle = {
  padding: '10px',
  backgroundColor: '#F0F0F0'
}

class CampaignOverlapManager extends React.Component {
  state = {
    deleting: new Set(),
    errored: new Set(),
    hoveredRowId: undefined
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

  setHoverId = hoveredRowId => () => this.setState({ hoveredRowId })

  clearHover = () => this.setState({ hoveredRowId: undefined })

  render() {
    const { fetchCampaignOverlaps: overlaps } = this.props
    const { deleting, errored, hoveredRowId } = this.state

    if (overlaps.loading && !overlaps.fetchCampaignOverlaps) return <CircularProgress/>

    const { fetchCampaignOverlaps: overlapList } = overlaps
    const hoveredTitle = hoveredRowId && overlapList.find(fco => fco.campaign.id === hoveredRowId).campaign.title

    return (
      <div>
        <p>Warning: clicking the trashcan will trigger an irreversible delete.</p>
        {hoveredTitle && (
          <div style={hoverBoxStyle}>
            <h3>Hovered on campaign:</h3>
            <p style={hoveredCampaignStyle}>
              {hoveredTitle}
            </p>
          </div>
        )}
      <Table selectable={false}>
        <TableHeader enableSelectAll={false} displaySelectAll={false}>
          <TableHeaderColumn>Campaign</TableHeaderColumn>
          <TableHeaderColumn>Overlap Count</TableHeaderColumn>
          <TableHeaderColumn>Last Messaged</TableHeaderColumn>
          <TableHeaderColumn>Delete</TableHeaderColumn>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {overlapList.map(fco =>
            <TableRow key={fco.campaign.id}>
              <TableRowColumn>
                <span onMouseOver={this.setHoverId(fco.campaign.id)} onMouseOut={this.clearHover}>
                  {fco.campaign.id + ' ' + fco.campaign.title}
                </span>
              </TableRowColumn>
              <TableRowColumn>{fco.overlapCount}</TableRowColumn>
              <TableRowColumn>{(new Date(fco.lastActivity)).toLocaleString()}</TableRowColumn>
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
          lastActivity
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
