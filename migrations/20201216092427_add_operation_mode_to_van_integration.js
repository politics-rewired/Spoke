exports.up = function (knex) {
  return knex.schema.raw(`
    alter table external_system
      add column operation_mode text
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    alter table external_system
      drop column operation_mode
  `);
};
