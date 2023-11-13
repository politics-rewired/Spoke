import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Announcement from "@material-ui/icons/Announcement";
import React from "react";

import ShutdownNoticeText from "../../../components/NoticeText/ShutdownNoticeText";

const ShutdownNoticeCard: React.FC = () => {
  return (
    <Card variant="outlined" style={{ marginBottom: "2em" }}>
      <CardHeader
        title="Spoke Rewired Shutdown"
        avatar={<Announcement color="error" />}
      />
      <CardContent>
        <ShutdownNoticeText />
      </CardContent>
    </Card>
  );
};

export default ShutdownNoticeCard;
