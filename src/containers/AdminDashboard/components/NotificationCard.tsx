import { gql } from "@apollo/client";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Divider from "@material-ui/core/Divider";
import type { NoticePage } from "@spoke/spoke-codegen";
import React from "react";

import {
  isPending10DlcCampaignNotice,
  isPricing10DlcNotice,
  isPricingTollFreeNotice,
  isRegister10DlcBrandNotice,
  isRegister10DlcCampaignNotice
} from "../../../api/notice";
import type { QueryMap } from "../../../network/types";
import { withOperations } from "../../hoc/with-operations";
import Pending10DlcCampaignNoticeCard from "./Pending10DlcCampaignNoticeCard";
import PricingNoticeCard from "./PricingNoticeCard";
import Register10DlcNoticeCard from "./Register10DlcNoticeCard";

interface InnerProps {
  organizationId: string;
  loading: boolean;
  data: {
    error?: any;
    notices: NoticePage;
  };
}

export const NotificationCard: React.FC<InnerProps> = (props) => {
  if (props.loading) {
    return null;
  }
  if (props.data.error || !props.data.notices) {
    return (
      <Card style={{ marginBottom: "2em" }}>
        <CardContent>There was an error fetching notifications.</CardContent>
      </Card>
    );
  }
  return (
    <div>
      {props.data.notices.edges.map(({ node }) => {
        if (window.SHOW_10DLC_REGISTRATION_NOTICES) {
          if (
            isRegister10DlcBrandNotice(node) ||
            isRegister10DlcCampaignNotice(node)
          )
            return <Register10DlcNoticeCard key={node.id} {...node} />;
          if (isPending10DlcCampaignNotice(node))
            return <Pending10DlcCampaignNoticeCard key={node.id} {...node} />;
          if (isPricing10DlcNotice(node) || isPricingTollFreeNotice(node))
            return <PricingNoticeCard key={node.id} {...node} />;
        }
        return null;
      })}
      {props.data.notices.pageInfo.totalCount > 0 && <Divider />}
    </div>
  );
};

const queries: QueryMap<InnerProps> = {
  data: {
    query: gql`
      query getOrganizationNotifications($organizationId: String!) {
        notices(organizationId: $organizationId) {
          pageInfo {
            totalCount
          }
          edges {
            node {
              ... on Register10DlcBrandNotice {
                id
                tcrRegistrationUrl
              }
              ... on Register10DlcCampaignNotice {
                id
                tcrRegistrationUrl
              }
              ... on Pending10DlcCampaignNotice {
                id
              }
              ... on Pricing10DlcNotice {
                id
              }
              ... on PricingTollFreeNotice {
                id
              }
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

export default withOperations({
  queries
})(NotificationCard);
