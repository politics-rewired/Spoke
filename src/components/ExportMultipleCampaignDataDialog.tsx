import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import AssignmentRoundedIcon from "@material-ui/icons/AssignmentRounded";
import { useExportCampaignsMutation } from "@spoke/spoke-codegen";
import React, { useState } from "react";

import { CampaignExportModalContent } from "../containers/AdminCampaignStats/components/CampaignExportModal";

export type CampaignDetailsForExport = {
  id: string;
  title: string;
};
interface Props {
  campaignDetailsForExport: CampaignDetailsForExport[];
  open: boolean;
  onClose: () => void;
  onError: (errorMessage: string) => void;
  onComplete(): void;
}

const ExportMultipleCampaignDataDialog: React.FC<Props> = ({
  campaignDetailsForExport,
  open,
  onClose,
  onError,
  onComplete
}) => {
  const [exportCampaign, setExportCampaign] = useState<boolean>(true);
  const [exportMessages, setExportMessages] = useState<boolean>(true);
  const [exportOptOut, setExportOptOut] = useState<boolean>(false);
  const [exportFiltered, setExportFiltered] = useState<boolean>(false);

  const [exportCampaignsMutation] = useExportCampaignsMutation();

  const handleChange = (
    setStateFunction: React.Dispatch<React.SetStateAction<boolean>>
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setStateFunction(event.target.checked);
  };

  const handleExportClick = async () => {
    const campaignIds = campaignDetailsForExport.map(
      (campaign: CampaignDetailsForExport) => campaign.id
    );
    const result = await exportCampaignsMutation({
      variables: {
        options: {
          campaignIds,
          spokeOptions: {
            campaign: exportCampaign,
            messages: exportMessages,
            optOuts: exportOptOut,
            filteredContacts: exportFiltered
          }
        }
      }
    });
    if (result.errors) {
      const message = result.errors.map((e) => e.message).join(", ");
      return onError(message);
    }
    onComplete();
  };

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="export-multiple-campaign-data"
      open={open}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="export-multiple-campaign-data">
        <Typography variant="h6" style={{ margin: "4px", cursor: "pointer" }}>
          Export Campaigns
        </Typography>
      </DialogTitle>
      <CampaignExportModalContent
        exportCampaign={exportCampaign}
        exportMessages={exportMessages}
        exportOptOut={exportOptOut}
        exportFiltered={exportFiltered}
        handleChange={handleChange}
        setExportCampaign={setExportCampaign}
        setExportMessages={setExportMessages}
        setExportOptOut={setExportOptOut}
        setExportFiltered={setExportFiltered}
      />
      <Divider variant="middle" />
      <DialogContent>
        <DialogContentText>
          <Typography variant="subtitle1" style={{ margin: "4px" }}>
            Selected campaigns:
          </Typography>
          {campaignDetailsForExport.map(
            (campaign: CampaignDetailsForExport) => {
              return (
                <div
                  key={campaign.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "4px"
                  }}
                >
                  <AssignmentRoundedIcon />
                  <Typography variant="h6" style={{ margin: "4px" }}>
                    {campaign.title}
                  </Typography>
                  <Typography variant="subtitle1" style={{ marginLeft: "8px" }}>
                    id: {campaign.id}
                  </Typography>
                </div>
              );
            }
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="primary"
          disabled={campaignDetailsForExport.length < 1}
          onClick={handleExportClick}
        >
          Export data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportMultipleCampaignDataDialog;
