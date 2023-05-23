import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import {
  useGetCampaignInteractionStepsQuery,
  useGetCampaignStatusQuery,
  useStartCampaignMutation
} from "@spoke/spoke-codegen";
import React, { useCallback, useState } from "react";

import { useSpokeContext } from "../../../client/spoke-context";
import { useAuthzContext } from "../../AuthzProvider";
import CampaignSurveyResponseWarningDialog from "./CampaignSurveyResponseWarningDialog";

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
  const { data: campaignStepsData } = useGetCampaignInteractionStepsQuery({
    variables: { campaignId }
  });
  const [startCampaign] = useStartCampaignMutation();

  // manage warning confirmation and confirmation dialog state
  const [warningIsConfirmed, setWarningConfirmed] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

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

  const campaignInteractionSteps =
    campaignStepsData?.campaign?.interactionSteps ?? [];

  const campaignHasSurveyResponses = campaignInteractionSteps.length > 1;

  const confirmWarningAndStartCampaign = useCallback(() => {
    setWarningConfirmed(true);
    setShowConfirmDialog(false);
    startCampaign({ variables: { campaignId } });
  }, [startCampaign, campaignId, setWarningConfirmed, setShowConfirmDialog]);

  const handleClick = useCallback(() => {
    if (disabled) return;

    if (!campaignHasSurveyResponses && !warningIsConfirmed) {
      return setShowConfirmDialog(true);
    }

    startCampaign({ variables: { campaignId } });
  }, [
    startCampaign,
    campaignId,
    campaignHasSurveyResponses,
    warningIsConfirmed,
    setShowConfirmDialog
  ]);

  const startText = data?.campaign?.isStarted
    ? "Already started"
    : authz.isSuperadmin &&
      !data?.campaign?.isApproved &&
      orgSettings?.startCampaignRequiresApproval
    ? "Approve and start"
    : "Start this campaign";

  return (
    <>
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
      <CampaignSurveyResponseWarningDialog
        open={showConfirmDialog}
        campaignId={campaignId}
        confirmWarningAndStartCampaign={confirmWarningAndStartCampaign}
        setShowConfirmDialog={setShowConfirmDialog}
      />
    </>
  );
};

export default StartCampaignButton;
