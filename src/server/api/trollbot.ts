import { r } from "../models";
import { sqlResolvers } from "./lib/utils";
import type { CampaignContactRecord, UserRecord } from "./types";

export interface TrollAlarmRecord {
  message_id: number;
  trigger_token: string;
  dismissed: boolean;
  organization_id: number;
}

export const resolvers = {
  TrollAlarm: {
    ...sqlResolvers(["messageId", "messageText", "token", "dismissed"]),
    id: async (alarm: TrollAlarmRecord) => alarm.message_id,
    user: async (alarm: TrollAlarmRecord & { user?: UserRecord }) => {
      if (alarm.user) return alarm.user;
      const user = await r
        .reader("message")
        .join("user", "user.id", "message.user_id")
        .where({ "message.id": alarm.message_id })
        .first("user.*");
      return user;
    },
    contact: async (
      alarm: TrollAlarmRecord & { contact?: CampaignContactRecord }
    ) => {
      if (alarm.contact) return alarm.contact;
      const contact = await r
        .reader("message")
        .join(
          "campaign_contact",
          "campaign_contact.id",
          "message.campaign_contact_id"
        )
        .where({ "message.id": alarm.message_id })
        .first("campaign_contact.*");
      return contact;
    }
  }
};
