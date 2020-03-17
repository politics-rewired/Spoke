import { r } from "../models";
import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  TrollAlarm: {
    ...sqlResolvers(["messageId", "messageText", "token", "dismissed"]),
    id: async alarm => alarm.message_id,
    user: async alarm => {
      if (alarm.user) return alarm.user;
      return r
        .reader("message")
        .join("user", "user.id", "message.user_id")
        .select("user.*")
        .where({ "message.id": alarm.message_id });
    }
  }
};
