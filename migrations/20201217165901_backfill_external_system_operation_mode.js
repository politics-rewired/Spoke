exports.up = function (knex) {
  return knex.schema.raw(`
    begin;
    update external_system
      set operation_mode = 'Voterfile'
      where operation_mode is null;
    commit;
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    begin;
    update external_system
      set operation_mode = null;
    commit;
  `);
};
