exports.up = function up(knex) {
  return knex.schema.raw(
    `
      create table campaign_variable (
        id serial primary key,
        campaign_id int not null references all_campaign (id),
        display_order integer not null,
        name text not null,
        value text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        deleted_at timestamptz,
        constraint check_name check (name ~ '^[a-zA-Z0-9 \\-_]+$')
      );

      create unique index campaign_variable_unique_name_per_campaign
        on campaign_variable (campaign_id, name)
        where deleted_at is null;

      create trigger _500_campaign_variable_updated_at
        before update
        on public.campaign_variable
        for each row
        execute procedure universal_updated_at();

      alter table message
        add column campaign_variable_ids integer[] not null default '{}'::integer[];
    `
  );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `
      alter table message
        drop column campaign_variable_ids;

      drop table campaign_variable;
    `
  );
};
