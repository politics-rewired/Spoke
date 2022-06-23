export function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns: boolean,
  includeArchivedCampaigns: boolean
): Record<string, any> {
  let isArchived;
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true;
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false;
  }

  if (isArchived !== undefined) {
    return { isArchived };
  }

  return {};
}

export function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations: boolean,
  includeOptedOutConversations: boolean
) {
  let isOptedOut;
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true;
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false;
  }

  if (isOptedOut !== undefined) {
    return { isOptedOut };
  }

  return {};
}
