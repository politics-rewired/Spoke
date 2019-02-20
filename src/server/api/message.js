import { mapFieldsToModel } from './lib/utils'
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
      const createdAt = new Date(instance.created_at)
      createdAt.setHours(createdAt.getHours() - 5)
      return createdAt
    }
  }
}
