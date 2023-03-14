import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Divider from "@material-ui/core/Divider";
import OpenInNew from "@material-ui/icons/OpenInNew";
import Warning from "@material-ui/icons/Warning";
import type {
  NoticePage,
  Register10DlcBrandNotice
} from "@spoke/spoke-codegen";
import React from "react";

import { isRegister10DlcBrandNotice } from "../../../api/notice";
import type { QueryMap } from "../../../network/types";
import { withOperations } from "../../hoc/with-operations";

interface InnerProps {
  organizationId: string;
  data: {
    error?: any;
    notices: NoticePage;
  };
}

const Register10DlcBrandNoticeCard: React.FC<Register10DlcBrandNotice> = (
  props
) => {
  return (
    <Card variant="outlined" style={{ marginBottom: "2em" }}>
      <CardHeader
        title="10DLC Brand Information Required"
        avatar={<Warning color="error" />}
      />
      <CardContent>
        <p>
          You must provide details required for us to register a 10DLC brand on
          your behalf by February 22nd, 2022! If you do not provide this
          information by then, you may not be able to send messages starting on
          March 1st, 2022 until 3-5 business days after you provide this
          information.
        </p>

        <p>
          To learn more about this change, please see our{" "}
          <a
            href="https://docs.spokerewired.com/article/124-10dlc"
            target="_blank"
            rel="noreferrer"
          >
            10DLC knowledge base article
          </a>
          .
        </p>

        {props.tcrBrandRegistrationUrl === null && (
          <p style={{ fontWeight: "bold" }}>
            Please contact your Spoke organization owner to resolve this!
          </p>
        )}
      </CardContent>
      {props.tcrBrandRegistrationUrl && (
        <CardActions disableSpacing>
          <Button
            href={props.tcrBrandRegistrationUrl}
            target="_blank"
            rel="noreferrer"
            color="primary"
            variant="contained"
            style={{ marginLeft: "auto" }}
            endIcon={<OpenInNew />}
          >
            Register
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export const NotificationCard: React.FC<InnerProps> = (props) => {
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
        if (isRegister10DlcBrandNotice(node)) {
          return <Register10DlcBrandNoticeCard key={node.id} {...node} />;
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
                tcrBrandRegistrationUrl
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
