import { RequestHandler } from "express";
import { boolean, string } from "yup";

export interface RelayPageArgs {
  after: string | null;
  first: number | null;
}

export enum MessagingServiceType {
  AssembleNumbers = "assemble-numbers",
  Twilio = "twilio"
}

export type RequestHandlerFactory = () => RequestHandler;

// Database record types
// ------------------------------------

export enum ExternalDataCollectionStatus {
  Active = "active",
  Archived = "archived",
  Inactive = "inactive"
}

export interface MessagingServiceRecord {
  messaging_service_sid: string;
  organization_id: number;
  account_sid: string;
  encrypted_auth_token: string;
  updated_at: Date;
  service_type: MessagingServiceType;
}

export interface JobRequestRecord {
  id: number;
  campaign_id: number;
  payload: string;
  queue_name: string;
  job_type: string;
  result_message: string;
  locks_queue: boolean;
  assigned: boolean;
  status: number;
  updated_at: string;
  created_at: string;
}

export interface UserRecord {
  id: number;
  auth0_id: string;
  first_name: string;
  last_name: string;
  cell: string;
  email: string;
  created_at: string;
  assigned_cell: string | null;
  is_superadmin: boolean | null;
  terms: boolean;
  updated_at: string;
}

export interface OrganizationRecord {
  id: number;
  uuid: string | null;
  name: string;
  created_at: string;
  features: string;
  texting_hours_enforced: boolean;
  texting_hours_start: number;
  texting_hours_end: number;
  updated_at: string;
}

export enum MessageStatusType {
  NeedsMessage = "needsMessage",
  NeedsResponse = "needsResponse",
  Conversation = "convo",
  Messaged = "messaged",
  Closed = "closed"
}

export interface CampaignContactRecord {
  id: number;
  campaign_id: number;
  assignment_id: number | null;
  external_id: string;
  first_name: string;
  last_name: string;
  cell: string;
  zip: string;
  custom_fields: string;
  created_at: string;
  updated_at: string;
  message_status: MessageStatusType;
  is_opted_out: boolean;
  timezone: string;
  archived: boolean;
}

export interface InteractionStepRecord {
  id: number;
  campaign_id: number;
  parent_interaction_id: number | null;
  question: string;
  answer_option: string;
  answer_actions: string;
  is_deleted: boolean;
  script_options: string[];
  created_at: string;
  updated_at: string;
}

export interface QuestionResponseRecord {
  id: number;
  campaign_contact_id: number;
  interaction_step_id: number;
  value: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export enum MessageSendStatus {
  Queued = "QUEUED",
  Sending = "SENDING",
  Sent = "SENT",
  Delivered = "DELIVERED",
  Error = "ERROR",
  Paused = "PAUSED",
  NotAttempted = "NOT_ATTEMPTED"
}

export interface MessageRecord {
  id: number;
  user_number: string;
  user_id: number | null;
  contact_number: string;
  is_from_contact: boolean;
  text: string;
  service_response: string;
  assignment_id: number;
  service: string;
  service_id: string;
  send_status: MessageSendStatus;
  created_at: string;
  queued_at: string;
  sent_at: string;
  service_response_at: string;
  send_before: string;
  campaign_contact_id: number;
  updated_at: string;
  script_version_hash: string;
  num_segments: number;
  num_media: number;
  error_codes: string;
}
