exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.user add column is_suspended boolean not null default false;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table public.user drop column is_suspended;
  `);
};
