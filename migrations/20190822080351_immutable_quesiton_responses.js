/**
 * Invalidate overlapping quesiton responses on insert
 *
 * Runs before insert so that it does not modify the NEW row
 * Only rows that the NEW row is replacing
 * Return NEW to allow the insert to proceed unmodified
 *
 * This trigger is on the 'all_question_response' table because
 * views cannot have before/after insert triggers
 *
 * Since the view is simple (involving no joins), it's insert, updates, and deletes
 * are just forwarded
 *
 * The extra "is_deleted = false" is not necessary for proper correctness, only
 * to ensure that the updated_at is not reset and a more accurate history is preserved
 */
const BEFORE_INSERT_FUNCTION = `
create or replace function all_question_response_before_insert() returns trigger as $$
begin
  update all_question_response
  set is_deleted = true, updated_at = now()
  where campaign_contact_id = NEW.campaign_contact_id
    and interaction_step_id = NEW.interaction_step_id
    and is_deleted = false;

  return NEW;
end;
$$ language plpgsql;
`;

/**
 * Copy the old record as a deleted record to preserve history
 * The new record will have an updated updated_at
 * Return NEW to allow the update to proceed unmodified
 *
 * Since the view is simple (involving no joins), it's insert, updates, and deletes
 * are just forwarded
 *
 * This is only bound to conventional updates – not update set is_deleted = true
 */
const BEFORE_UPDATE_FUNCTION = `
create or replace function all_question_response_before_update() returns trigger as $$
begin
  insert into all_question_response (campaign_contact_id, interaction_step_id, value, created_at, is_deleted)
  values (OLD.campaign_contact_id, OLD.interaction_step_id, OLD.value, OLD.created_at, true);

  return NEW;
end;
$$ language plpgsql;
`;

/**
 * Instead of deleting, set is_deleted to true
 * Must return OLD for command signature / returning statements to function correctly
 *
 * This is an instead of trigger, so it can be bound directly to the view
 */
const INSTEAD_OF_DELETE_FUNCTION = `
create or replace function question_response_instead_of_delete() returns trigger as $$
begin
  update all_question_response
  set is_deleted = true, updated_at = now()
  where id = OLD.id;

  return OLD;
end;
$$ language plpgsql;
`;

exports.up = function up(knex) {
  return knex.schema
    .alterTable("question_response", (table) => {
      table.boolean("is_deleted").default(false).index();

      table.timestamp("updated_at").default(knex.fn.now());
    })
    .then(() =>
      knex.schema.raw(`
        alter table question_response rename to all_question_response;

        create view question_response as
          select *
          from all_question_response
          where is_deleted = false;

        ${BEFORE_INSERT_FUNCTION}
        
        create trigger _500_question_response_insert
          before insert
          on all_question_response
          for each row
          execute procedure all_question_response_before_insert();

        ${BEFORE_UPDATE_FUNCTION}

        create trigger _500_question_response_update
          before update
          on all_question_response
          for each row
          when (NEW.is_deleted = false)
          execute procedure all_question_response_before_update();

        ${INSTEAD_OF_DELETE_FUNCTION}

        create trigger _500_question_response_delete
          instead of delete
          on question_response
          for each row
          execute procedure question_response_instead_of_delete();
      `)
    );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `
    drop trigger _500_question_response_insert on all_question_response; 
    drop trigger _500_question_response_update on all_question_response;
    drop trigger _500_question_response_delete on question_response;

    drop function all_question_response_before_insert;
    drop function all_question_response_before_update;
    drop function question_response_instead_of_delete;

    drop view question_response;
    delete from all_question_response where is_deleted = true;

    alter table all_question_response rename to question_response;
    alter table question_response drop is_deleted;
    alter table question_response drop updated_at;
  `
  );
};
