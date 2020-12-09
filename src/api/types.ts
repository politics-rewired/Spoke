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

export interface QuestionResponseSyncTargetInput {
  configId: string;
  responseOptionId?: string;
  activistCodeId?: string;
  resultCodeId?: string;
}
