// Ref: https://github.com/voxpelli/node-connect-pg-simple/blob/main/table.sql

exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.user add column is_suspended boolean not null default false;

    create table user_session (
      sid text primary key,
      sess json not null,
      expire timestamptz not null,
      user_id integer generated always as ((sess->'passport'->>'user')::integer) stored
    );

    create index on user_session (expire);
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop table user_session;
    alter table public.user drop column is_suspended;
  `);
};
