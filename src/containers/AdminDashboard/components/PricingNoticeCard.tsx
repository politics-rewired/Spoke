import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import AssignmentTurnedIn from "@material-ui/icons/AssignmentTurnedIn";
import type { PricingNotice } from "@spoke/spoke-codegen";
import React from "react";

import Pricing10DlcNoticeText from "../../../components/NoticeText/Pricing10DlcNoticeText";
import PricingTollFreeNoticeText from "../../../components/NoticeText/PricingTollFreeNoticeText";

interface PricingNoticeCardProps extends PricingNotice {
  __typename?: string;
}

const PricingNoticeCard: React.FC<PricingNoticeCardProps> = (props) => {
  const is10DlcNotice = props.__typename === "Pricing10DlcNotice";

  return (
    <Card variant="outlined" style={{ marginBottom: "2em" }}>
      <CardHeader
        title={
          is10DlcNotice
            ? "10DLC Registration Complete"
            : "Toll Free Registration Complete"
        }
        avatar={<AssignmentTurnedIn color="primary" />}
      />
      <CardContent>
        {is10DlcNotice ? (
          <Pricing10DlcNoticeText />
        ) : (
          <PricingTollFreeNoticeText />
        )}
      </CardContent>
    </Card>
  );
};

export default PricingNoticeCard;
