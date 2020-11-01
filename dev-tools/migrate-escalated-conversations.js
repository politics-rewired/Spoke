const config = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const db = require("knex")(config);

async function go(organizationId, escalatedUserId) {
  const result = await db.raw(
    `
    with
      escalated_contacts as (
        select campaign_contact.id
        from campaign_contact
        join assignment
          on campaign_contact.assignment_id = assignment.id
        where assignment.user_id = ?
      ), 
      escalated_tag as (
        select tag.id
        from tag
        where tag.organization_id = ?
          and tag.title = 'Escalated'
      )
    insert into campaign_contact_tags
    select escalated_contacts.id as campaign_contact_id, escalated_tag.id as tag.id;
  `,
    [escalatedUserId, organizationId]
  );
}

go(process.argv[2], process.argv[3]).then(console.log).catch(console.error);
