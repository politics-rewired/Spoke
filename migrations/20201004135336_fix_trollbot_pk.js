exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.troll_trigger
      drop constraint troll_trigger_pkey,
      add primary key (token, organization_id);
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table public.troll_trigger
      drop constraint troll_trigger_pkey,
      add primary key (token);
  `);
};
