import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import {
  CampaignExportType,
  useExportCampaignsMutation
} from "@spoke/spoke-codegen";
import React, { useState } from "react";

import { CampaignExportModalContent } from "../containers/AdminCampaignStats/components/CampaignExportModal";

interface Props {
  campaignIds: string[];
  open: boolean;
  onClose: () => void;
  onError: (errorMessage: string) => void;
  onComplete(): void;
}

const ExportMultipleCampaignDataDialog: React.FC<Props> = (props) => {
  const { campaignIds, open, onClose, onError, onComplete } = props;
  const [exportCampaign, setExportCampaign] = useState<boolean>(true);
  const [exportMessages, setExportMessages] = useState<boolean>(true);
  const [exportOptOut, setExportOptOut] = useState<boolean>(false);
  const [exportFiltered, setExportFiltered] = useState<boolean>(false);

  const [exportCampaignsMutation] = useExportCampaignsMutation();

  const handleChange = (setStateFunction: any) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStateFunction(event.target.checked);
  };

  const handleExportClick = async () => {
    const result = await exportCampaignsMutation({
      variables: {
        options: {
          campaignIds,
          exportType: CampaignExportType.Spoke,
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
    >
      <DialogTitle id="export-multiple-campaign-data">
        Export Multiple Campaigns Data
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
      <DialogContent>
        <DialogContentText>Exporting data for:</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="primary"
          disabled={campaignIds.length < 1}
          onClick={handleExportClick}
        >
          Export data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportMultipleCampaignDataDialog;
