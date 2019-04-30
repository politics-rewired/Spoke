import PropTypes from 'prop-types'
import React from 'react'
import CampaignList from './CampaignList'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import theme from '../styles/theme'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'
import DropDownMenu from 'material-ui/DropDownMenu'
import { MenuItem } from 'material-ui/Menu'
import { dataTest } from '../lib/attributes'

class AdminCampaignList extends React.Component {
  state = {
    isCreating: false,
    pageSize: 50,
    campaignsFilter: {
      isArchived: false
    }
  }

  handleClickNewButton = async () => {
    const { organizationId, router } = this.props.params
    this.setState({ isCreating: true })
    const newCampaign = await this.props.mutations.createCampaign({
      title: 'New Campaign',
      description: '',
      dueBy: null,
      organizationId,
      contacts: [],
      interactionSteps: {
        script: ''
      }
    })
    if (newCampaign.errors) {
      alert('There was an error creating your campaign')
      throw new Error(newCampaign.errors)
    }

    const { id: campaignId } = newCampaign.data.createCampaign
    router.push(`/admin/${organizationId}/campaigns/${campaignId}/edit?new=true`)
  }

  handleFilterChange = (event, index, value) => {
    this.setState({
      campaignsFilter: {
        isArchived: value
      }
    })
  }

  handlePageSizeChange = (event, index, pageSize) => {
    this.setState({ pageSize })
  }

  renderPageSizeOptions() {
    return (
      <DropDownMenu value={this.state.pageSize} onChange={this.handlePageSizeChange} >
        <MenuItem value={10} primaryText='10' />
        <MenuItem value={25} primaryText='25' />
        <MenuItem value={50} primaryText='50' />
        <MenuItem value={100} primaryText='100' />
        <MenuItem value={0} primaryText='All' />
      </DropDownMenu>
    )
  }

  renderFilters() {
    return (
      <DropDownMenu value={this.state.campaignsFilter.isArchived} onChange={this.handleFilterChange}>
        <MenuItem value={false} primaryText='Current' />
        <MenuItem value primaryText='Archived' />
      </DropDownMenu>
    )
  }
  render() {
    const { pageSize } = this.state
    const { adminPerms } = this.props.params
    return (
      <div>
        {this.renderFilters()}
        {this.renderPageSizeOptions()}
        {this.state.isCreating ? <LoadingIndicator /> : (
          <CampaignList
            organizationId={this.props.params.organizationId}
            campaignsFilter={this.state.campaignsFilter}
            pageSize={pageSize}
            adminPerms={adminPerms}
          />
        )}

        {adminPerms ?
          (<FloatingActionButton
            {...dataTest('addCampaign')}
            style={theme.components.floatingButton}
            onTouchTap={this.handleClickNewButton}
          >
            <ContentAdd />
          </FloatingActionButton>
          ) : null}
      </div>
    )
  }
}

AdminCampaignList.propTypes = {
  params: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object
}

const mapMutationsToProps = () => ({
  createCampaign: (campaign) => ({
    mutation: gql`
      mutation createBlankCampaign($campaign: CampaignInput!) {
        createCampaign(campaign: $campaign) {
          id
        }
      }
    `,
    variables: { campaign }
  })
})

export default loadData(wrapMutations(
  withRouter(AdminCampaignList)), {
    mapMutationsToProps
  })
