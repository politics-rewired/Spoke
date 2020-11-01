// Create deliverability_report table
exports.up = function up(knex) {
  return knex.schema.createTable("deliverability_report", (table) => {
    table.increments("id").primary();
    table.timestamp("period_starts_at");
    table.timestamp("period_ends_at");
    table.timestamp("computed_at");
    table.integer("count_total");
    table.integer("count_delivered");
    table.integer("count_sent");
    table.integer("count_error");
    table.string("domain", 191);
    table.string("url_path", 191);

    table.index("period_starts_at");
    table.index("period_ends_at");
    table.index("computed_at");
    table.index("count_total");
    table.index("count_delivered");
    table.index("count_sent");
    table.index("count_error");
    table.index("domain");
    table.index("url_path");
  });
};

// Drop deliverability_report table
exports.down = function down(knex) {
  return knex.schema.dropTable("deliverability_report");
};
