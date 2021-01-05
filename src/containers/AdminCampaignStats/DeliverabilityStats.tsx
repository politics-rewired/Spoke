import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import React from "react";

import theme from "../../styles/theme";
import { loadData } from "../hoc/with-operations";
import CampaignStat from "./CampaignStat";

const asPercentWithTotal = (numerator: number, denominator: number) =>
  `${((numerator / denominator) * 100).toString()}%(${numerator})`;

const descriptions = {
  40001: "Invalid destination number",
  40002: "Blocked as spam",
  40003: "Blocked as spam",
  40004: "Unknown",
  40005: "Expired",
  40006: "Carrier outage",
  40007: "Unknown",
  40008: "Unknown",
  40009: "Invalid body",
  40011: "Too many messages",
  40012: "Invalid destination number",
  21610: "Recipient unsubscribed",
  30001: "Queue overflow",
  30002: "Account suspended",
  30003: "Unreachable phone number",
  30004: "Message blocked",
  30005: "Unknown destination handset",
  30006: "Landline or unreachable carrier",
  30007: "Blocked as spam",
  30008: "Unknown error"
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

/* eslint-disable react/prefer-stateless-function */
class DeliverabilityStats extends React.Component {
  render() {
    const {
      campaign: {
        deliverabilityStats: {
          deliveredCount,
          sentCount,
          errorCount,
          specificErrors
        }
      }
    } = (this.props as any).data as {
      campaign: {
        id: string;
        deliverabilityStats: {
          deliveredCount: number;
          sentCount: number;
          errorCount: number;
          specificErrors: {
            errorCode: string;
            count: number;
          }[];
        };
      };
    };

    const total = deliveredCount + sentCount + errorCount;

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
              count={asPercentWithTotal(sentCount, total)}
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
          .sort((e) => e.count)
          .slice(0, 5)
          .map((e) => (
            <div key={e.errorCode}>
              {e.errorCode}{" "}
              {descriptions[e.errorCode]
                ? `(${descriptions[e.errorCode]})`
                : ""}
              : {asPercentWithTotal(e.count, total)}
            </div>
          ))}
      </div>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getDeliverabilityStats($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          deliverabilityStats {
            deliveredCount
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
