const twilio = require('./twilio')
const { r } = require('../../models')

async function main() {
  const part = await r.knex('pending_message_part').select('*').first()
  console.log(part)
  const finalMessage = await twilio.convertMessagePartsToMessage([part])
  console.log(finalMessage)
  const result = await twilio.saveNewIncomingMessage(finalMessage)
  console.log(result)
  const deleteResult = await r.knex('pending_message_part').where('id', partId).delete()
  console.log(deleteResult)
  return 'Success'
}

main().then(console.log).catch(console.error)
