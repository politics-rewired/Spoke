exports.up = function up(knex) {
  return knex.schema.alterTable("user_organization", (table) => {
    table.unique(["user_id", "organization_id"]);
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("user_organization", (table) => {
    table.dropUnique(["user_id", "organization_id"]);
  });
};
