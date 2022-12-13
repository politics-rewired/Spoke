import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import {
  useGetCampaignStatusQuery,
  useSetCampaignApprovedMutation
} from "@spoke/spoke-codegen";
import React, { useCallback } from "react";

import { useSpokeContext } from "../../../client/spoke-context";
import { useAuthzContext } from "../../AuthzProvider";

export interface ApproveCampaignButtonProps {
  campaignId: string;
}

export const ApproveCampaignButton: React.FC<ApproveCampaignButtonProps> = (
  props
) => {
  const { campaignId } = props;
  const { isSuperadmin } = useAuthzContext();
  const { orgSettings } = useSpokeContext();
  const { data, loading } = useGetCampaignStatusQuery({
    variables: { campaignId }
  });
  const isApproved = data?.campaign?.isApproved ?? false;
  const [
    setCampaignApproved,
    { loading: approving }
  ] = useSetCampaignApprovedMutation();

  const working = loading || approving;

  const tooltipText =
    !isSuperadmin && orgSettings?.startCampaignRequiresApproval
      ? "Superadmin approval required"
      : "";

  const handleClick = useCallback(() => {
    if (!isSuperadmin || working) return;

    setCampaignApproved({
      variables: { campaignId, approved: !isApproved }
    });
  }, [campaignId, isSuperadmin, working, isApproved, setCampaignApproved]);

  if (!isSuperadmin || !orgSettings?.startCampaignRequiresApproval) {
    return null;
  }

  return (
    <Tooltip title={tooltipText} placement="top">
      <span>
        <Button
          variant="contained"
          style={{ width: 120 }}
          disabled={working || !data}
          onClick={handleClick}
        >
          {isApproved ? "Unapprove" : "Approve"}
        </Button>
      </span>
    </Tooltip>
  );
};

export default ApproveCampaignButton;
