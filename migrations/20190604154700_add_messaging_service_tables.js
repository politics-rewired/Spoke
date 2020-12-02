// Add index for fetching current assignment target
exports.up = function up(knex) {
  return Promise.all([
    knex.schema.createTable("messaging_service", (t) => {
      t.text("messaging_service_sid").primary(); // if we choose not to have the foreign key on sticks, we won't need the index here
      t.integer("organization_id").references("organization(id)");
      t.index("organization_id");
    }),
    knex.schema.createTable("messaging_service_stick", (t) => {
      t.text("cell");
      t.index("cell");
      t.integer("organization_id").references("organization(id)");
      t.text("messaging_service_sid").references(
        "messaging_service(messaging_service_sid)"
      ); // for performance, we may want to skip the foreign key
      t.index(
        ["cell", "organization_id"],
        "messaging_service_stick_cell_organization_index"
      );
      t.unique(
        ["cell", "organization_id"],
        "messaging_service_stick_cell_organization_unique_constraint"
      );
    })
  ]);
};

// Drop index for fetching current assignment target
exports.down = function down(knex) {
  return Promise.all([
    knex.schema.dropTable("messaging_service"),
    knex.schema.dropTable("messaging_service_stick")
  ]);
};
