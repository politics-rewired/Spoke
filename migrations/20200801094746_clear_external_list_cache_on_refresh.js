exports.up = function up(knex) {
  return knex.raw(`
    -- Delete existing external list records before kicking off fetch
    create or replace function "public".queue_refresh_saved_lists(van_system_id uuid) returns void as $$
    declare
      v_username text;
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select username, api_key_ref
      into v_username, v_api_key_ref
      from external_system
      where id = queue_refresh_saved_lists.van_system_id;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_saved_lists.van_system_id;
      end if;

      delete from external_list
      where system_id = queue_refresh_saved_lists.van_system_id;

      perform graphile_worker.add_job(
        'van-get-saved-lists',
        json_build_object(
          'username', v_username,
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_saved_lists.van_system_id,
          '__after', 'insert_saved_lists'
        )
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.raw(`
    -- Revert function
    create or replace function "public".queue_refresh_saved_lists(van_system_id uuid) returns void as $$
    declare
      v_username text;
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select username, api_key_ref
      into v_username, v_api_key_ref
      from external_system
      where id = queue_refresh_saved_lists.van_system_id;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_saved_lists.van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-get-saved-lists',
        json_build_object(
          'username', v_username,
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_saved_lists.van_system_id,
          '__after', 'insert_saved_lists'
        )
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";
  `);
};
