require("dotenv").config();
const _ = require("lodash");

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const db = require("knex")(config);

/* get list to reassign
  start with oldest first
  100 at a time


  map from SlackID --> number (with default)
  classify messages as stale
*/

// SlackId --> request number
const SUPER_TEXTERS = [
  {
    name: "Ben Packer",
    count: 20
  }
];
// ].concat([
//   'Ben Packer'
// ].map(name => ({ name, count: 100 })))

// Will return undefined when all assignments have been performed
let superTextersAssigned = 0;
async function nextSuperTexter() {
  const toReturn = SUPER_TEXTERS[superTextersAssigned];
  if (!toReturn) return undefined;

  if (toReturn.id) {
    superTextersAssigned++;
    return toReturn;
  }
  try {
    toReturn.id = await lookupByName(toReturn.name);
    superTextersAssigned++;
    return toReturn;
  } catch (error) {
    console.error(error);
  }
  superTextersAssigned++;
  return await nextSuperTexter();
}

const DEFAULT_ASSIGNMENT_SIZE = 100;
const BATCH_SIZE = 1;
const BIG_NUMBER = 99999999999;

async function go() {
  const user_id = 1;
  const campaign_id = 42;
  const amount_to_reassign = 1;
  const contactsToReassign = await getNCampaignContactsToReassignFromCampaign(
    amount_to_reassign,
    campaign_id
  );
  const messagesMatchingContacts = await getMessagesForContacts(
    contactsToReassign
  );
  const assignment_id = await ensureAssignmentId(user_id, campaign_id);
  const result = await Promise.all([
    await reassignContacts(contactsToReassign, assignment_id),
    await reassignMessages(messagesMatchingContacts, assignment_id)
  ]);
  console.log(`Reassigned ${contactsToReassign.map(c => c.id)}`);
  return contactsToReassign.length;
}

go()
  .then(console.log)
  .catch(console.error);

async function reassignContacts(contactsToReassign, assignment_id) {
  return await db("campaign_contact")
    .whereIn("id", contactsToReassign.map(c => c.id))
    .update({
      assignment_id
    });
}

async function reassignMessages(messagesToReassign, assignment_id) {
  return await db("message")
    .whereIn("id", messagesToReassign.map(m => m.id))
    .update({
      assignment_id
    });
}

async function getNCampaignContactsToReassignFromCampaign(n, campaign_id) {
  return await db("campaign_contact")
    .where({
      message_status: "needsMessage",
      campaign_id
    })
    .whereRaw(`campaign_contact.updated_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`)
    .orderBy("campaign_contact.updated_at")
    .limit(n);
}

async function getMessagesForContacts(campaign_contacts) {
  const messageArrays = await Promise.all(
    campaign_contacts.map(getMessagesForContact)
  );
  let result = [];
  for (const arr of messageArrays) {
    result = result.concat(arr);
  }
  return result;
}

async function getMessagesForContact(campaign_contact) {
  return await db("message").where({
    contact_number: "+17163169738",
    // campaign_contact.cell,
    assignment_id: 443
    // assignment_id: campaign_contact.assignment_id
  });
}

/* OLD */
async function getOldRepliesGroupedByCampaign(numberOfCampaigns) {
  const result = await db("campaign_contact")
    .select("campaign_contact.id", "campaign_contact.campaign_id")
    .select(db.raw("count(campaign_contact.id) as campaign_contact_count"))
    .where({ message_status: "needsResponse" })
    .whereRaw("campaign_contact.updated_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)")
    .joinRaw(
      `INNER JOIN
      (
        SELECT MAX(message.created_at), message.contact_number
        FROM message
        WHERE message.created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY message.contact_number
      ) most_recent_message
      on most_recent_message.contact_number = campaign_contact.cell
    `
    )
    .groupBy("campaign_contact.campaign_id")
    .orderBy("campaign_contact_count", "desc")
    .limit(numberOfCampaigns);

  const campaignContacts = await db("campaign_contact")
    .whereIn("campaign_contact.campaign_id", result.map(row => row.campaign_id))
    .select("id", "campaign_id", "message_status");

  return _;
  console.log(campaignContacts);
  process.exit();

  const step = _.groupBy(campaignContacts, "campaign_id");
  // const final = Object.keys(step).map(campaignId => ({
  //   campaign_contact_ids: step[campaignId].map(c => c.id),
  //   id: campaignId
  // }))

  return final;
}

/*
  This should return [
    {campaignId: n, campaignContactIds: [1, 2, 3]}
  ]
*/

