import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Paper from "@material-ui/core/Paper";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import Autocomplete, {
  AutocompleteChangeReason
} from "@material-ui/lab/Autocomplete";
import {
  Campaign,
  useBulkUpdateScriptMutation,
  useGetCampaignsBulkScriptEditorQuery,
  useGetScriptUpdateChangesLazyQuery
} from "@spoke/spoke-codegen";
import groupBy from "lodash/groupBy";
import isEmpty from "lodash/isEmpty";
import React, { useState } from "react";

import { formatErrorMessage } from "../hoc/with-operations";
import ChangesDialog from "./ChangesDialog";

const PROTECTED_CHARACTERS = ["/"];

const styles = {
  paddedPaper: {
    padding: "10px",
    marginBottom: "15px"
  },
  code: {
    color: "#000000",
    backgroundColor: "#DDDDDD",
    fontFamily: "monospace",
    fontSize: "1.2em",
    fontStyle: "normal",
    padding: "2px 5px",
    borderRadius: "3px"
  }
};

const AdminBulkScriptEditor: React.FC = (props) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [changesList, setChangesList] = useState<any>(null);
  const [flaggedCharacters, setFlaggedCaracters] = useState<Array<string>>([]);
  const [confirmFlaggedCharacters, setConfirmFlaggedCharacters] = useState<
    boolean
  >(false);
  const [searchString, setSearchString] = useState<string>("");
  const [replaceString, setReplaceString] = useState<string>("");
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Array<Campaign>>(
    []
  );

  const campaignsFilter = includeArchived
    ? {}
    : {
        isArchived: false
      };

  const { data: campaignsList } = useGetCampaignsBulkScriptEditorQuery({
    variables: {
      campaignsFilter,
      organizationId: props.match.params.organizationId
    }
  });

  const [getScriptUpdateChanges] = useGetScriptUpdateChangesLazyQuery({
    variables: {
      findAndReplace: {
        searchString,
        replaceString,
        campaignIds: selectedCampaigns.map((c) => c.id)
      },
      organizationId: props.match.params.organizationId
    }
  });

  const [bulkUpdateScript] = useBulkUpdateScriptMutation({
    variables: {
      findAndReplace: {
        replaceString,
        searchString,
        campaignIds: selectedCampaigns.map((c) => c.id)
      },
      organizationId: props.match.params.organizationId
    }
  });

  const handleChangeSearchString = (
    event: React.ChangeEvent<{ value: string }>
  ) => {
    const newSearchString = event.target.value;
    const newFlaggedCharacters = PROTECTED_CHARACTERS.filter(
      (character) => newSearchString.indexOf(character) > -1
    );
    setSearchString(newSearchString);
    setFlaggedCaracters(newFlaggedCharacters);
  };

  const handleChangeReplaceString = (
    event: React.ChangeEvent<{ value: string }>
  ) => {
    setReplaceString(event.target.value);
  };

  const handleToggleIncludeArchived = (
    _event: React.ChangeEvent,
    newIncludeArchived: boolean
  ) => {
    setIncludeArchived(newIncludeArchived);
  };

  const handleReplaceClicked = async () => {
    const response = await getScriptUpdateChanges();

    const scriptsByCampaign =
      groupBy(response?.data?.bulkUpdateScriptChanges, "campaignId") ?? {};

    setChangesList(scriptsByCampaign);
  };

  const submitJob = async () => {
    setChangesList(null);
    setIsSubmitting(true);
    try {
      const response = await bulkUpdateScript();
      if (response.errors) throw response.errors;
      setResult(response?.data?.bulkUpdateScript);
    } catch (mutationError: any) {
      setError(formatErrorMessage(mutationError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitJob = async () => {
    if (flaggedCharacters.length > 0) {
      setConfirmFlaggedCharacters(true);
    } else {
      submitJob();
    }
  };

  const handleConfirmSubmit = () => {
    setConfirmFlaggedCharacters(false);
    submitJob();
  };

  const handleClose = () => {
    setError("");
    setResult(null);
    setConfirmFlaggedCharacters(false);
  };

  const handleCloseChanges = () => {
    setChangesList(null);
  };

  const handleCampaignIdsChanged = (
    _event: React.ChangeEvent,
    value: Array<Campaign>,
    _reason: AutocompleteChangeReason
  ) => {
    setSelectedCampaigns(value);
  };

  const isSubmitDisabled =
    isSubmitting || isEmpty(searchString) || isEmpty(replaceString);

  const flaggedCharacterActions = [
    <Button key="cancel" onClick={handleClose}>
      Cancel
    </Button>,
    <Button key="confirm" color="primary" onClick={handleConfirmSubmit}>
      Confirm
    </Button>
  ];

  const dialogActions = [
    <Button key="ok" color="primary" onClick={handleClose}>
      OK
    </Button>
  ];

  return (
    <div>
      <h1>Bulk Script Editor</h1>
      <Paper style={styles.paddedPaper}>
        <p style={{ fontSize: "1.3em" }}>Find and replace</p>
        <TextField
          label="Replace this text..."
          value={searchString}
          fullWidth
          disabled={isSubmitting}
          onChange={handleChangeSearchString}
        />
        {flaggedCharacters.length > 0 && (
          <p style={{ color: "#FFAA00" }}>
            Warning: Your search text contains the following special characters:{" "}
            {flaggedCharacters.map((char) => (
              <span key={char} style={styles.code}>
                {char}
              </span>
            ))}{" "}
            Be careful with this!
          </p>
        )}
        <TextField
          label="...with this text"
          value={replaceString}
          fullWidth
          disabled={isSubmitting}
          onChange={handleChangeReplaceString}
        />
        <p style={{ fontStyle: "italic" }}>
          Note: the text must be an exact match! For example, there a couple
          apostraphe characters: <span style={styles.code}>'</span> vs{" "}
          <span style={styles.code}>’</span> )
        </p>
      </Paper>
      <Paper style={styles.paddedPaper}>
        <p style={{ fontSize: "1.3em" }}>Filter campaigns</p>
        <FormControlLabel
          label="Include archived campaigns? "
          labelPlacement="start"
          control={
            <Switch
              checked={includeArchived}
              onChange={handleToggleIncludeArchived}
              disabled={isSubmitting}
            />
          }
        />
        <p>Restrict to campaigns beginning with text (optional):</p>
        <Autocomplete
          disableCloseOnSelect
          multiple
          fullWidth
          options={campaignsList?.organization?.campaigns?.campaigns ?? []}
          getOptionLabel={(option) => `${option.id}: ${option.title}`}
          getOptionSelected={(option, selected) => option.id === selected.id}
          onChange={handleCampaignIdsChanged}
          value={selectedCampaigns}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="Select campaigns to restrict to"
            />
          )}
        />
      </Paper>
      <Button
        variant="contained"
        color="primary"
        disabled={isSubmitDisabled}
        onClick={handleReplaceClicked}
      >
        {isSubmitting ? "Working..." : "Find & replace"}
      </Button>
      {confirmFlaggedCharacters && (
        <Dialog open onClose={handleClose}>
          <DialogTitle>Confirm Flagged Characters</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to run a bulk script update with special
              characters?
            </DialogContentText>
            <DialogContentText>
              If you don't know what this means, you should cancel and ask an
              admin!
            </DialogContentText>
          </DialogContent>
          <DialogActions>{flaggedCharacterActions}</DialogActions>
        </Dialog>
      )}
      {error && (
        <Dialog open onClose={handleClose}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Spoke ran into the following error when trying to update scripts:
            </DialogContentText>
            <p style={{ fontFamily: "monospace" }}>{error}</p>
          </DialogContent>
          <DialogActions>{dialogActions}</DialogActions>
        </Dialog>
      )}
      {result !== null && (
        <Dialog
          open
          scroll="paper"
          fullWidth
          maxWidth="xl"
          onClose={handleClose}
        >
          <DialogTitle>{`Updated ${result.length} Occurence(s)`}</DialogTitle>
          <DialogContent>
            <ul>
              {result.map(({ campaignId, found, replaced }) => (
                <li key={`${campaignId}|${found}|${replaced}`}>
                  Campaign ID: {campaignId}
                  <br />
                  Found: <span style={styles.code}>{found}</span>
                  <br />
                  Replaced with: <span style={styles.code}>{replaced}</span>
                </li>
              ))}
            </ul>
            {result.length === 0 && (
              <DialogContentText>
                No occurences were found. Check your search parameters and try
                again.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>{dialogActions}</DialogActions>
        </Dialog>
      )}
      {changesList !== null && (
        <ChangesDialog
          changesList={changesList}
          open={!!changesList}
          searchString={searchString}
          replaceString={replaceString}
          onClose={handleCloseChanges}
          onSubmit={handleSubmitJob}
        />
      )}
    </div>
  );
};

export default AdminBulkScriptEditor;
