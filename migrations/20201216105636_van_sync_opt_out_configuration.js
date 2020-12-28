exports.up = function up(knex) {
  return knex.schema.raw(`
    -- Opt Out Sync Configurations
    create table public.external_sync_opt_out_configuration (
      id uuid not null default uuid_generate_v1mc(),
      system_id uuid not null references public.external_system(id),
      external_result_code_id uuid not null references public.external_result_code(id),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (id),
      unique (system_id)
    );

    create trigger _500_external_sync_opt_out_configuration_updated_at
      before update
      on public.external_sync_opt_out_configuration
      for each row
      execute procedure universal_updated_at();
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop table public.external_sync_opt_out_configuration;
  `);
};
