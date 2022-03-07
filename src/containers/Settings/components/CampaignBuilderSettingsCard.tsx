import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import React from "react";

import {
  useGetCampaignBuilderSettingsQuery,
  useUpdateCampaignBuilderSettingsMutation
} from "../../../../libs/spoke-codegen/src";
import { useAuthzContext } from "../../../components/AuthzProvider";

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
      </CardContent>
    </Card>
  );
};

export default CampaignBuilderSettingsCard;
