exports.up = function up(knex) {
  return knex.schema.createTable("filtered_contact", (table) => {
    table.increments("id").primary();
    table.integer("campaign_id").notNull();
    table.text("external_id").notNull();
    table.text("first_name").notNull();
    table.text("last_name").notNull();
    table.text("cell").notNull();
    table.text("zip").notNull();
    table.text("custom_fields").notNull();
    table.timestamp("created_at").notNull();
    table.timestamp("updated_at").notNull();
    table.string("timezone");
    table
      .enu("filtered_reason", ["INVALID", "LANDLINE", "VOIP", "OPTEDOUT"], {
        useNative: false
      })
      .notNull();

    table.unique(["cell", "campaign_id"]);
    table.index("campaign_id");
    table.foreign("campaign_id").references("all_campaign.id");
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable("filtered_contact");
};
