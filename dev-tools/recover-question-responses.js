const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const campaign_contacts_without_question_responses = `
create view campaign_contacts_without_question_responses as
  select campaign_contact.id
  from campaign_contact
  where not exists (
    select question_response.id
    from question_response
    where question_response.campaign_contact_id = campaign_contact.id
  );
`;

const question_response_messages = `
create or replace view question_response_message_contact_numbers as 
  select message.contact_number, message.text
    from message
    where message.text in (
      select script
      from interaction_step;
    );
`;

const drop_tables = `
drop table question_response_message_contact_numbers_cached;
drop table campaign_contacts_without_question_responses_cached;
`;

const create_tables = `
create table question_response_message_contact_numbers_cached select * from question_response_message_contact_numbers;
create table campaign_contacts_without_question_responses_cached select * from campaign_contacts_without_question_responses;
`;

const query = `
select campaign_contact.id, campaign_contact.campaign_id, question_response_message_contact_numbers_cached.text
from campaign_contact
join question_response_message_contact_numbers_cached on question_response_message_contact_numbers_cached.contact_number = campaign_contact.cell
where campaign_contact.id in (
  select id
  from campaign_contacts_without_question_responses_cached
);
`;

const db = require("knex")(config);

let result;
let operatedOn = 0;
async function main() {
  try {
    await db.raw(create_tables);
    console.log("Created tables");
  } catch (ex) {
    await db.raw(drop_tables);
    console.log("Droppped tables");
    await db.raw(create_tables);
    console.log("Created tables");
  }
  result = await db.raw(query);
  rows = result[0];
  console.log(rows);
  while (rows.length > 0) {
    operatedOn += rows.length;
    for (const row of rows) {
      await updateRow(row);
    }
    console.log(`Operating on ${operatedOn} rows`);
    await db.raw(drop_tables);
    console.log("Dropped tables");
    await db.raw(create_tables);
    console.log("Recreated tables");
    result = await db.raw(query);
    rows = result[0];
    console.log(rows);
  }
  return operatedOn;
}

async function updateRow({ id, campaign_id, text }) {
  const matchingInteractionStep = await db("interaction_step")
    .where({ script: text, campaign_id })
    .first();
  if (matchingInteractionStep) {
    const toInsert = {
      interaction_step_id: matchingInteractionStep.id,
      campaign_contact_id: id,
      value: matchingInteractionStep.answer_option
    };

    const insert_result = await db("question_response").insert(toInsert);
    console.log(95);
  }
}

main().then(console.log).catch(console.error);
