exports.up = function (knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.integer("autosending_mps");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.dropColumn("autosending_mps");
  });
};
