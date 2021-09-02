exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.campaign_team
      add column id serial primary key;

    alter table public.user_team
      add column id serial primary key;

    alter table public.team_escalation_tags
      add column id serial primary key;

    -- We cannot turn existing unique index into primary key index without recreating the index
    -- Just set the replica identity instead
    alter table public.messaging_service_stick
      alter column organization_id set not null,
      alter column messaging_service_sid set not null,
      alter column cell set not null;
    alter table public.messaging_service_stick
      replica identity using index messaging_service_stick_cell_organization_unique_constraint;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table public.campaign_team
      drop column id;

    alter table public.user_team
      drop column id;

    alter table public.team_escalation_tags
      drop column id;

    alter table public.messaging_service_stick
      replica identity default;
    alter table public.messaging_service_stick
      alter column organization_id drop not null,
      alter column messaging_service_sid drop not null,
      alter column cell drop not null;
  `);
};
