/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
  return knex.schema.raw(
    `
      alter table messaging_service
        add column is_default boolean,
        add constraint no_inactive_default check (active or is_default <> true);

      create unique index messaging_service_default_for_organization_index
        on messaging_service (organization_id, is_default) where (is_default);

      -- Inactive messaging services cannot be the default
      update messaging_service
      set is_default = false
      where active = false;

      -- A single active messaging service in an organization must be the default
      with single_active_service_organizations as (
        select organization_id
        from messaging_service
        where active = true
        group by organization_id
        having count(*) = 1
      )
      update messaging_service
      set is_default = true
      where
        active = true
        and organization_id in (
          select organization_id from single_active_service_organizations
        );

      -- We cannot take any action for organizations with multiple active messaging services
    `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema.raw(
    `
      drop index public.messaging_service_default_for_organization_index;

      alter table messaging_service
        drop column is_default;
    `
  );
};
