exports.up = function up(knex) {
  return knex.schema.raw(`
ALTER TABLE "user_organization"
DROP CONSTRAINT "user_organization_role_check";
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_role_check"
CHECK (role IN ('OWNER', 'ADMIN', 'SUPERVOLUNTEER', 'TEXTER', 'SUSPENDED'))
`);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
ALTER TABLE "user_organization"
DROP CONSTRAINT "user_organization_role_check";
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_role_check"
CHECK (role IN ('OWNER', 'ADMIN', 'SUPERVOLUNTEER', 'TEXTER'))
`);
};
