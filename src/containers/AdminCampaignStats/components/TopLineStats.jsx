import { gql } from "@apollo/client";
import { Grid } from "@material-ui/core";
import PropTypes from "prop-types";
import React from "react";

import { withQueries } from "../../hoc/with-operations";
import CampaignStat from "./CampaignStat";

export const TopLineStats = (props) => {
  const {
    contactsCount,
    assignments,
    needsMessageCount,
    sentMessagesCount,
    receivedMessagesCount,
    optOutsCount,
    percentUnhandledReplies
  } = props;

  const highUnhandledReplyPercent = 25;
  const campaignPercent =
    percentUnhandledReplies.campaign?.stats.percentUnhandledReplies;
  const replyHighlight = campaignPercent > highUnhandledReplyPercent;

  return (
    <Grid container spacing={2} justifyContent="center">
      <Grid item xs={2}>
        <CampaignStat
          title="Contacts"
          loading={contactsCount.loading}
          error={contactsCount.errors && contactsCount.errors.message}
          count={contactsCount.campaign && contactsCount.campaign.contactsCount}
        />
      </Grid>
      <Grid item xs={2}>
        <CampaignStat
          title="Texters"
          loading={assignments.loading}
          error={assignments.errors && assignments.errors.message}
          count={
            assignments.campaign && assignments.campaign.assignments.length
          }
        />
      </Grid>
      <Grid item xs={2}>
        <CampaignStat
          title="Initials To Send"
          loading={needsMessageCount.loading}
          error={needsMessageCount.errors && needsMessageCount.errors.message}
          count={
            needsMessageCount.campaign &&
            needsMessageCount.campaign.stats.countNeedsMessageContacts
          }
        />
      </Grid>
      <Grid item xs={2}>
        <CampaignStat
          title="Sent"
          loading={sentMessagesCount.loading}
          error={sentMessagesCount.errors && sentMessagesCount.errors.message}
          count={
            sentMessagesCount.campaign &&
            sentMessagesCount.campaign.stats.sentMessagesCount
          }
        />
      </Grid>
      <Grid item xs={2}>
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
          highlight={replyHighlight}
        />
      </Grid>
      <Grid item xs={2}>
        <CampaignStat
          title="Opt-outs"
          loading={optOutsCount.loading}
          error={optOutsCount.errors && optOutsCount.errors.message}
          count={
            optOutsCount.campaign && optOutsCount.campaign.stats.optOutsCount
          }
        />
      </Grid>
    </Grid>
  );
};

TopLineStats.propTypes = {
  campaignId: PropTypes.string.isRequired
};

const queries = {
  contactsCount: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          contactsCount
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
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
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  needsMessageCount: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          stats {
            countNeedsMessageContacts
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
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
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
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
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
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
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  percentUnhandledReplies: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          stats {
            percentUnhandledReplies
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

export default withQueries(queries)(TopLineStats);
