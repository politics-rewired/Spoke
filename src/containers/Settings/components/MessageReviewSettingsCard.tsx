import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import React from "react";

import {
  useGetMessageReviewSettingsQuery,
  useUpdateMessageReviewSettingsMutation
} from "../../../../libs/spoke-codegen/src";

export interface MessageReviewSettingsCardProps {
  organizationId: string;
  style?: React.CSSProperties;
}

export const MessageReviewSettingsCard: React.FC<MessageReviewSettingsCardProps> = (
  props
) => {
  const { organizationId, style } = props;

  const getSettingsState = useGetMessageReviewSettingsQuery({
    variables: { organizationId }
  });
  const settings = getSettingsState?.data?.organization?.settings;

  const [
    setScriptPreview,
    updateState
  ] = useUpdateMessageReviewSettingsMutation();

  const working = getSettingsState.loading || updateState.loading;
  const errorMsg =
    getSettingsState.error?.message ?? updateState.error?.message;

  const handleToggleScriptPreviewClick = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    forSupervols: boolean
  ) => {
    if (working) return;

    await setScriptPreview({
      variables: {
        organizationId,
        forSupervols
      }
    });
  };

  return (
    <Card style={style}>
      <CardHeader title="Message Review Settings" disableTypography />
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
            label="Allow Supervolunteers to see Script Preview in Message Review?"
          />
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default MessageReviewSettingsCard;
