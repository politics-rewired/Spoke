exports.up = function(knex) {
  return knex.schema.alterTable("message", table => {
    table.string("script_version_hash");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("message", table => {
    table.dropColumn("script_version_hash");
  });
};
