exports.up = function up(knex) {
  return knex.schema.alterTable("message", table => {
    table.string("script_version_hash");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("message", table => {
    table.dropColumn("script_version_hash");
  });
};
