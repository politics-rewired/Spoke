import type { Notice } from "@spoke/spoke-codegen";

import { get10DlcBrandNotices } from "./register-10dlc-brand";
import type { OrgLevelNotificationGetter } from "./types";

export const getInstanceNotifications = (_userId: string): Notice[] => [];

export const getOrgLevelNotifications: OrgLevelNotificationGetter = async (
  userId,
  organizationId
) => {
  const notices: Notice[] = await Promise.all([
    get10DlcBrandNotices(userId, organizationId)
  ]).then((noticeSets) => noticeSets.flat());
  return notices;
};
