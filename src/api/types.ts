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
