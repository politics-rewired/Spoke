const { convertMessagePartsToMessage, saveNewIncomingMessage } = require('./twilio')
const { r } = require('../../models')

async function main() {
  const pendingMessageParts = await r.knex('pending_message_part').select('*').limit(5)
  const finalMessage = await convertMessagePartsToMessage([part])
  await saveNewIncomingMessage(finalMessage)
  await r.knex('pending_message_part').where('id', partId).delete()
}

main().then(console.log).catch(console.error)
