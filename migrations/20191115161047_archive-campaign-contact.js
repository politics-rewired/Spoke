/**
 * Note: this will cause downtime while the new indexes are being built
 * If this is a large database, comment out the last migration component and run
 * them using their concurrent versions
 */

exports.up = function(knex) {
  return knex.schema
    .alterTable("campaign_contact", table => {
      table.boolean("archived").default(false);
    })
    .then(() => {
      return knex.schema.raw(`
        create or replace function cascade_archived_to_campaign_contacts() returns trigger as $$
        begin
          update campaign_contact
          set archived = NEW.is_archived
          where campaign_id = NEW.id;

          return NEW;
        end;
        $$ language plpgsql strict set search_path from current;

        create trigger _500_cascade_archived_campaign
          after update
          on campaign
          for each row
          when (NEW.is_archived is distinct from OLD.is_archived)
          execute procedure cascade_archived_to_campaign_contacts();`);
    })
    .then(() => {
      return knex.schema.raw(`
        create index todos_partial_idx on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out) where (archived is false);
        drop index campaign_contact_get_current_assignment_index;
        drop index campaign_contact_campaign_id_assignment_id_index;
      `);
    });
};

exports.down = function(knex) {
  // be careful with the first component here (same note as above)
  return knex.schema
    .raw(
      `
      drop index todos_partial_idx;
      create index campaign_contact_get_current_assignment_index on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out);
      create index campaign_contact_campaign_id_assignment_id on campaign_contact (campaign_id, assignment_id);
    `
    )
    .then(() => {
      return knex.schema.raw(`
        drop trigger _500_cascade_archived_campaign on campaign;
        drop function cascade_archived_to_campaign_contacts;
      `);
    })
    .then(() => {
      knex.alterTable("campaign_contact", table => {
        table.dropColumn("archived");
      });
    });
};
