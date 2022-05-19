import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import AddBoxIcon from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import Skeleton from "@material-ui/lab/Skeleton";
import {
  GetCampaignVariablesDocument,
  useEditCampaignVariablesMutation,
  useGetCampaignVariablesQuery
} from "@spoke/spoke-codegen";
import React, { useCallback } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import { asSection, FullComponentProps } from "../components/SectionWrapper";

const useStyles = makeStyles((theme) => ({
  wrapper: {
    margin: theme.spacing(1),
    position: "relative",
    display: "inline-block"
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
}));

type FormValues = {
  campaignVariables: { name: string; value: string | null }[];
};

const CampaignVariablesForm: React.FC<FullComponentProps> = (props) => {
  const { campaignId } = props;

  // Form
  const { handleSubmit, watch, control, formState, reset, trigger } = useForm<
    FormValues
  >({
    defaultValues: { campaignVariables: [] }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "campaignVariables"
  });
  const watchFieldArray = watch("campaignVariables");
  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchFieldArray[index]
    };
  });

  // Apollo
  const {
    loading: fetchLoading,
    error: fetchError
  } = useGetCampaignVariablesQuery({
    variables: { campaignId },
    onCompleted: (data) => {
      const nodes =
        data?.campaign?.campaignVariables.edges.map(({ node }) => node) ?? [];
      const campaignVariables = nodes.map((thing) => ({
        name: thing.name,
        value: thing.value ?? ""
      }));
      // Wait for useForm's subscription to be ready before reset() sends a signal to flush form state update
      setTimeout(() => {
        reset({ campaignVariables });
      }, 1);
    }
  });
  const [
    editVariables,
    { loading: saveLoading }
  ] = useEditCampaignVariablesMutation({
    refetchQueries: [
      { query: GetCampaignVariablesDocument, variables: { campaignId } }
    ]
  });

  // UX
  const classes = useStyles();

  const handleAddVariable = useCallback(
    () =>
      append({
        name: "",
        value: ""
      }),
    [append]
  );

  const handleRemoveVariable = useCallback(
    (index: number) => {
      remove(index);
      trigger("campaignVariables");
    },
    [remove, trigger]
  );

  const handleSave = useCallback(
    async (formValues: FormValues) => {
      const payload = formValues.campaignVariables.filter(({ name }) => !!name);
      await editVariables({
        variables: { campaignId, campaignVariables: payload }
      });
    },
    [editVariables]
  );

  // formState.isDirty is not capturing arrayFields.remove so we use dirtyFields instead
  const isDirty = (formState.dirtyFields.campaignVariables?.length ?? 0) > 0;

  return (
    <>
      <CampaignFormSectionHeading
        title="Campaign Variables"
        subtitle="These variables may be used in interaction steps and canned responses. This can be especially useful when using Template Campaign."
      />
      {fetchLoading && (
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Skeleton variant="rect" animation="wave" height={40} />
          </Grid>
          <Grid item xs={6}>
            <Skeleton variant="rect" animation="wave" height={40} />
          </Grid>
        </Grid>
      )}
      {fetchError && (
        <p>Error fetching campaign variables: {fetchError.message}</p>
      )}
      <form onSubmit={handleSubmit(handleSave)}>
        {!fetchLoading && !fetchError && (
          <>
            <Grid container spacing={1}>
              {controlledFields.map((arrayField, index) => {
                return (
                  <Grid key={arrayField.id} container item xs={12} spacing={3}>
                    <Grid item xs={2}>
                      <Controller
                        name={`campaignVariables.${index}.name`}
                        control={control}
                        rules={{ required: "Variable name is required!" }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="Variable name"
                            error={error !== undefined}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={9}>
                      <Controller
                        name={`campaignVariables.${index}.value`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="Variable value"
                            error={error !== undefined}
                            helperText={error?.message}
                            fullWidth
                            multiline
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton onClick={() => handleRemoveVariable(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                );
              })}
              {controlledFields.length === 0 && (
                <Grid container item xs={12} spacing={3}>
                  <Grid item xs={12}>
                    <p style={{ textAlign: "center" }}>No campaign variables</p>
                  </Grid>
                </Grid>
              )}
            </Grid>
            <Grid container spacing={1}>
              <Grid item xs style={{ flexGrow: 1 }} />
              <Grid item xs={2}>
                <Button
                  variant="contained"
                  endIcon={<AddBoxIcon />}
                  onClick={handleAddVariable}
                >
                  Add Variable
                </Button>
              </Grid>
            </Grid>
          </>
        )}
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <div className={classes.wrapper}>
              <Button
                variant="contained"
                color="primary"
                disabled={fetchLoading || saveLoading || !isDirty}
                type="submit"
              >
                {props.saveLabel}
              </Button>
              {saveLoading && (
                <CircularProgress
                  size={24}
                  className={classes.buttonProgress}
                />
              )}
            </div>
          </Grid>
        </Grid>
      </form>
    </>
  );
};

const CampaignVariablesSection = asSection({
  title: "Campaign Variables",
  readinessName: "campaignVariables",
  jobQueueNames: [],
  expandAfterCampaignStarts: true,
  expandableBySuperVolunteers: false
})(CampaignVariablesForm);

export default CampaignVariablesSection;
