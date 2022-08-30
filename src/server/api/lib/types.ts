import type { MessagingServiceType } from "../types";

export enum SpokeSendStatus {
  Queued = "QUEUED",
  Sending = "SENDING",
  Sent = "SENT",
  Delivered = "DELIVERED",
  Error = "ERROR",
  Paused = "PAUSED",
  NotAttempted = "NOT_ATTEMPTED"
}

export interface SendMessagePayload {
  id: number;
  user_id: number;
  campaign_contact_id: number;
  text: string;
  contact_number: string;
  user_number: string;
  assignment_id: number;
  send_status: SpokeSendStatus;
  service: MessagingServiceType;
  is_from_contact: boolean;
  queued_at: Date;
  send_before: string;
  script_version_hash: string;
}
