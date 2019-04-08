try {
  require('dotenv').config()
} catch (ex) {
  // do nothing
}

const config = {
  client: 'mysql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
};

const db = require('knex')(config);

async function main() {
  let oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const selectResult = await db.raw(`
    select id
    from campaign_contact
    where assignment_id is not null
      and message_status = 'needsMessage'
      and updated_at > ?
  `, [oneHourAgo])

  const campaignContactIdsToRelease = selectResult[0].map(rdp => rdp.id)
  console.log(campaignContactIdsToRelease)

  const updateResult = await db('campaign_contact')
    .update({
      assignment_id: null,
      updated_at: db.raw('now()')
    })
    .whereIn('id', campaignContactIdsToRelease)
  
  return `Released ${updateResult} unsent initials that had stayed untouched for an hour`
}

main()
  .then(console.log)
  .catch(console.error)