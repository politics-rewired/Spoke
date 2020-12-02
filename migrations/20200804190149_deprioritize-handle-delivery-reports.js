exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace function public.tg__log__handle_delivery_report() returns trigger as $$
    begin
      perform graphile_worker.add_job(
        'handle-delivery-report',
        row_to_json(NEW),
        priority := 5
      );

      return NEW;
    end;
    $$ language plpgsql;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    create or replace function public.tg__log__handle_delivery_report() returns trigger as $$
    begin
      perform graphile_worker.add_job(
        'handle-delivery-report',
        row_to_json(NEW)
      );

      return NEW;
    end;
    $$ language plpgsql;
  `);
};
