import { r } from '../../models'
import log from '../../../lib/log'

export async function getLastMessage({ contactNumber, service }) {
  const lastMessage = await r.knex('message')
    .where({
      contact_number: contactNumber,
      is_from_contact: false,
      service
    })
    .orderBy('created_at', 'desc')
    .limit(1)
    .first('assignment_id', 'campaign_contact_id')

  return lastMessage
}

export async function saveNewIncomingMessage(messageInstance) {
  // if (messageInstance.service_id) {
  //   const countResult = await r.getCount(r.knex('message').where('service_id', messageInstance.service_id))
  //   if (countResult) {
  //     log.error('DUPLICATE MESSAGE SAVED', countResult.count, messageInstance)
  //   }
  // }
  await messageInstance.save()

  await r.table('campaign_contact')
    .getAll(messageInstance.assignment_id, { index: 'assignment_id' })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: 'needsResponse', updated_at: 'now()' })
}
