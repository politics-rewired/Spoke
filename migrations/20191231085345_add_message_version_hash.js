exports.up = function(knex) {
  return knex.schema.alterTable("message", table => {
    table.string("version_hash");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("message", table => {
    table.dropColumn("version_hash");
  });
};
