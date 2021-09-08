import { Notice } from "../../../api/notice";
import { get10DlcBrandNotices } from "./register-10dlc-brand";
import { OrgLevelNotificationGetter } from "./types";

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
