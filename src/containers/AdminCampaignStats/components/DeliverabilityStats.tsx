import { gql } from "@apollo/client";
import { Grid } from "@material-ui/core";
import type { Campaign } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";

import errorCodeDescriptions from "../../../lib/telco-error-codes";
import { asPercent, asPercentWithTotal } from "../../../lib/utils";
import theme from "../../../styles/theme";
import { loadData } from "../../hoc/with-operations";
import CampaignStat from "./CampaignStat";

const styles = StyleSheet.create({
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

  const highErrorPercent = 25;
  const campaignErrorPercent = asPercent(errorCount, total);
  const errorHighlight = campaignErrorPercent > highErrorPercent;

  return (
    <div>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={4}>
          <CampaignStat
            title="Delivered"
            count={asPercentWithTotal(deliveredCount, total)}
          />
        </Grid>
        <Grid item xs={4}>
          <CampaignStat
            title="Sending"
            count={asPercentWithTotal(sendingCount + sentCount, total)}
          />
        </Grid>
        <Grid item xs={4}>
          <CampaignStat
            title="Error"
            count={asPercentWithTotal(errorCount, total)}
            highlight={errorHighlight}
          />
        </Grid>
      </Grid>

      <div className={css(styles.secondaryHeader)}>Top errors:</div>
      {specificErrors
        .sort((a, b) => b.count - a.count)
        .map((e) => {
          const errorCode = e.errorCode ? `${e.errorCode}` : "n/a";
          return (
            <div key={errorCode}>
              {errorCode}{" "}
              {errorCodeDescriptions[errorCode]
                ? `(${errorCodeDescriptions[errorCode]})`
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
