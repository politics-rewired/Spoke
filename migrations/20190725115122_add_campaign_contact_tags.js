exports.up = function(knex, Promise) {
  return knex.schema
    .createTable("tag", table => {
      table.increments("id").primary();
      table
        .integer("organization_id")
        .unsigned()
        .notNullable();
      table
        .text("title")
        .notNullable()
        .unique();
      table
        .text("description")
        .notNullable()
        .default("");
      table
        .text("text_color")
        .notNullable()
        .default("#000000");
      table
        .text("background_color")
        .notNullable()
        .default("#DDEEEE");
      table.integer("author_id").unsigned();
      table
        .specificType("confirmation_steps", "text[][]")
        .notNullable()
        .default("{}");
      table
        .text("on_apply_script")
        .notNullable()
        .default("");
      table
        .text("webhook_url")
        .notNullable()
        .default("");
      table
        .boolean("is_assignable")
        .notNullable()
        .default(true);
      table
        .boolean("is_system")
        .notNullable()
        .default(false);
      table
        .timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());

      table.foreign("organization_id").references("organization.id");
      table.foreign("author_id").references("user.id");
      table.index("is_assignable", "is_assignable_idx");
    })
    .then(() =>
      knex.schema.createTable("campaign_contact_tag", table => {
        table
          .integer("campaign_contact_id")
          .unsigned()
          .notNullable();
        table
          .integer("tag_id")
          .unsigned()
          .notNullable();
        table
          .integer("tagger_id")
          .unsigned()
          .notNullable();
        table
          .timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        table.primary(["campaign_contact_id", "tag_id"]);
        table.foreign("campaign_contact_id").references("campaign_contact.id");
        table.foreign("tag_id").references("tag.id");
        table.foreign("tagger_id").references("user.id");
      })
    );
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable("campaign_contact_tag")
    .then(() => knex.schema.dropTable("tag"));
};
