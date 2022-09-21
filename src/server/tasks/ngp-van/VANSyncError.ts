export class VANSyncError extends Error {
  status: number;

  body: string;

  constructor(status: number, body: string) {
    super("sync_campaign_to_van__incorrect_response_code");
    this.status = status;
    this.body = body;
  }
}

export default VANSyncError;
