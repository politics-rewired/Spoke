exports.up = function(knex) {
  return knex.schema.raw(`
    create or replace function "public".insert_van_contact_batch_to_campaign_contact(record_list json) returns void as $$
      insert into campaign_contact (campaign_id, external_id, first_name, last_name, zip, custom_fields, cell)
      select
        (r ->> 'campaign_id')::integer,
        r ->> 'external_id',
        r ->> 'first_name',
        r ->> 'last_name',
        r ->> 'zip',
        r ->> 'custom_fields',
        r ->> 'cell'
      from json_array_elements(record_list) as r
      where r ->> 'first_name' is not null
        and r ->> 'last_name' is not null
        and r ->> 'cell' is not null
        and not exists (
          select 1
          from opt_out
          where opt_out.cell = r->>'cell'
            and opt_out.organization_id = ( select organization_id from campaign where id = campaign_id )
        )
      on conflict (campaign_id, cell) do nothing
    $$ language sql volatile SECURITY definer SET search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    create or replace function "public".insert_van_contact_batch_to_campaign_contact(record_list json) returns void as $$
    insert into campaign_contact (campaign_id, external_id, first_name, last_name, zip, custom_fields, cell)
    select
      (r ->> 'campaign_id')::integer,
      r ->> 'external_id',
      r ->> 'first_name',
      r ->> 'last_name',
      r ->> 'zip',
      r ->> 'custom_fields',
      r ->> 'cell'
    from json_array_elements(record_list) as r
    where r ->> 'first_name' is not null
      and r ->> 'last_name' is not null
      and r ->> 'cell' is not null
    on conflict (campaign_id, cell) do nothing
    $$ language sql volatile SECURITY definer SET search_path = "public";
  `);
};
