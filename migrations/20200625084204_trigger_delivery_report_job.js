exports.up = function(knex) {
  return knex.schema.raw(`
    alter table public.log
      add column service_type messaging_service_type;

    create or replace function public.tg__log__handle_delivery_report() returns trigger as $$
    begin
      perform graphile_worker.add_job(
        'handle-delivery-report',
        row_to_json(NEW)
      );

      return NEW;
    end;
    $$ language plpgsql;

    create trigger _500_handle_delivery_report
      after insert
      on log
      for each row
      execute procedure tg__log__handle_delivery_report();
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop trigger _500_handle_delivery_report on log;

    drop function public.tg__log__handle_delivery_report;

    alter table public.log drop column service_type;
  `);
};
