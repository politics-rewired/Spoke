exports.up = function up(knex) {
  return knex.schema
    .createTable("filtered_contact", (table) => {
      table.increments("id").primary();
      table.integer("campaign_id").notNull();
      table.integer("assignment_id");
      table.text("external_id").notNull();
      table.text("first_name").notNull();
      table.text("last_name").notNull();
      table.text("cell").notNull();
      table.text("zip").notNull();
      table.text("custom_fields").notNull();
      table.timestamp("created_at").notNull();
      table.timestamp("updated_at").notNull();
      table.text("message_status").notNull();
      table.boolean("is_opted_out").default(false);
      table.string("timezone");
      table.boolean("archived").default(false);
      table.text("filtered_reason").notNull();

      table.unique(["cell", "campaign_id"]);
      table.index("campaign_id");
      table.foreign("campaign_id").references("all_campaign.id");
      table.foreign("assignment_id").references("assignment.id");
    })
    .then(() =>
      knex.schema.raw(`
        ALTER TABLE "filtered_contact" ADD CONSTRAINT "filtered_reason_check"
        CHECK (filtered_reason IN ('INVALID', 'LANDLINE', 'VOIP', 'OPTEDOUT'))
      `)
    );
};

exports.down = function down(knex) {
  return knex.schema.dropTable("filtered_contact");
};
