import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import OpenInNew from "@material-ui/icons/OpenInNew";
import React from "react";
import { compose } from "recompose";

import { QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";
import {
  GET_MESSAGING_SERVICES,
  OrganizationMessagingServicesType
} from "./queries";

interface HocProps {
  data: OrganizationMessagingServicesType;
}

export interface OuterProps {
  organizationId: string;
  style?: React.CSSProperties;
}

interface InnerProps extends OuterProps, HocProps {}

const Review10DlcInfo: React.FC<InnerProps> = (props) => {
  const {
    data: {
      organization: {
        messagingServices: { edges }
      }
    },
    style
  } = props;

  const link =
    edges.length === 1
      ? edges[0].node.tcrBrandRegistrationLink ?? undefined
      : undefined;

  return (
    <Card style={style}>
      <CardHeader title="10DLC Registration Information" />
      <CardContent>
        <p>
          You must provide details required for us to register a 10DLC brand on
          your behalf by November 24th, 2021! If you do not provide this
          information by then, you may not be able to send messages starting on
          December 1st, 2021 until 3-5 business days after you provide this
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
      </CardContent>
      <CardActions disableSpacing>
        <Button
          href={link ?? ""}
          target="_blank"
          rel="noreferrer"
          color="primary"
          variant="contained"
          disabled={link === undefined}
          style={{ marginLeft: "auto" }}
          endIcon={<OpenInNew />}
        >
          Register
        </Button>
      </CardActions>
    </Card>
  );
};

const queries: QueryMap<OuterProps> = {
  data: {
    query: GET_MESSAGING_SERVICES,
    options: ({ organizationId }) => ({
      variables: { organizationId }
    })
  }
};

export default compose<InnerProps, OuterProps>(loadData({ queries }))(
  Review10DlcInfo
);
