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
