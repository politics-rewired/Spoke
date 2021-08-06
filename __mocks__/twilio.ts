import faker from 'faker';

export const mockDeliveryReportBody = (messageId: string) => ({
  MessageSid: messageId,
  MessageStatus: 'delivered'
});
