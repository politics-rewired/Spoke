exports.up = function up(knex) {
  return knex.schema.raw(
    `
      drop function campaigns_in_group(group_name text);
      drop function campaigns_in_group(group_id integer);
      
      create or replace function campaigns_in_group(group_name text)
      returns setof all_campaign
      as $$
        select *
        from all_campaign
        where exists (
          select 1
          from campaign_group_campaign
          join campaign_group on campaign_group.id = campaign_group_campaign.campaign_group_id
          where campaign_group_campaign.campaign_id = all_campaign.id
            and campaign_group.name = campaigns_in_group.group_name
        )
      $$ language sql stable;

      create or replace function campaigns_in_group(group_id integer)
      returns setof all_campaign
      as $$
        select *
        from all_campaign
        where exists (
          select 1
          from campaign_group_campaign
          join campaign_group on campaign_group.id = campaign_group_campaign.campaign_group_id
          where campaign_group_campaign.campaign_id = all_campaign.id
            and campaign_group.id = campaigns_in_group.group_id
        )
      $$ language sql stable;
    `
  );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `
      drop function campaigns_in_group(group_name text);
      drop function campaigns_in_group(group_id integer);

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
    `
  );
};
