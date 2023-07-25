import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import React from "react";

const CampaignListHeader = () => {
  // const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (_event: Event) => {
    // TODO
    // setAnchorEl(event.currentTarget);
  };

  // TODO
  // const handleClose = () => {
  //   setAnchorEl(null);
  // };

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
        onClick={handleClick}
        variant="outlined"
        color="primary"
        style={{
          margin: "16px 0px 16px 0px"
        }}
      >
        Export Campaign Data
      </Button>
    </div>
  );
};

export default CampaignListHeader;
