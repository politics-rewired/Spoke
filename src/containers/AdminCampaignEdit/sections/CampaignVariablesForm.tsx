import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import AddBoxIcon from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Skeleton from "@material-ui/lab/Skeleton";
import {
  GetCampaignVariablesDocument,
  useEditCampaignVariablesMutation,
  useGetCampaignVariablesQuery
} from "@spoke/spoke-codegen";
import sortBy from "lodash/sortBy";
import React, { useCallback, useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { allScriptFields, VARIABLE_NAME_REGEXP } from "../../../lib/scripts";
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
    data: campaignData,
    loading: fetchLoading,
    error: fetchError
  } = useGetCampaignVariablesQuery({
    variables: { campaignId },
    onCompleted: (data) => {
      const nodes =
        data?.campaign?.campaignVariables.edges.map(({ node }) => node) ?? [];
      const campaignVariables = sortBy(
        nodes.map((campaignVariable) => ({
          displayOrder: campaignVariable.displayOrder,
          name: campaignVariable.name.replace("cv:", ""),
          value: campaignVariable.value ?? ""
        })),
        ["displayOrder"]
      );

      // Wait for useForm's subscription to be ready before reset() sends a signal to flush form state update
      setTimeout(() => {
        reset({ campaignVariables });
      }, 1);
    }
  });
  const [
    editVariables,
    { loading: saveLoading, error: saveError }
  ] = useEditCampaignVariablesMutation({
    refetchQueries: [
      { query: GetCampaignVariablesDocument, variables: { campaignId } }
    ]
  });

  const isTemplate = useMemo(() => campaignData?.campaign?.isTemplate, [
    campaignData
  ]);

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
      const payload = formValues.campaignVariables
        .filter(({ name }) => !!name)
        .map((variable, index) => {
          const name = variable.name.trim().startsWith("cv:")
            ? variable.name
            : `cv:${variable.name.trim()}`;
          return { ...variable, name, displayOrder: index };
        });
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
          <Grid item xs={2}>
            <Skeleton variant="rect" animation="wave" height={40} />
          </Grid>
          <Grid item xs={10}>
            <Skeleton variant="rect" animation="wave" height={40} />
          </Grid>
        </Grid>
      )}
      {fetchError && (
        <Alert severity="error">
          <AlertTitle>Error fetching Campaign Variables</AlertTitle>
          {fetchError.message}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error">
          <AlertTitle>Error saving Campaign Variables</AlertTitle>
          {saveError.message}
        </Alert>
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
                        rules={{
                          required: "Variable name is required!",
                          validate: (value) => {
                            if (allScriptFields([]).includes(value)) {
                              return "Required CSV field names cannot be used for variable names!";
                            }
                            if (!VARIABLE_NAME_REGEXP.test(value)) {
                              return "Special characters cannot be used for variable names!";
                            }
                            return true;
                          }
                        }}
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
                            error={error !== undefined && isTemplate !== true}
                            helperText={
                              isTemplate
                                ? "Cannot set values on template campaigns"
                                : error?.message
                            }
                            disabled={isTemplate}
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
