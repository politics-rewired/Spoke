exports.up = function up(knex) {
  /*
   * Note – this function should be actually replaced in production
   * with values depending on the particular migration context
   */
  return knex.schema.raw(`
    create or replace function get_messaging_service_type(zip text) returns messaging_service_type as $$
    declare
      v_result messaging_service_type;
    begin
      select service_type
      from messaging_service
      limit 1 
      into v_result;

      return v_result;
    end;
    $$ language plpgsql;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop function get_messaging_service_type;
  `);
};
