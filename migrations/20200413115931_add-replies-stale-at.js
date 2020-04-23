exports.up = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.integer("replies_stale_after_minutes");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.dropColumn("replies_stale_after_minutes");
  });
};
