exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace function contact_is_textable_now(timezone text, start integer, stop integer, allow_null boolean) returns boolean as $$
      select (timezone is null and allow_null)
        or (
          extract(hour from (CURRENT_TIMESTAMP at time zone timezone)) >= start
          and extract(hour from (CURRENT_TIMESTAMP at time zone timezone)) < stop
        )
    $$ language sql;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    create or replace function contact_is_textable_now(timezone text, start integer, stop integer, allow_null boolean) returns boolean as $$
      select (timezone is null and allow_null)
        or (
          extract(hour from (CURRENT_TIMESTAMP at time zone timezone)) > start
          and extract(hour from (CURRENT_TIMESTAMP at time zone timezone)) < stop
        )
    $$ language sql;
  `);
};
