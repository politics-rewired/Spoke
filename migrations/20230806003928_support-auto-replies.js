/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
  return knex.schema
    .createTable("auto_reply_trigger", (table) => {
      table.increments("id");
      table.text("token").notNullable();
      table.integer("interaction_step_id").notNullable();
      table.foreign("interaction_step_id").references("interaction_step.id");
      table.timestamp("created_at").notNull().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNull().defaultTo(knex.fn.now());
      table.unique(["interaction_step_id", "token"]);
    })
    .raw(
      `
        create or replace function auto_reply_trigger_before_insert() returns trigger as $$
        begin
          if exists(
            select 1 from auto_reply_trigger 
            where token = NEW.token
            and interaction_step_id in (
              select id from interaction_step child_steps
              where parent_interaction_id = (
                select parent_interaction_id from interaction_step
                where id = NEW.interaction_step_id
              ) 
            )
            and interaction_step_id <> NEW.id
          ) then
            raise exception 'Each interaction step can only have 1 child step assigned to any particular auto reply token';
          end if;

          return NEW;
        end;
        $$ language plpgsql;

        create trigger _500_auto_reply_trigger_insert
        before insert
        on auto_reply_trigger
        for each row
        execute procedure auto_reply_trigger_before_insert();
      `
    )
    .alterTable("campaign_contact", (table) => {
      table.boolean("auto_reply_eligible").notNullable().defaultTo(false);
    })
    .alterTable("campaign_contact", (table) => {
      table
        .boolean("auto_reply_eligible")
        .notNullable()
        .defaultTo(true)
        .alter();
    });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema
    .dropTable("auto_reply_trigger")
    .alterTable("campaign_contact", (table) => {
      table.dropColumn("auto_reply_eligible");
    });
};
