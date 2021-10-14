exports.up = function up(knex) {
  return knex.schema.raw(`
    create table campaign_group (
      id serial primary key,
      organization_id integer not null references organization (id),
      name text not null,
      description text not null,
      created_at timestamptz not null default CURRENT_TIMESTAMP,
      updated_at timestamptz not null default CURRENT_TIMESTAMP,
      unique (organization_id, name)
    );

    create trigger _500_universal_updated_at
      before update
      on public.campaign_group
      for each row
      execute procedure universal_updated_at();

    create table campaign_group_campaign (
      id serial primary key,
      campaign_group_id integer not null references campaign_group (id),
      campaign_id integer not null references campaign (id),
      created_at timestamptz not null default CURRENT_TIMESTAMP,
      updated_at timestamptz not null default CURRENT_TIMESTAMP,
      unique (campaign_group_id, campaign_id)
    );

    create trigger _500_universal_updated_at
      before update
      on public.campaign_group_campaign
      for each row
      execute procedure universal_updated_at();
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop table campaign_group_campaign;
    drop table campaign_group;
  `);
};
