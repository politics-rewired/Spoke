import { mapFieldsToModel, normalizeTimezone } from './lib/utils'
import { Message } from '../models'

export const resolvers = {
  Message: {
    ...mapFieldsToModel([
      'id',
      'text',
      'userNumber',
      'contactNumber',
      'isFromContact'
    ], Message),
    'campaignId': (instance) => instance['campaign_id'],
    'createdAt': (instance) => {
      return normalizeTimezone(instance.created_at)
    },
    'userId': (instance) => instance['user_id'],
    'sendStatus': (instance) => instance['send_status']
  }
}
