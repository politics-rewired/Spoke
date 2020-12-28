export interface GraphQLType {
  __typename: string;
}

export enum CampaignExportType {
  SPOKE = "SPOKE",
  VAN = "VAN"
}

export enum ExternalDataCollectionStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  INACTIVE = "INACTIVE"
}

export enum TextRequestType {
  UNSENT = "UNSENT",
  UNREPLIED = "UNREPLIED"
}

export interface PageInfo {
  limit: number;
  offset: number;
  next: number;
  previous: number;
  total: number;
}

export interface MessageInput {
  text?: string | null;
  contactNumber?: string | null;
  assignmentId?: string | null;
  userId?: string | null;
  versionHash?: string | null;
}

export interface ContactActionInput {
  cell: string;
  assignmentId?: string | null;
  message?: MessageInput | null;
  reason?: string | null;
}

export interface QuestionResponseSyncTargetInput {
  configId: string;
  responseOptionId?: string;
  activistCodeId?: string;
  resultCodeId?: string;
}

export interface Action {
  name: string;
  display_name: string;
  instructions: string;
}
