import { InputAdornment } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import LibraryAddCheckOutlinedIcon from "@material-ui/icons/LibraryAddCheckOutlined";
import OpenInNewOutlinedIcon from "@material-ui/icons/OpenInNewOutlined";
import SearchIcon from "@material-ui/icons/Search";
import React from "react";
import { useDebouncedCallback } from "use-debounce";

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "16px"
  }
};

const FIVE_HUNDRED = 500;

interface Props {
  campaignIdsForExport: string[];
  filterByCampaignTitle: (str: string) => void;
  onClick: () => void;
}

const CampaignListHeader = (props: Props) => {
  const { campaignIdsForExport, onClick, filterByCampaignTitle } = props;

  const debounceSearchTerm = useDebouncedCallback((str: string) => {
    filterByCampaignTitle(str);
  }, FIVE_HUNDRED);

  const isCampaignSelected = campaignIdsForExport.length > 0;
  return (
    <div style={styles.wrapper}>
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
      <TextField
        id="outlined-basic"
        label="Search..."
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        onChange={(ev) => debounceSearchTerm(ev.target.value)}
      />
    </div>
  );
};

export default CampaignListHeader;
