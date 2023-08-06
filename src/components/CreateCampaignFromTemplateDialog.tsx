import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import type { TemplateCampaignFragment } from "@spoke/spoke-codegen";
import {
  GetAdminCampaignsDocument,
  useCreateCampaignFromTemplateMutation,
  useGetTemplateCampaignsQuery
} from "@spoke/spoke-codegen";
import React, { useCallback, useMemo, useState } from "react";

import NumberCopiesField from "./NumberCopiesField";

export interface CreateCampaignFromTemplateDialogProps {
  organizationId: string;
  open: boolean;
  onClose?: () => Promise<void> | void;
  defaultTemplate?: TemplateCampaignFragment;
}

// eslint-disable-next-line max-len
export const CreateCampaignFromTemplateDialog: React.FC<CreateCampaignFromTemplateDialogProps> = (
  props
) => {
  const [
    selectedTemplate,
    setSelectedTemplate
  ] = useState<TemplateCampaignFragment | null>(props.defaultTemplate ?? null);
  const [quantity, setQuantity] = useState<number>(1);
  const { data, error } = useGetTemplateCampaignsQuery({
    variables: { organizationId: props.organizationId }
  });
  const [
    createFromTemplate,
    { loading: working }
  ] = useCreateCampaignFromTemplateMutation({
    refetchQueries: [GetAdminCampaignsDocument]
  });

  const templates =
    data?.organization?.templateCampaigns?.edges?.map(({ node }) => node) ?? [];

  const handleChangeTemplate = useCallback(
    (
      _event: React.ChangeEvent<unknown>,
      value: TemplateCampaignFragment | null
    ) => {
      setSelectedTemplate(value);
    },
    [setSelectedTemplate]
  );

  const handleChangeQuantity: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => setQuantity(event.target.valueAsNumber);

  const canCreate = useMemo(
    () => quantity !== null && selectedTemplate !== null && !working,
    [quantity, selectedTemplate, working]
  );

  const handleClickCreate = useCallback(async () => {
    if (!(quantity !== null && selectedTemplate !== null && !working)) return;

    await createFromTemplate({
      variables: { templateId: selectedTemplate.id, quantity }
    });
    props.onClose?.();
  }, [quantity, selectedTemplate, createFromTemplate, props.onClose]);

  return (
    <Dialog
      onClose={props.onClose}
      aria-labelledby="create-from-template-dialog-title"
      open={props.open}
    >
      <DialogTitle id="create-from-template-dialog-title">
        Create Campaign from Template
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Select a campaign template to create from
        </DialogContentText>
        {error && (
          <DialogContentText>
            Error fetching templates: {error.message}
          </DialogContentText>
        )}
        <Autocomplete
          options={templates}
          getOptionLabel={(template) => template.title}
          value={selectedTemplate}
          onChange={handleChangeTemplate}
          style={{ width: 300 }}
          renderInput={(params) => (
            <TextField {...params} label="Template campaign name" />
          )}
        />
        <br />
        <NumberCopiesField qty={quantity} onChange={handleChangeQuantity} />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          color="primary"
          disabled={!canCreate}
          onClick={handleClickCreate}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCampaignFromTemplateDialog;
