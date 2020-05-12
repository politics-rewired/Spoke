exports.up = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.boolean("landlines_filtered").default(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.dropColumn("landlines_filtered");
  });
};
