import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import LibraryAddCheckOutlinedIcon from "@material-ui/icons/LibraryAddCheckOutlined";
import OpenInNewOutlinedIcon from "@material-ui/icons/OpenInNewOutlined";
import React from "react";

interface Props {
  campaignIdsForExport: string[];
  onClick: () => void;
}

const CampaignListHeader = (props: Props) => {
  const { campaignIdsForExport, onClick } = props;

  const isCampaignSelected = campaignIdsForExport.length > 0;
  return (
    <div
      style={{
        flexDirection: "row",
        paddingTop: "16px"
      }}
    >
      <Typography variant="h5">Campaigns</Typography>
      <Button
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={onClick}
        variant="outlined"
        color="primary"
        style={{
          margin: "16px 0px 16px 0px"
        }}
        startIcon={
          isCampaignSelected ? (
            <OpenInNewOutlinedIcon />
          ) : (
            <LibraryAddCheckOutlinedIcon />
          )
        }
        disabled={!isCampaignSelected}
      >
        {isCampaignSelected
          ? `Export ${campaignIdsForExport.length} Campaign(s)`
          : "Select Campaign(s)"}
      </Button>
    </div>
  );
};

export default CampaignListHeader;
