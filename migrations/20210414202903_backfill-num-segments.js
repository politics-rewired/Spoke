exports.up = (knex) => {
  return knex.schema.raw(`
    create or replace function backfill_segment_info(min_log_id bigint, max_log_id bigint)
    returns bigint as $$
      with info as (
        select body::json->>'messageId' as service_id,
          (body::json->'extra'->>'num_segments')::smallint as num_segments,
          (body::json->'extra'->>'num_media')::smallint as num_media
        from log
        where id >= min_log_id
          and id <= max_log_id
      ),
      update_result as (
        update message
        set num_segments = info.num_segments,
            num_media = info.num_media
        from info
        where info.service_id = message.service_id
        returning 1
      )
      select count(*)
      from update_result
    $$ language sql;

    create or replace procedure backfill_all_segment_info(initial_min bigint, batch_size bigint) as $$
    declare
      v_current_min_log_id bigint;
      v_max_log_id bigint;
      v_count_updated bigint;
    begin
      select max(id)
      from log
      into v_max_log_id;
      
      select initial_min into v_current_min_log_id;

      while v_current_min_log_id < v_max_log_id loop
        select backfill_segment_info(v_current_min_log_id, v_current_min_log_id + batch_size)
        into v_count_updated;
    
        raise notice 'Updated %s between %s and %s', 
          v_count_updated, v_current_min_log_id, v_current_min_log_id + batch_size;

        select v_current_min_log_id + batch_size
        into v_current_min_log_id;
      end loop;
    end;
    $$ language plpgsql;
  `);
};

exports.down = (knex) => {
  return knex.schema.raw(`
    drop procedure backfill_all_segment_info;
    drop function backfill_segment_info;
  `);
};
