import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import {
  CampaignExportType,
  useExportCampaignsMutation
} from "@spoke/spoke-codegen";
import React, { useState } from "react";

interface Props {
  campaignIds: string[];
  open: boolean;
  onClose: () => void;
}

const ExportMultipleCampaignDataDialog = (props: Props) => {
  const { campaignIds, open, onClose } = props;
  const [exportCampaign, setExportCampaign] = useState<boolean>(true);
  const [exportMessages, setExportMessages] = useState<boolean>(true);
  const [exportOptOut, setExportOptOut] = useState<boolean>(false);
  const [exportFiltered, setExportFiltered] = useState<boolean>(false);

  const [exportCampaignsMutation] = useExportCampaignsMutation();

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
      console.log("MESSAGE", message);
      // onError(message);
      // return;
    }
    console.log("finished", result);
    // onComplete();
  };

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="export-multiple-campaign-data"
      open={open}
    >
      <DialogTitle id="export-multiple-campaign-data">
        Export Multiple Campaign Data
      </DialogTitle>
      <DialogContent>
        <div>
          <FormControlLabel
            label="Export Campaign Data"
            control={
              <Switch
                checked={exportCampaign}
                onChange={() => setExportCampaign(!exportCampaign)}
              />
            }
          />
        </div>
        <div>
          <FormControlLabel
            label="Export Messages"
            control={
              <Switch
                checked={exportMessages}
                onChange={() => setExportMessages(!exportMessages)}
              />
            }
          />
        </div>
        <FormControlLabel
          label="Export Opt Outs Only"
          control={
            <Switch
              checked={exportOptOut}
              onChange={() => setExportOptOut(!exportOptOut)}
            />
          }
        />
        <div>
          <FormControlLabel
            label="Export Filtered Contacts"
            control={
              <Switch
                checked={exportFiltered}
                onChange={() => setExportFiltered(!exportFiltered)}
              />
            }
          />
        </div>
        <DialogContentText>Exporting data for:</DialogContentText>
        {/* {error && (
          <DialogContentText>
            Error fetching templates: {error.message}
          </DialogContentText>
        )} */}
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
