const { convertMessagePartsToMessage, saveNewIncomingMessage } = require('./twilio')
const { r } = require('../../models')

async function main() {
  const pendingMessageParts = await r.knex('pending_message_part').select('*').limit(5)
  console.log(pendingMessageParts)
  const finalMessage = await convertMessagePartsToMessage([part])
  console.log(finalMessage)
  const result = await saveNewIncomingMessage(finalMessage)
  console.log(result)
  const deleteResult = await r.knex('pending_message_part').where('id', partId).delete()
  console.log(deleteResult)
  return 'Success'
}

main().then(console.log).catch(console.error)
