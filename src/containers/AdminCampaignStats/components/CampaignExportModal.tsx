import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import {
  CampaignExportType,
  useExportCampaignMutation
} from "@spoke/spoke-codegen";
import React, { useState } from "react";

interface CampaignExportModalProps {
  open: boolean;
  campaignId: string;
  onError(errorMessage: string): void;
  onClose(): void;
  onComplete(): void;
}

interface CampaignExportModalContentProps {
  exportCampaign: boolean;
  exportMessages: boolean;
  exportOptOut: boolean;
  exportFiltered: boolean;
  handleChange: (
    setStateFunction: any
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  setExportCampaign: React.Dispatch<React.SetStateAction<boolean>>;
  setExportMessages: React.Dispatch<React.SetStateAction<boolean>>;
  setExportOptOut: React.Dispatch<React.SetStateAction<boolean>>;
  setExportFiltered: React.Dispatch<React.SetStateAction<boolean>>;
}
// eslint-disable-next-line max-len
export const CampaignExportModalContent: React.FC<CampaignExportModalContentProps> = ({
  exportCampaign,
  exportMessages,
  exportOptOut,
  exportFiltered,
  handleChange,
  setExportCampaign,
  setExportMessages,
  setExportOptOut,
  setExportFiltered
}) => {
  return (
    <DialogContent>
      <div>
        <FormControlLabel
          label="Export Campaign Data"
          control={
            <Switch
              checked={exportCampaign}
              onChange={handleChange(setExportCampaign)}
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
              onChange={handleChange(setExportMessages)}
            />
          }
        />
      </div>
      <FormControlLabel
        label="Export Opt Outs Only"
        control={
          <Switch
            checked={exportOptOut}
            onChange={handleChange(setExportOptOut)}
          />
        }
      />
      <div>
        <FormControlLabel
          label="Export Filtered Contacts"
          control={
            <Switch
              checked={exportFiltered}
              onChange={handleChange(setExportFiltered)}
            />
          }
        />
      </div>
    </DialogContent>
  );
};

const CampaignExportModal: React.FC<CampaignExportModalProps> = (props) => {
  const { campaignId, open, onClose, onComplete, onError } = props;
  const [exportCampaign, setExportCampaign] = useState<boolean>(true);
  const [exportMessages, setExportMessages] = useState<boolean>(true);
  const [exportOptOut, setExportOptOut] = useState<boolean>(false);
  const [exportFiltered, setExportFiltered] = useState<boolean>(false);

  const handleChange = (setStateFunction: any) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStateFunction(event.target.checked);
  };

  const [exportCampaignMutation] = useExportCampaignMutation();

  const handleExportClick = async () => {
    const result = await exportCampaignMutation({
      variables: {
        options: {
          campaignId,
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
      onError(message);
      return;
    }
    onComplete();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Export Campaign</DialogTitle>
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
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExportClick}
          color="primary"
          disabled={
            !exportCampaign &&
            !exportMessages &&
            !exportOptOut &&
            !exportFiltered
          }
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CampaignExportModal;
