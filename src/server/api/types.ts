import { RequestHandler } from "express";

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
