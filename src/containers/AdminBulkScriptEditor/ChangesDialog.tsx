import { useTheme } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import type { ScriptUpdateChange } from "@spoke/spoke-codegen";
import isEmpty from "lodash/isEmpty";
import React from "react";

interface ChangesDialogProps {
  changesList: Record<string, Array<ScriptUpdateChange>>;
  open: boolean;
  searchString: string;
  replaceString: string;
  onClose(): void;
  onSubmit(): void;
}

const ChangesDialog: React.FC<ChangesDialogProps> = ({
  changesList,
  open,
  onClose,
  onSubmit,
  searchString,
  replaceString
}) => {
  const theme = useTheme();

  const colorOriginal = (script: string) => {
    // Using split with the search string in brackets,
    // keeps the search string as part of the splits,
    // so we update the span of the split part with the color
    const expression = new RegExp(`(${searchString})`, "g");
    const scriptParts = script.split(expression);
    return (
      <span>
        {scriptParts.map((part) =>
          part.match(expression) ? (
            <span style={{ color: theme.palette.warning.main }}>{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const colorReplacement = (script: string) => {
    const expression = new RegExp(`(${searchString})`, "g");
    const scriptParts = script.split(expression);
    return (
      <span>
        {scriptParts.map((part) =>
          part.match(expression) ? (
            <span style={{ color: theme.palette.primary.main }}>
              {replaceString}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <Dialog
      open={open}
      scroll="paper"
      fullWidth
      maxWidth="xl"
      onClose={onClose}
    >
      <DialogTitle>Confirm changes to campaign scripts:</DialogTitle>
      <DialogContent>
        {Object.entries(changesList).map(([campaignId, changes]) => (
          <div key={campaignId}>
            <p style={{ fontSize: "1.2em", marginBottom: 20 }}>
              {campaignId}: {changes[0].campaignName}
            </p>
            <ul key={campaignId}>
              {changes.map(({ id, script }) => (
                <li key={id} style={{ marginBottom: 20 }}>
                  <span style={{ fontWeight: 600 }}>Found:</span>{" "}
                  {colorOriginal(script)}
                  <br />
                  <span style={{ fontWeight: 600 }}>
                    Will replace with:
                  </span>{" "}
                  {colorReplacement(script)}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {isEmpty(changesList) && (
          <DialogContentText>
            No occurences were found. Check your search parameters and try
            again.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={onSubmit}
          disabled={isEmpty(changesList)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangesDialog;
