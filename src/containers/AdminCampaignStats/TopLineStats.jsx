import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import { connect } from "react-apollo";
import { StyleSheet, css } from "aphrodite";

import theme from "../../styles/theme";
import CampaignStat from "./CampaignStat";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  flexColumn: {
    flex: 1,
    textAlign: "right",
    display: "flex"
  },
  spacer: {
    marginRight: 20
  }
});

export const TopLineStats = props => {
  const {
    contactsCount,
    assignments,
    sentMessagesCount,
    receivedMessagesCount,
    optOutsCount
  } = props;

  return (
    <div className={css(styles.container)}>
      <div className={css(styles.flexColumn, styles.spacer)}>
        <CampaignStat
          title="Contacts"
          loading={contactsCount.loading}
          error={contactsCount.errors && contactsCount.errors.message}
          count={contactsCount.campaign && contactsCount.campaign.contactsCount}
        />
      </div>
      <div className={css(styles.flexColumn, styles.spacer)}>
        <CampaignStat
          title="Texters"
          loading={assignments.loading}
          error={assignments.errors && assignments.errors.message}
          count={
            assignments.campaign && assignments.campaign.assignments.length
          }
        />
      </div>
      <div className={css(styles.flexColumn, styles.spacer)}>
        <CampaignStat
          title="Sent"
          loading={sentMessagesCount.loading}
          error={sentMessagesCount.errors && sentMessagesCount.errors.message}
          count={
            sentMessagesCount.campaign &&
            sentMessagesCount.campaign.stats.sentMessagesCount
          }
        />
      </div>
      <div className={css(styles.flexColumn, styles.spacer)}>
        <CampaignStat
          title="Replies"
          loading={receivedMessagesCount.loading}
          error={
            receivedMessagesCount.errors && receivedMessagesCount.errors.message
          }
          count={
            receivedMessagesCount.campaign &&
            receivedMessagesCount.campaign.stats.receivedMessagesCount
          }
        />
      </div>
      <div className={css(styles.flexColumn)}>
        <CampaignStat
          title="Opt-outs"
          loading={optOutsCount.loading}
          error={optOutsCount.errors && optOutsCount.errors.message}
          count={
            optOutsCount.campaign && optOutsCount.campaign.stats.optOutsCount
          }
        />
      </div>
    </div>
  );
};

TopLineStats.propTypes = {
  campaignId: PropTypes.string.isRequired
};

const mapQueriesToProps = ({ ownProps }) => ({
  contactsCount: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          contactsCount
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId
    }
    // pollInterval: 5000
  },
  assignments: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          assignments {
            id
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId
    }
    // pollInterval: 5000
  },
  sentMessagesCount: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          stats {
            sentMessagesCount
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId
    }
    // pollInterval: 5000
  },
  receivedMessagesCount: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          stats {
            receivedMessagesCount
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId
    }
    // pollInterval: 5000
  },
  optOutsCount: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          stats {
            optOutsCount
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId
    }
    // pollInterval: 5000
  }
});

export default connect({ mapQueriesToProps })(TopLineStats);
