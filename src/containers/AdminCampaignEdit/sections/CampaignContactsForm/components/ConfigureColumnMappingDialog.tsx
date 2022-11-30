import { useTheme } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import type { ParseResult } from "papaparse";
import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import LoadingIndicator from "../../../../../components/LoadingIndicator";

const namedFields = {
  first_name: "firstName",
  firstname: "firstName",
  firstName: "firstName",
  last_name: "lastName",
  lastname: "lastName",
  lastName: "lastName",
  cell: "cell",
  zip: "zip",
  external_id: "external_id",
  externalId: "external_id"
};

const requiredUploadFields = ["firstName", "lastName", "cell"];

export type ColumnMapping = {
  column: string;
  remap: string | null;
};

export interface ConfigureColumnMappingDialogProps {
  contactsFile: File | null;
  open: boolean;
  onClose(): void;
  onSave(columnMapping: Array<ColumnMapping>): void;
}

type FormValues = {
  columnMapping: Array<ColumnMapping>;
};

const ConfigureColumnMappingDialog: React.FC<ConfigureColumnMappingDialogProps> = ({
  contactsFile,
  onSave,
  onClose,
  open
}) => {
  const [parseComplete, setParseComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const { handleSubmit, watch, control, reset } = useForm<FormValues>({
    defaultValues: { columnMapping: [] }
  });

  const { fields } = useFieldArray({
    control,
    name: "columnMapping"
  });
  const watchFieldArray = watch("columnMapping");
  const controlledFields = fields.map((field, index) => ({
    ...field,
    ...watchFieldArray[index]
  }));

  useEffect(() => {
    if (open) {
      Papa.parse(contactsFile, {
        header: true,
        preview: 2,
        complete: (results: ParseResult<any>) => {
          const columnMapping = results?.meta?.fields?.map(
            (header: string) => ({
              column: header,
              remap: namedFields[header] ?? null
            })
          );

          reset({ columnMapping });
          setParseComplete(true);
        }
      });
    }
  }, [open]);

  const handleSave = (formValues: FormValues) => {
    const columnMapping = formValues.columnMapping.filter((cR) =>
      Boolean(cR.remap)
    );

    const remappedFields = columnMapping.map((cr) => cr.remap);

    const missingFields = requiredUploadFields.filter(
      (rUF) => !remappedFields.includes(rUF)
    );

    if (missingFields.length > 0) {
      setError(`Required Fields Missing!!! ${missingFields.join(", ")}`);
    } else {
      setError(null);
      onSave(columnMapping);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit(handleSave)}>
        <DialogTitle>Configure Column Mapping</DialogTitle>
        <DialogContent>
          {error && (
            <div style={{ color: theme.palette.warning.main }}>
              {error}
              <br />
            </div>
          )}
          {parseComplete ? (
            <div>
              {" "}
              Required Headers: firstName, lastName, cell <br /> <br />
              Optional Headers: zip, externalId
              {controlledFields.map((arrayField, index) => (
                <Grid
                  container
                  spacing={2}
                  justifyContent="center"
                  alignItems="center"
                  key={arrayField.id}
                >
                  <Grid item>
                    <Controller
                      name={`columnMapping.${index}.column`}
                      control={control}
                      render={({
                        field,
                        fieldState: { error: fieldError }
                      }) => (
                        <TextField
                          {...field}
                          variant="outlined"
                          InputProps={{ readOnly: true }}
                          error={fieldError !== undefined}
                          helperText={fieldError?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item>
                    <ArrowForwardIcon />
                  </Grid>
                  <Grid item>
                    <Controller
                      name={`columnMapping.${index}.remap`}
                      control={control}
                      render={({
                        field,
                        fieldState: { error: fieldError }
                      }) => (
                        <TextField
                          {...field}
                          variant="outlined"
                          error={fieldError !== undefined}
                          helperText={fieldError?.message}
                          label="Remap To"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              ))}
            </div>
          ) : (
            <LoadingIndicator />
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConfigureColumnMappingDialog;
