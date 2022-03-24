exports.up = function up(knex) {
  return knex.schema
    .createTable("notification", (t) => {
      t.increments("id").primary();

      t.integer("user_id").notNullable();
      t.text("subject").notNullable();
      t.text("content").notNullable();
      t.string("reply_to");
      t.timestamp("sent_at");
      t.timestamps(true, true);

      t.foreign("user_id").references("user.id");
    })
    .then(() => {
      knex.schema.raw(`
      create trigger _500_notification_updated_at
        before update
        on public.notification
        for each row
        execute procedure universal_updated_at();
    `);
    });
};

exports.down = function down(knex) {
  return knex.schema.dropTable("notification");
};
