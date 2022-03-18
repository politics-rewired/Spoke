exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table campaign
      add column is_approved boolean not null default false;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table campaign
      drop column is_approved;
  `);
};
