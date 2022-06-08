import { gql } from "@apollo/client";
import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";

import { Campaign } from "../../api/campaign";
import { asPercentWithTotal } from "../../lib/utils";
import theme from "../../styles/theme";
import { loadData } from "../hoc/with-operations";
import CampaignStat from "./CampaignStat";

const descriptions: Record<string, string> = {
  "40001": "Invalid destination number",
  "40002": "Blocked as spam",
  "40003": "Blocked as spam",
  "40004": "Unknown",
  "40005": "Expired",
  "40006": "Carrier outage",
  "40007": "Unknown",
  "40008": "Unknown",
  "40009": "Invalid body",
  "40011": "Too many messages",
  "40012": "Invalid destination number",
  "21610": "Recipient unsubscribed",
  "30001": "Queue overflow",
  "30002": "Account suspended",
  "30003": "Unreachable phone number",
  "30004": "Message blocked",
  "30005": "Unknown destination handset",
  "30006": "Landline or unreachable carrier",
  "30007": "Blocked as spam",
  "30008": "Unknown error",
  "4405": "Unreachable sending phone number", // this one shouldn't happen
  "4406": "Unreachable phone number",
  "4432": "Unreachable country",
  "4434": "Unreachable toll-free number",
  "4700": "Landline or unreachable carrier",
  "4720": "Unreachable phone number",
  "4730": "Unreachable phone number (recipient maybe roaming)",
  "4740": "Unreachable sending phone number", // this one shouldn't happen, but has happened
  "4750": "Carrier rejected (maybe spam)",
  "4770": "Blocked as spam",
  "4780": "Carrier rejected (sending rates exceeded)",
  "5106": "Unroutable (can be retried)",
  "5620": "Carrier outage",
  "9902": "Delivery receipt expired",
  "9999": "Unknown error"
};

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
  },
  secondaryHeader: {
    ...theme.text.secondaryHeader
  }
});

const DeliverabilityStats = (props: {
  data: {
    campaign: Pick<Campaign, "id" | "deliverabilityStats">;
  };
}) => {
  const {
    data: {
      campaign: {
        deliverabilityStats: {
          deliveredCount,
          sendingCount,
          sentCount,
          errorCount,
          specificErrors
        }
      }
    }
  } = props;

  const total = deliveredCount + sendingCount + sentCount + errorCount;

  return (
    <div>
      <div className={css(styles.container)}>
        <div className={css(styles.flexColumn, styles.spacer)}>
          <CampaignStat
            title="Delivered"
            count={asPercentWithTotal(deliveredCount, total)}
          />
        </div>
        <div className={css(styles.flexColumn, styles.spacer)}>
          <CampaignStat
            title="Sending"
            count={asPercentWithTotal(sendingCount + sentCount, total)}
          />
        </div>
        <div className={css(styles.flexColumn, styles.spacer)}>
          <CampaignStat
            title="Error"
            count={asPercentWithTotal(errorCount, total)}
          />
        </div>
      </div>

      <div className={css(styles.secondaryHeader)}>Top errors:</div>
      {specificErrors
        .sort((a, b) => b.count - a.count)
        .map((e) => {
          const errorCode = e.errorCode ? `${e.errorCode}` : "n/a";
          return (
            <div key={errorCode}>
              {errorCode}{" "}
              {descriptions[errorCode]
                ? `(${descriptions[errorCode]})`
                : "Unknown error"}
              : {asPercentWithTotal(e.count, total)}
            </div>
          );
        })}
    </div>
  );
};

DeliverabilityStats.propTypes = {
  campaignId: PropTypes.string.isRequired
};

const queries = {
  data: {
    query: gql`
      query getDeliverabilityStats($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          deliverabilityStats {
            deliveredCount
            sendingCount
            sentCount
            errorCount
            specificErrors {
              errorCode
              count
            }
          }
        }
      }
    `,
    options: (ownProps: { campaignId: string }) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

export default loadData({ queries })(DeliverabilityStats);
