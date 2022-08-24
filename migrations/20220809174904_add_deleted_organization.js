exports.up = function up(knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.timestamp("deleted_at");
    table.integer("deleted_by");

    table.foreign("deleted_by").references("user.id");
    table.index(["deleted_at"]);
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.dropColumn("deleted_at");
    table.dropColumn("deleted_by");
  });
};
