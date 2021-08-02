import faker from 'faker';

import { NumbersDeliveryReportPayload, NumbersSendStatus } from "../src/server/api/lib/assemble-numbers";

export const mockDeliveryReportBody = (messageId: string): NumbersDeliveryReportPayload => ({
  errorCodes: [],
  eventType: NumbersSendStatus.Delivered,
  generatedAt: new Date().toISOString(),
  messageId,
  profileId: faker.random.uuid(),
  sendingLocationId: faker.random.uuid(),
  extra: {
    num_segments: 1,
    num_media: 0
  }
});
