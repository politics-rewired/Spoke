exports.up = function up(knex) {
  return knex.schema.alterTable("campaign", table => {
    // We would like to make timezone NOT NULL here, but alas:
    //   "error: cannot alter type of a column used by a view or rule"
    // table
    //   .text("timezone")
    //   .defaultTo("US/Eastern")
    //   .notNullable()
    //   .alter();
    table.dropColumn("override_organization_texting_hours");
    table.dropColumn("texting_hours_enforced");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("campaign", table => {
    // table
    //   .text("timezone")
    //   .defaultTo("US/Eastern")
    //   .nullable()
    //   .alter();
    table.boolean("override_organization_texting_hours").defaultTo(false);
    table.boolean("texting_hours_enforced").defaultTo(true);
  });
};
