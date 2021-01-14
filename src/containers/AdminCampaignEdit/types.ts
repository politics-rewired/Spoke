export interface CampaignReadinessType {
  basics: boolean;
  textingHours: boolean;
  integration: boolean;
  contacts: boolean;
  autoassign: boolean;
  cannedResponses: boolean;
  interactions: boolean;
}

export interface DataSourceItemType<T = string> {
  text: string;
  rawValue: T;
  value: React.ReactNode;
}
