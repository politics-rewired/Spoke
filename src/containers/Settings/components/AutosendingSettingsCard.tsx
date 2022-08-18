import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import type { SelectInputProps } from "@material-ui/core/Select/SelectInput";
import Alert from "@material-ui/lab/Alert";
import {
  AutosendingControlsMode,
  useGetAutosendingSettingsQuery,
  useUpdateAutosendingSettingsMutation
} from "@spoke/spoke-codegen";
import React from "react";

export interface AutosendingSettingsCardProps {
  organizationId: string;
  style?: React.CSSProperties;
}

export const AutosendingSettingsCard: React.FC<AutosendingSettingsCardProps> = (
  props
) => {
  const { organizationId, style } = props;

  const getSettingsState = useGetAutosendingSettingsQuery({
    variables: { organizationId }
  });
  const settings = getSettingsState?.data?.organization?.settings;

  const [
    setDefaultControlsMode,
    updateState
  ] = useUpdateAutosendingSettingsMutation();

  const working = getSettingsState.loading || updateState.loading;
  const errorMsg =
    getSettingsState.error?.message ?? updateState.error?.message;

  const handleChangeControlsMode: SelectInputProps["onChange"] = async (
    event
  ) => {
    if (working) return;

    const controlsMode = event.target.value as AutosendingControlsMode;

    await setDefaultControlsMode({
      variables: {
        organizationId,
        controlsMode
      }
    });
  };

  return (
    <Card style={style}>
      <CardHeader title="Autosending Settings" disableTypography />
      <CardContent>
        {errorMsg && <Alert severity="error">Error: {errorMsg}</Alert>}
        <FormGroup row>
          <FormControl style={{ width: 260 }}>
            <InputLabel id="autosending-controls-mode-label">
              Default Autosending Controls Mode
            </InputLabel>
            <Select
              labelId="autosending-controls-mode-label"
              id="autosending-controls-mode-select"
              fullWidth
              value={settings?.defaultAutosendingControlsMode}
              onChange={handleChangeControlsMode}
            >
              <MenuItem value={AutosendingControlsMode.Basic}>Basic</MenuItem>
              <MenuItem value={AutosendingControlsMode.Detailed}>
                Detailed
              </MenuItem>
            </Select>
          </FormControl>
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default AutosendingSettingsCard;
