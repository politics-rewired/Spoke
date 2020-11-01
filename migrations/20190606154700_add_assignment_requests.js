exports.up = function up(knex) {
  return knex.schema.createTable("assignment_request", t => {
    t.increments("id");
    t.timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());

    t.integer("organization_id").references("organization(id)");

    t.enu("status", ["pending", "approved", "rejected"]).default("pending");
    t.index("status"); // this is what we'll be searching by

    t.integer("user_id")
      .notNullable()
      .references("user(id)");

    t.integer("amount").notNullable();
    t.integer("approved_by_user_id").references("user(id)");
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable("assignment_request");
};
