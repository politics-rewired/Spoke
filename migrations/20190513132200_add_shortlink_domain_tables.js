// Create link_domain and unhealthy_link_domain tables
exports.up = function up(knex) {
  const linkDomainPromise = knex.schema.createTable("link_domain", table => {
    table.increments("id").primary();
    table.integer("organization_id").notNullable();
    table
      .text("domain")
      .notNullable()
      .unique()
      .index();
    table.integer("max_usage_count").notNullable();
    table
      .integer("current_usage_count")
      .notNullable()
      .default(0);
    table
      .boolean("is_manually_disabled")
      .notNullable()
      .default(false);
    table
      .timestamp("cycled_out_at")
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index("organization_id");
    table.foreign("organization_id").references("organization.id");
  });

  const unhealthyDomainPromise = knex.schema.createTable(
    "unhealthy_link_domain",
    table => {
      table.increments("id").primary();
      table.text("domain").notNullable();
      table
        .timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());
      table.timestamp("healthy_again_at");

      table.index(["domain", "created_at"]);
    }
  );

  return Promise.all([linkDomainPromise, unhealthyDomainPromise]);
};

// Drop link_domain and unhealthy_link_domain tables
exports.down = function down(knex) {
  return Promise.all([
    knex.schema.dropTable("link_domain"),
    knex.schema.dropTable("unhealthy_link_domain")
  ]);
};