/*
  Returns [
    {campaign_id: n, campaign_contact_ids: [1, 2, 3]}
    {campaign_id: n, campaign_contact_ids: [1, 2, 3]}
  ]

  Sum of campaign_contact_ids.length will equal n
*/
async function lookupByName(name) {
  const name_parts = name.split(" ");
  const first_name = name_parts[0];
  const last_name = name_parts.slice(1, BIG_NUMBER).join(" ");
  const possibleMatches = await db("user")
    .where({ first_name, last_name })
    .select("id");
  if (possibleMatches.length > 0) {
    return possibleMatches[0].id;
  }
  throw new Error(
    `Not sure who ${JSON.stringify({ first_name, last_name })} is.`
  );
}

let campaignReplies = [];
let currentCampaign = {};
async function getNCampaignContactsToReassign(n) {
  if (n == 0) return [];

  console.log(`Getting ${n} to reassing`);
  if (campaignReplies.length == 0) {
    campaignReplies = await getOldRepliesGroupedByCampaign(BATCH_SIZE);
    currentCampaign = campaignReplies[0];
    campaignReplies = campaignReplies.slice(1, BIG_NUMBER);
  } else if (currentCampaign.campaign_contact_ids.length == 0) {
    currentCampaign = campaignReplies[0];
    campaignReplies = campaignReplies.slice(1, BIG_NUMBER);
  }

  const bunch = currentCampaign.campaign_contact_ids.slice(0, n);
  currentCampaign.campaign_contact_ids = currentCampaign.campaign_contact_ids.slice(
    n,
    BIG_NUMBER
  );
  const result = [
    { campaign_id: currentCampaign.id, campaign_contact_ids: bunch }
  ];
  if (bunch.length == n) {
    return result;
  }
  const otherCampaigns = getNCampaignContactsToReassign(n - bunch.length);
  return result.concat(otherCampaigns);
}

// async function main() {
//   let superTexter = await nextSuperTexter();
//   while (superTexter !== undefined) {
//     const campaignAndContactsToModify = await getNCampaignContactsToReassign(superTexter.count || DEFAULT_ASSIGNMENT_SIZE)
//     // console.log(campaignAndContactsToModify)
//     for (let campaignContactGroup of campaignAndContactsToModify) {
//       console.log(`Reassigning ${campaignContactGroup.campaign_contact_ids.length} in campaign ${campaignContactGroup.campaign_id} to superTexter ${superTexter.id}`)
//       await reassignBulk(superTexter.id, campaignContactGroup.campaign_id, campaignContactGroup.campaign_contact_ids)
//     }
//     superTexter = await nextSuperTexter()
//   }
// }

async function ensureAssignmentId(user_id, campaign_id) {
  const existingAssignments = await db("assignment")
    .select("*")
    .where({ user_id, campaign_id });
  const existingAssignment = existingAssignments[0];
  if (!existingAssignment) {
    const assignment = await db("assignment")
      .insert({
        user_id,
        campaign_id
      })
      .returning("id");

    return assignment[0];
    // console.log({ assignment, assignment_id })
  }
  return existingAssignment.id;
}

async function reassignBulk(user_id, campaign_id, campaign_contact_ids) {
  // console.log({ user_id, campaign_id, campaign_contact_ids })

  let assignment_id;

  const existingAssignments = await db("assignment")
    .select("*")
    .where({ user_id, campaign_id });
  const existingAssignment = existingAssignments[0];
  if (!existingAssignment) {
    const assignment = await db("assignment")
      .insert({
        user_id,
        campaign_id
      })
      .returning("id");

    assignment_id = assignment[0];
    // console.log({ assignment, assignment_id })
  } else {
    assignment_id = existingAssignment.id;
  }

  // console.log(existingAssignment)
  // console.log(assignment_id)

  // const updateResult = db.knex.transaction(async function(trx) {
  //   try {
  //     const messageIds = await db('message')
  //       .where({

  //       })
  //       .pluck('id')

  //     const ccUpdate = await db('campaign_contact')
  //       .whereIn('id', campaign_contact_ids)
  //       .update({
  //         assignment_id: assignment_id,
  //         updated_at: db.fn.now()
  //       })

  //     const messagesUpdate = await db('message')
  //       .update({ assignment_id: assignmentId })
  //       .whereIn(
  //         'id',
  //         db('messages')
  //                .select('campaign_contact.id')
  //         messageIds.map(messageId => {
  //           return messageId
  //         })
  //       )

  //     trx.commit();
  //   } catch (error) {
  //     console.error(error);
  //     trx.rollback();
  //   }
  // })

  console.log(`Last: ${campaign_contact_ids[campaign_contact_ids.length - 1]}`);

  // console.log({ updateResult })
}

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   })
