import type { Notice } from "../../../api/notice";

export type OrgLevelNotificationGetter = (
  userId: string,
  organizationId?: string
) => Promise<Notice[]> | Notice[];
