import { r } from "../models";
import { sqlResolvers } from "./lib/utils";
import { UserRecord } from "./types";

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
      return r
        .reader("message")
        .join("user", "user.id", "message.user_id")
        .select("user.*")
        .where({ "message.id": alarm.message_id });
    }
  }
};
