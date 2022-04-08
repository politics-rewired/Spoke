import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import CloseIcon from "@material-ui/icons/Close";
import { useCloseConversationMutation } from "@spoke/spoke-codegen";
import React, { useCallback, useState } from "react";

import { useSpokeContext } from "../../../client/spoke-context";
import { useAuthzContext } from "../../AuthzProvider";
import ManageSurveyResponses from "./ManageSurveyResponses";
import ManageTags from "./ManageTags";

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1
  },
  spacer: { flex: "1" }
};

interface Props {
  organizationId: string;
  campaign: any;
  contact: any;
}

const SurveyColumn: React.FC<Props> = (props) => {
  const { campaign, contact, organizationId } = props;

  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const { orgSettings } = useSpokeContext();
  const { isAdmin } = useAuthzContext();

  const [closeConversation] = useCloseConversationMutation({
    refetchQueries: ["getContactTags"]
  });

  const handleClickClose = useCallback(async () => {
    setIsWorking(true);
    try {
      const response = await closeConversation({
        variables: { campaignContactId: props.contact.id }
      });
      if (response.errors) throw response.errors;
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsWorking(false);
    }
  }, [setIsWorking, setErrorMessage, closeConversation]);

  const handleDismissError = useCallback(() => setErrorMessage(undefined), [
    setErrorMessage
  ]);

  const showScriptPreview =
    isAdmin || orgSettings?.scriptPreviewForSupervolunteers;

  return (
    <div style={styles.container}>
      <ManageSurveyResponses contact={contact} campaign={campaign} />
      <div style={styles.spacer} />
      <div style={{ display: "flex" }}>
        <div style={styles.spacer} />
        {showScriptPreview ? (
          <Button
            key="open-script-preview"
            variant="contained"
            style={{ marginRight: "10px" }}
            onClick={() => {
              window.open(`/preview/${campaign.previewUrl}`, "_blank");
            }}
          >
            Open Script Preview
          </Button>
        ) : null}
        <Button
          variant="contained"
          disabled={isWorking}
          style={{ marginRight: "10px" }}
          onClick={handleClickClose}
        >
          End Conversation
        </Button>
        <ManageTags organizationId={organizationId} contactId={contact.id} />
      </div>
      <Snackbar
        open={errorMessage !== undefined}
        message={errorMessage || ""}
        autoHideDuration={4000}
        onClose={handleDismissError}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleDismissError}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default SurveyColumn;
