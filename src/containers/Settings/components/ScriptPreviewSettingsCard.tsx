import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import {
  useGetScriptPreviewSettingsQuery,
  useUpdateScriptPreviewSettingsMutation
} from "@spoke/spoke-codegen";
import React from "react";

export interface ScriptPreviewSettingsCardProps {
  organizationId: string;
  style?: React.CSSProperties;
}

export const ScriptPreviewSettingsCard: React.FC<ScriptPreviewSettingsCardProps> = (
  props
) => {
  const { organizationId, style } = props;

  const getSettingsState = useGetScriptPreviewSettingsQuery({
    variables: { organizationId }
  });
  const settings = getSettingsState?.data?.organization?.settings;

  const [
    setForSupervols,
    updateState
  ] = useUpdateScriptPreviewSettingsMutation();

  const working = getSettingsState.loading || updateState.loading;
  const errorMsg =
    getSettingsState.error?.message ?? updateState.error?.message;

  const handleToggleScriptPreviewClick = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    forSupervols: boolean
  ) => {
    if (working) return;

    await setForSupervols({
      variables: {
        organizationId,
        forSupervols
      }
    });
  };

  return (
    <Card style={style}>
      <CardHeader title="Script Preview Settings" disableTypography />
      <CardContent>
        {errorMsg && <p>Error: {errorMsg}</p>}
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.scriptPreviewForSupervolunteers ?? true}
                onChange={handleToggleScriptPreviewClick}
              />
            }
            label="Allow Supervolunteers to see Script Preview?"
          />
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default ScriptPreviewSettingsCard;
