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
          execute procedure cascade_archived_to_campaign_contacts();
          
        create or replace view assignable_campaign_contacts_with_escalation_tags as (
          select
            campaign_contact.id,
            campaign_contact.campaign_id,
            campaign_contact.message_status,
            campaign_contact.timezone::text as contact_timezone,
            (
              select array_agg(tag.id)
              from campaign_contact_tag
              join tag on campaign_contact_tag.tag_id = tag.id
              where campaign_contact_tag.campaign_contact_id = campaign_contact.id
              and tag.is_assignable = false
            )  as applied_escalation_tags
          from campaign_contact
          where assignment_id is null
            and is_opted_out = false
            and archived = false
            and exists (
              select 1
              from campaign_contact_tag
              join tag on campaign_contact_tag.tag_id = tag.id
              where tag.is_assignable = false
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
            )
        );

      create or replace view assignable_campaign_contacts as (
        select
          campaign_contact.id, campaign_contact.campaign_id,
          campaign_contact.message_status, campaign.texting_hours_end,
          campaign_contact.timezone::text as contact_timezone
        from campaign_contact
        join campaign on campaign_contact.campaign_id = campaign.id
        where assignment_id is null
          and is_opted_out = false
          and archived = false
          and not exists (
            select 1
            from campaign_contact_tag
            join tag on campaign_contact_tag.tag_id = tag.id
            where tag.is_assignable = false
              and campaign_contact_tag.campaign_contact_id = campaign_contact.id
          )
      );`);
    })
    .then(() => {
      return knex.schema.raw(`
        update campaign_contact
        set archived = true
        from campaign
        where campaign_contact.campaign_id = campaign.id
          and campaign.is_archived = true;

        create index todos_partial_idx on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out) where (archived = false);
        drop index campaign_contact_get_current_assignment_index;
        drop index campaign_contact_campaign_id_assignment_id;
      `);
    });
};

exports.down = function(knex) {
  // be careful with the first component here (same note as above)
  return knex.schema
    .raw(
      `
      create index campaign_contact_campaign_id_assignment_id on campaign_contact (campaign_id, assignment_id);
      create index campaign_contact_get_current_assignment_index on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out);
      drop index todos_partial_idx;
    `
    )
    .then(() => {
      return knex.schema.raw(`
        drop trigger _500_cascade_archived_campaign on campaign;
        drop function cascade_archived_to_campaign_contacts;

        create or replace view assignable_campaign_contacts_with_escalation_tags as (
          select
            campaign_contact.id,
            campaign_contact.campaign_id,
            campaign_contact.message_status,
            campaign_contact.timezone::text as contact_timezone,
            (
              select array_agg(tag.id)
              from campaign_contact_tag
              join tag on campaign_contact_tag.tag_id = tag.id
              where campaign_contact_tag.campaign_contact_id = campaign_contact.id
              and tag.is_assignable = false
            )  as applied_escalation_tags
          from campaign_contact
          where assignment_id is null
            and is_opted_out = false
            and exists (
              select 1
              from campaign_contact_tag
              join tag on campaign_contact_tag.tag_id = tag.id
              where tag.is_assignable = false
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
            )
        );

        create or replace view assignable_campaign_contacts as (
          select
            campaign_contact.id, campaign_contact.campaign_id,
            campaign_contact.message_status, campaign.texting_hours_end,
            campaign_contact.timezone::text as contact_timezone
          from campaign_contact
          join campaign on campaign_contact.campaign_id = campaign.id
          where assignment_id is null
            and is_opted_out = false
            and not exists (
              select 1
              from campaign_contact_tag
              join tag on campaign_contact_tag.tag_id = tag.id
              where tag.is_assignable = false
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
            )
          );
      `);
    })
    .then(() => {
      return knex.schema.alterTable("campaign_contact", table => {
        table.dropColumn("archived");
      });
    });
};
