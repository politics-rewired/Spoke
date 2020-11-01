// Add unique contraint on Campaign Contacts (campaign_id, cell)
exports.up = function up(knex) {
  // Note: before running this, you will need to resolve all existing duplicates.
  //       See `dev-tools/mysql-migrations/007-make-unique-cc-campaign-id-cell.sql` for
  //       one possible strategy.
  return knex.schema.alterTable("campaign_contact", (table) => {
    table.unique(["campaign_id", "cell"]);
  });
};

// Drop unique contraint
exports.down = function down(knex) {
  return knex.schema.alterTable("campaign_contact", (table) => {
    table.dropUnique(["campaign_id", "cell"]);
  });
};
