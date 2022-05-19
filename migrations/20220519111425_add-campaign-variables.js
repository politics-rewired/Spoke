exports.up = function up(knex) {
  return knex.schema.raw(
    `
      create table campaign_variable (
        id serial primary key,
        campaign_id int not null references all_campaign (id),
        name text not null,
        value text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint unique_name_per_campaign unique (campaign_id, name)
      );

      create trigger _500_campaign_variable_updated_at
        before update
        on public.campaign_variable
        for each row
        execute procedure universal_updated_at();
    `
  );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `
      drop table campaign_variable;
    `
  );
};
