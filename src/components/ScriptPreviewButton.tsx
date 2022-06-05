import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import { useGetCampaignScriptPreviewQuery } from "@spoke/spoke-codegen";
import React from "react";

import { useSpokeContext } from "../client/spoke-context";
import { useAuthzContext } from "./AuthzProvider";

export interface ScriptPreviewButtonProps {
  campaignId: string;
}

export const ScriptPreviewButton: React.FC<ScriptPreviewButtonProps> = (
  props
) => {
  const { campaignId } = props;
  const { orgSettings } = useSpokeContext();
  const { isAdmin } = useAuthzContext();

  const showScriptPreview =
    isAdmin || orgSettings?.scriptPreviewForSupervolunteers;

  const { data } = useGetCampaignScriptPreviewQuery({
    variables: { campaignId }
  });
  const previewUrl = data?.campaign?.previewUrl;

  return showScriptPreview ? (
    <Tooltip title="View an outline of your script" placement="top">
      <Button
        key="open-script-preview"
        variant="contained"
        onClick={() => {
          window.open(`/preview/${previewUrl}`, "_blank");
        }}
      >
        Open Script Preview
      </Button>
    </Tooltip>
  ) : null;
};

export default ScriptPreviewButton;
