exports.up = function(knex) {
  return knex.schema.raw(`
    alter table public.external_system add column created_at timestamptz not null default now();
    alter table public.external_system add column updated_at timestamptz not null default now();
    alter table public.external_system add column synced_at timestamptz null default null;
    alter table public.external_list add column created_at timestamptz not null default now();
    alter table public.external_list add column updated_at timestamptz not null default now();

    create trigger _500_external_system_updated_at
      before update
      on public.external_system
      for each row
      execute procedure universal_updated_at();

    create trigger _500_external_list_updated_at
      before update
      on public.external_list
      for each row
      execute procedure universal_updated_at();

    -- Add 'on conflict ... do update ...' for syncs
    create or replace function "public".insert_saved_lists(payload json, result json, context json) returns void as $$
    begin
      update public.external_system
      set synced_at = now()
      where id = (payload->>'van_system_id')::uuid;

      insert into external_list (external_id, name, description, list_count, door_count, system_id)
      select
        (j->>'saved_list_id')::integer,
        j->>'name',
        j->>'description',
        (j->>'list_count')::integer,
        (j->>'door_count')::integer,
        (j->>'van_system_id')::uuid
      from json_array_elements(result) as j
      on conflict (system_id, external_id)
      do update set
        name = excluded.name,
        description = excluded.description,
        list_count = excluded.list_count,
        door_count = excluded.door_count;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    -- Restore function version from 20200510204235_external_list
    CREATE OR REPLACE FUNCTION "public".insert_saved_lists(payload json, result json, context json) RETURNS void as $$ insert into external_list
      (external_id, name, description, list_count, door_count, system_id)
    select 
      (j->>'saved_list_id')::integer,
      j->>'name',
      j->>'description',
      (j->>'list_count')::integer,
      (j->>'door_count')::integer,
      (j->>'van_system_id')::uuid
    from json_array_elements(result) as j
    $$ language sql volatile SECURITY definer SET search_path = "public";

    -- Must drop the triggers manually; 'drop column ... cascade' will not work
    drop trigger _500_external_list_updated_at on public.external_list;
    drop trigger _500_external_system_updated_at on public.external_system;

    alter table public.external_list drop column updated_at;
    alter table public.external_list drop column created_at;
    alter table public.external_system drop column synced_at;
    alter table public.external_system drop column updated_at;
    alter table public.external_system drop column created_at;
  `);
};
