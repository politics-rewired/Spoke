// Add campaign_contact_id column to message
exports.up = function(knex, Promise) {
  return knex.schema.alterTable("message", table => {
    table.integer("campaign_contact_id").unsigned();
    table.foreign("campaign_contact_id").references("campaign_contact.id");
  });
};

// Drop campaign_contact_id column from message
exports.down = function(knex, Promise) {
  return knex.schema.alterTable("message", table => {
    table.dropForeign("campaign_contact_id");
    table.dropColumn("campaign_contact_id");
  });
};
