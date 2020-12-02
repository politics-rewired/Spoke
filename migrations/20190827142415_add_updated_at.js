/**
 * We'd like trigger based updated_at on all tables
 *
 * tables that already have it:
 * - question_response / all_questtion_response already has it
 *
 * tables that have it in code:
 * - assignment_request
 * - campaign_contact
 *
 * tables that dont have it:
 * - campaign
 * - canned_response
 * - interaction_step
 * - invite
 * - link_domain
 * - organization
 * - tag
 * - team
 * - unhealthy_link_domain
 * - user
 * - user_organization
 *
 * immutable tables - treating as tables that dont have it:
 * - assignment
 * - campaign_contact_tag
 * - campaign_team
 * - log
 * - messaging_service
 * - messaging_service_stick
 * - opt_out
 * - user_team
 *
 * other / this should not be queried:
 * - job_request
 * - knex_migrations
 * - knex_migrations_lock
 * - pending_message_part
 * - user_cell
 * - zip_code
 */

const TABLES_THAT_HAVE_UPDATED_AT_VIA_CODE = [
  "assignment_request",
  "campaign_contact"
];

const TABLES_THAT_DONT_HAVE_UPDATED_AT = [
  "campaign",
  "canned_response",
  "interaction_step",
  "invite",
  "link_domain",
  "organization",
  "tag",
  "team",
  "unhealthy_link_domain",
  "user",
  "user_organization",
  "assignment",
  "campaign_contact_tag",
  "campaign_team",
  "log",
  "message",
  "messaging_service",
  "messaging_service_stick",
  "opt_out",
  "user_team"
];

const TABLES_THAT_CAN_USE_CREATED_AT = [
  "assignment",
  "campaign_contact_tag",
  "campaign_team",
  "log",
  "opt_out",
  "user_team"
];

const OTHER_INITIALIZATION_OPTIONS = [
  ["message", ["service_response_at", "sent_at", "queued_at", "created_at"]]
];

exports.up = function up(knex) {
  return knex.schema
    .raw(
      `
    create or replace function universal_updated_at() returns trigger as $$
    begin
      NEW.updated_at = CURRENT_TIMESTAMP;
      return NEW;
    end; $$ language plpgsql;
  `
    )
    .then(() =>
      Promise.all(
        TABLES_THAT_DONT_HAVE_UPDATED_AT.map((tableName) =>
          knex.schema.alterTable(tableName, (table) => {
            table.timestamp("updated_at").default(knex.fn.now());
          })
        )
      )
    )
    .then(() =>
      knex.raw(`
        ${TABLES_THAT_CAN_USE_CREATED_AT.map(
          (table) => `update public.${table} set updated_at = created_at;`
        ).join("\n")}

        ${OTHER_INITIALIZATION_OPTIONS.map(
          ([table, columns]) =>
            `update public.${table} set updated_at = coalesce(${columns.join(
              ", "
            )});`
        ).join("\n")}
      `)
    )
    .then(() =>
      Promise.all(
        TABLES_THAT_HAVE_UPDATED_AT_VIA_CODE.concat(
          TABLES_THAT_DONT_HAVE_UPDATED_AT
        ).map((tableName) =>
          knex.schema.raw(`
          create trigger _500_${tableName}_updated_at
            before update
            on public.${tableName}
            for each row
            execute procedure universal_updated_at();
      `)
        )
      )
    );
};

exports.down = function down(knex) {
  /**
   * Drop function cascades to all triggers
   */
  return knex.schema
    .raw("drop function universal_updated_at cascade")
    .then(
      Promise.all(
        TABLES_THAT_DONT_HAVE_UPDATED_AT.map((tableName) =>
          knex.schema.raw(
            `alter table public.${tableName} drop column updated_at cascade;`
          )
        )
      )
    );
};
