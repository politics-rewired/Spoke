import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import {
  useGetCampaignStatusQuery,
  useStartCampaignMutation
} from "@spoke/spoke-codegen";
import React, { useCallback } from "react";

import { useSpokeContext } from "../../../client/spoke-context";
import { useAuthzContext } from "../../AuthzProvider";

export interface StartCampaignButtonProps {
  campaignId: string;
  isCompleted: boolean;
}

export const StartCampaignButton: React.FC<StartCampaignButtonProps> = (
  props
) => {
  const { campaignId, isCompleted } = props;
  const authz = useAuthzContext();
  const { orgSettings } = useSpokeContext();
  const { data, loading } = useGetCampaignStatusQuery({
    variables: { campaignId }
  });
  const [startCampaign] = useStartCampaignMutation();

  const requiresApproval =
    !authz.isSuperadmin &&
    (orgSettings?.startCampaignRequiresApproval ?? true) &&
    !(data?.campaign?.isApproved ?? false);

  const disabled =
    !isCompleted ||
    loading ||
    (data?.campaign?.isStarted ?? false) ||
    requiresApproval;

  const tooltipText = requiresApproval ? "Superadmin approval required" : "";

  const handleClick = useCallback(() => {
    if (disabled) return;

    startCampaign({ variables: { campaignId } });
  }, [startCampaign, campaignId]);

  const startText = data?.campaign?.isStarted
    ? "Already started"
    : authz.isSuperadmin &&
      !data?.campaign?.isApproved &&
      orgSettings?.startCampaignRequiresApproval
    ? "Approve and start"
    : "Start this campaign";

  return (
    <Tooltip title={tooltipText} placement="top">
      <span>
        <Button
          variant="contained"
          color="primary"
          style={{ width: 210 }}
          disabled={disabled}
          onClick={handleClick}
        >
          {startText}
        </Button>
      </span>
    </Tooltip>
  );
};

export default StartCampaignButton;
