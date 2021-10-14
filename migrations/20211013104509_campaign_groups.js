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

    create or replace function campaigns_in_group(group_name text)
    returns setof campaign
    as $$
      select *
      from campaign
      where exists (
        select 1
        from campaign_group_campaign
        join campaign_group on campaign_group.id = campaign_group_campaign.campaign_group_id
        where campaign_group_campaign.campaign_id = campaign.id
          and campaign_group.name = campaigns_in_group.group_name
      )
    $$ language sql stable;

    create or replace function campaigns_in_group(group_id integer)
    returns setof campaign
    as $$
      select *
      from campaign
      where exists (
        select 1
        from campaign_group_campaign
        join campaign_group on campaign_group.id = campaign_group_campaign.campaign_group_id
        where campaign_group_campaign.campaign_id = campaign.id
          and campaign_group.id = campaigns_in_group.group_id
      )
    $$ language sql stable;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop function campaigns_in_group(integer);
    drop function campaigns_in_group(text);
    drop table campaign_group_campaign;
    drop table campaign_group;
  `);
};
