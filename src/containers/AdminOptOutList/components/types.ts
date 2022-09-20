export enum DialogMode {
  None,
  OptIn,
  OptOut
}

export interface BulkOptParams {
  csvFile?: File | null | undefined;
  numbersList?: string | null | undefined;
}
