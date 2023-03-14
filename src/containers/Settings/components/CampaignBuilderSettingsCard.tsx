import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import type { SelectInputProps } from "@material-ui/core/Select/SelectInput";
import Switch from "@material-ui/core/Switch";
import {
  CampaignBuilderMode,
  useGetCampaignBuilderSettingsQuery,
  useUpdateCampaignBuilderSettingsMutation
} from "@spoke/spoke-codegen";
import React from "react";

import { useAuthzContext } from "../../AuthzProvider";

export interface CampaignBuilderSettingsCardProps {
  organizationId: string;
  style?: React.CSSProperties;
}

export const CampaignBuilderSettingsCard: React.FC<CampaignBuilderSettingsCardProps> = (
  props
) => {
  const { organizationId, style } = props;
  const authz = useAuthzContext();

  const getSettingsState = useGetCampaignBuilderSettingsQuery({
    variables: { organizationId }
  });
  const settings = getSettingsState?.data?.organization?.settings;

  const [
    setRequiresApproval,
    updateState
  ] = useUpdateCampaignBuilderSettingsMutation();

  const working = getSettingsState.loading || updateState.loading;
  const errorMsg =
    getSettingsState.error?.message ?? updateState.error?.message;

  const handleToggleConfirmationClick = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    confirmationClicks: boolean
  ) => {
    if (working) return;

    await setRequiresApproval({
      variables: {
        organizationId,
        confirmationClicks
      }
    });
  };

  const handleToggleRequiresApproval = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    requiresApproval: boolean
  ) => {
    if (working || !authz.isSuperadmin) return;

    await setRequiresApproval({
      variables: {
        organizationId,
        requiresApproval
      }
    });
  };

  const handleChangeBuilderMode: SelectInputProps["onChange"] = async (
    event
  ) => {
    if (working) return;

    const builderMode = event.target.value as CampaignBuilderMode;

    await setRequiresApproval({
      variables: {
        organizationId,
        builderMode
      }
    });
  };

  return (
    <Card style={style}>
      <CardHeader title="Campaign Builder Settings" disableTypography />
      <CardContent>
        {errorMsg && <p>Error: {errorMsg}</p>}
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.confirmationClickForScriptLinks ?? true}
                onChange={handleToggleConfirmationClick}
              />
            }
            label="Require confirmation click for links in scripts?"
          />
        </FormGroup>
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.startCampaignRequiresApproval ?? false}
                disabled={!authz.isSuperadmin}
                onChange={handleToggleRequiresApproval}
              />
            }
            label={`Require superadmin approval before starting campaigns? ${
              authz.isSuperadmin ? "" : "(superadmin-only)"
            }`}
          />
        </FormGroup>
        <FormGroup row>
          <FormControl style={{ width: 200 }}>
            <InputLabel id="campaign-builder-mode-label">
              Default Builder Mode
            </InputLabel>
            <Select
              labelId="campaign-builder-mode-label"
              id="campaign-builder-mode-select"
              fullWidth
              value={settings?.defaultCampaignBuilderMode}
              onChange={handleChangeBuilderMode}
            >
              <MenuItem value={CampaignBuilderMode.Basic}>Basic</MenuItem>
              <MenuItem value={CampaignBuilderMode.Advanced}>Advanced</MenuItem>
            </Select>
          </FormControl>
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default CampaignBuilderSettingsCard;
