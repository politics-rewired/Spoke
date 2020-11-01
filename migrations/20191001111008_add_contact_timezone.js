/**
 * `timezone` will need to be backfilled for all existing contacts. Use:
 *
 *    node ./dev-tools/backfill-timezones.js
 */

exports.up = function up(knex) {
  return knex.schema
    .alterTable("campaign_contact", table => {
      table.string("timezone").index(); // indexing it makes the backfill script much faster - index moved to concurrent
      // indexing it makes the backfill script much faster - to do it concurrently, use this line:
      // table.string("timezone");
    })
    .then(() =>
      knex.schema.raw(`
        create or replace function contact_is_textable_now(timezone text, start integer, stop integer, allow_null boolean) returns boolean as $$
          select (timezone is null and allow_null)
            or (
              extract(hour from (CURRENT_TIMESTAMP at time zone timezone)) > start
              and extract(hour from (CURRENT_TIMESTAMP at time zone timezone)) < stop
            )
        $$ language sql;
      `)
    );
};

exports.down = function down(knex) {
  return knex.schema.alterTable("campaign_contact", table => {
    table.dropColumn("timezone");
  });
};
