exports.up = function up(knex) {
  return knex.schema.alterTable("all_campaign", (table) => {
    table.integer("autosend_limit");
    table.integer("autosend_limit_max_contact_id");
    table
      .foreign("autosend_limit_max_contact_id")
      .references("campaign_contact.id");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("all_campaign", (table) => {
    table.dropColumn("autosend_limit");
    table.dropColumn("autosend_limit_max_contact_id");
  });
};
