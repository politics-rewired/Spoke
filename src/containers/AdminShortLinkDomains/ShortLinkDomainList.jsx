import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

import DataTables from 'material-ui-datatables'
import Toggle from 'material-ui/Toggle'
import CheckCircleIcon from 'material-ui/svg-icons/action/check-circle'
import BlockIcon from 'material-ui/svg-icons/content/block'
import ThumbUpIcon from 'material-ui/svg-icons/action/thumb-up'
import ThumbDownIcon from 'material-ui/svg-icons/action/thumb-down'
import { red500, green500 } from 'material-ui/styles/colors'

class ShortLinkDomainList extends Component {

  tableColumns = () => ([
    {
      label: 'Eligible',
      tooltip: 'Whether the domain eligible for rotation.',
      render: (value, row) => {
        const isEligible = row.isHealthy && !row.isManuallyDisabled
        return isEligible
          ? <CheckCircleIcon color={green500} />
          : <BlockIcon color={red500} />
      }
    }, {
      key: 'domain',
      label: 'Domain'
    }, {
      key: 'currentUsageCount',
      label: 'Current Usage',
      tooltip: 'How many times the domain has been used in the current rotation.'
    }, {
      key: 'maxUsageCount',
      label: 'Maximum Usage',
      tooltip: 'Maximum numbers of times the domain should be used per rotation.'
    }, {
      key: 'isManuallyDisabled',
      label: 'Manual Disable',
      tooltip: 'Whether an admin has manually disabled this domain.',
      render: (value, row) => {
        return (
          <Toggle
            toggled={value}
            disabled={row.isToggleDisabled}
            onToggle={this.createHandleDisableToggle(row.id)}
          />
        )
      }
    }, {
      key: 'isHealthy',
      label: 'Health',
      tooltip: 'Health of the domain based on text delivery report summaries.',
      render: (value, row) => {
        return value
          ? <ThumbUpIcon color={green500} />
          : <ThumbDownIcon color={red500} />
      }
    }, {
      key: 'cycledOutAt',
      label: 'Last Cycled Out',
      tooltip: 'The last time this domain was cycled out of rotation.',
      render: (value, row) => moment(value).fromNow()
    }, {
      key: 'createdAt',
      label: 'Created',
      render: (value, row) => new Date(value).toLocaleString()
    }
  ])

  createHandleDisableToggle = domainId => (event, value) => {
    // These don't appear to be doing anything to stop handleCellClick being called...
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    event.preventDefault()

    this.props.onManualDisableToggle(domainId, value)
  }

  handleCellClick = (rowIndex, columnIndex, row, cellValue, args) => {
    console.log(rowIndex, columnIndex, row, cellValue, args)
  }

  handleCellDoubleClick = args => {

  }

  handleFilterValueChange = value => {

  }

  handleSortOrderChange = (key, order) => {

  }

  render() {
    let { domains, disabledDomainIds } = this.props
    domains = domains.map(domain => {
      const isToggleDisabled = disabledDomainIds.indexOf(domain.id) > -1
      return Object.assign({}, domain, { isToggleDisabled })
    })

    return (
      <DataTables
        height="auto"
        selectable={false}
        showRowHover={false}
        columns={this.tableColumns()}
        data={domains}
        showHeaderToolbar={false}
        showFooterToolbar={false}
        showCheckboxes={false}
        onCellClick={this.handleCellClick}
        onCellDoubleClick={this.handleCellDoubleClick}
        onFilterValueChange={this.handleFilterValueChange}
        onSortOrderChange={this.handleSortOrderChange}
      />
    )
  }
}

ShortLinkDomainList.defaultProps = {
  disabledDomainIds: []
}

ShortLinkDomainList.propTypes = {
  domains: PropTypes.arrayOf(PropTypes.object).isRequired,
  disabledDomainIds: PropTypes.arrayOf(PropTypes.string),
  onManualDisableToggle: PropTypes.func.isRequired
}

export default ShortLinkDomainList
