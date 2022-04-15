/* eslint-disable import/prefer-default-export */
import {
  useGetAssignmentCannedResponsesQuery,
  useGetCampaignCannedResponsesQuery
} from "@spoke/spoke-codegen";

import type { AssignmentIdOrCampaignId } from "./types";

export const useGetCannedResponses = (ids: AssignmentIdOrCampaignId) => {
  const assignmentId = "assignmentId" in ids ? ids.assignmentId : undefined;
  const campaignId = "campaignId" in ids ? ids.campaignId : undefined;
  const {
    data: assignmentData,
    loading: assignmentLoading,
    error: assignmentError
  } = useGetAssignmentCannedResponsesQuery({
    variables: { assignmentId: assignmentId! },
    skip: assignmentId === undefined
  });
  const {
    data: campaignData,
    loading: campaignLoading,
    error: campaignError
  } = useGetCampaignCannedResponsesQuery({
    variables: { campaignId: campaignId! },
    skip: campaignId === undefined
  });

  const cannedResponses = assignmentId
    ? assignmentData?.assignment?.cannedResponses
    : campaignData?.campaign?.cannedResponses;
  const data = { cannedResponses };
  const loading = assignmentId ? assignmentLoading : campaignLoading;
  const error = assignmentId ? assignmentError : campaignError;

  return { data, loading, error };
};
