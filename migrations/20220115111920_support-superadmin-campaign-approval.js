exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table campaign
      add column is_approved boolean default false;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table campaign
      drop column is_approved;
  `);
};
