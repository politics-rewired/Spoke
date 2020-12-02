/* eslint-disable max-len */
/**
 * Must create an escalate tag for each existing organization!
 *
 * Run once for each organization, substituting in the correct value for `ASSIGNMENT_USER_ID`

  insert into tag (
    organization_id,
    title,
    description,
    is_assignable,
    is_system
  ) values (
    select
      organization.id,
      'Escalated',
      'Escalation is meant for situations where you have exhausted all available help resources and still do not know how to respond.',
      false,
      true
    from organization
  );

  insert into campaign_contact_tag (
    campaign_contact_id,
    tag_id,
    tagger_id
  ) values (
    select
      campaign_contact.id,
      tag.id,
      assignment.user_id
    from
      campaign_contact
      join assignment
        on assignment.id = campaign_contact.assignment_id
      join campaign
        on campaign.id = campaign_contact.campaign_id
      join tag
        on tag.organization_id = campaign.organization_id
    where
      assignment.user_id = ASSIGNMENT_USER_ID
      and tag.title = 'Escalated'
  );

 */

exports.up = function up(knex) {
  return knex.schema
    .createTable("tag", (table) => {
      table.increments("id").primary();
      table.integer("organization_id").unsigned().notNullable();
      table.text("title").notNullable();
      table.text("description").notNullable().default("");
      table.text("text_color").notNullable().default("#000000");
      table.text("background_color").notNullable().default("#DDEEEE");
      table.integer("author_id").unsigned();
      table
        .specificType("confirmation_steps", "text[][]")
        .notNullable()
        .default("{}");
      table.text("on_apply_script").notNullable().default("");
      table.text("webhook_url").notNullable().default("");
      table.boolean("is_assignable").notNullable().default(true);
      table.boolean("is_system").notNullable().default(false);
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

      table.foreign("organization_id").references("organization.id");
      table.foreign("author_id").references("user.id");
      table.unique(["title", "organization_id"]);
      table.index("is_assignable");
      table.index(knex.raw("(lower(title))"));
    })
    .then(() =>
      knex.schema.createTable("campaign_contact_tag", (table) => {
        table.integer("campaign_contact_id").unsigned().notNullable();
        table.integer("tag_id").unsigned().notNullable();
        table.integer("tagger_id").unsigned().notNullable();
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

        table.primary(["campaign_contact_id", "tag_id"]);
        table.foreign("campaign_contact_id").references("campaign_contact.id");
        table.foreign("tag_id").references("tag.id");
        table.foreign("tagger_id").references("user.id");
      })
    );
};

exports.down = function down(knex) {
  return knex.schema
    .dropTable("campaign_contact_tag")
    .then(() => knex.schema.dropTable("tag"));
};
