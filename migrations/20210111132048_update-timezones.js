const depractedTimezoneMap = {
  "us/alaska": "America/Anchorage",
  "us/aleutian": "America/Adak",
  "us/arizona": "America/Phoenix",
  "us/central": "America/Chicago",
  "us/east-indiana": "America/Indiana/Indianapolis",
  "us/eastern": "America/New_York",
  "us/hawaii": "Pacific/Honolulu",
  "us/indiana-starke": "America/Indiana/Knox",
  "us/michigan": "America/Detroit",
  "us/mountain": "America/Denver",
  "us/pacific": "America/Los_Angeles",
  "us/samoa": "Pacific/Pago_Pago"
};

exports.up = function up(knex) {
  // Update campaign column default
  return knex.schema
    .raw(
      `alter table only public.campaign alter column timezone set default 'America/New_York'`
    )
    .then(() =>
      // Update existing deprecated values in campaign table
      Promise.all(
        Object.entries(depractedTimezoneMap).map(([deprecatedZone, ianaZone]) =>
          knex("public.campaign")
            .update({ timezone: ianaZone })
            .whereRaw("lower(timezone) = ?", [deprecatedZone])
        )
      )
    );
  // Do not worry about campaign_contact.timezone because these are user-provided values
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `alter table only public.campaign alter column timezone set default 'US/Eastern'`
  );
};
