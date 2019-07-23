# How to Migrate from MoveOnOrg/Spoke

The Politics Rewired fork of Spoke has many differences from [MoveOnOrg/Spoke](https://www.github.com/MoveOnOrg/Spoke). These include feature additions as well as database schema changes that must be reconciled.

## Changes

Below are some of the more important changes from `MoveOnOrg/Spoke` up to July 1, 2019. The PR's linked are the initial PRs and do not include follow up work. We were working very quickly and sloppily in the beginning so the earlier PRs have lots of follow up work.

An overview of the main difficulties and sources of difference:

- Instead of associating messages to campaign_contacts via `cell = contact_number` and `assignment_id = assignment_id`, we have a foreign
  key on `message` that points to `campaign_contact`. This was necessary for some of the more flexible reassignment flows we built. We have
  a script that should migrate from one to the other, but it is a potentially dangerous process that may require downtime
- In order to support multiple different Twilio subaccount / messaging service relationships (and multiple messaging services to get
  around Twilio's limit of 400 numbers per service), we've moved those controls from `.env` variables to new database schemas. Those
  database rows will need to be inserted carefully in order to avoid disrupting existing conversations
- We did not maintain compatibility with MoveOn's caching layer, so certain features we built should interact with cache invalidation, but
  don't
- We did not maintain compatibility with MoveOn's (or write our own) tests 😬
- We `prettier`'ed everything
- We dropped support for SQLite entirely in favor of PostgreSQL as the only supported DB engine

We will continue to add to this as we notice differences, and add a list of the things we've done likely under a wiki to come.

### Breaking

- Support multiple script variations for each interaction step to improve deliverability ([#197](https://github.com/politics-rewired/Spoke/pull/197))
- Add ability for texters to request assignments (as an alternative to Dynamic Assignment) ([#176](https://github.com/politics-rewired/Spoke/pull/176))
- Support per-organization Messaging Services for multi-tenant deployments ([#175](https://github.com/politics-rewired/Spoke/pull/175), [#193](https://github.com/politics-rewired/Spoke/pull/193))
- Enforce consistent code style using Prettier.js ([#173](https://github.com/politics-rewired/Spoke/pull/173))
- Switch to Knex-style migrations ([#139](https://github.com/politics-rewired/Spoke/pull/139))
- Fix client-side contact upload state bug causing duplicate contacts by adding unique constraint (`campaign_id`, `cell`) to `campaign_contact` ([#138](https://github.com/politics-rewired/Spoke/pull/138))
- Fix bug deleting interaction step with children by adding `ON DELETE CASCADE` to `parent_id` constraint ([#112](https://github.com/politics-rewired/Spoke/pull/112))
- Fix doubles end issue caused by `<enter>` key handler. This breaks hold-to-send behavior (rightly so in our non-legal opinion). ([#98](https://github.com/politics-rewired/Spoke/pull/98))
- Add `campaign_contact_id` column to `message`; use that as foreign key rather than `assignment_id` + `cell` ([#61](https://github.com/politics-rewired/Spoke/pull/61))
- Add first-class support for multiple messaging services
- Remove Opt Out page as it was not functional for large lists ([#44](https://github.com/politics-rewired/Spoke/pull/44))
- Add Text Assignment Request feature
- Optimizations for sendMessage ([#23](https://github.com/politics-rewired/Spoke/pull/23))
  - This removes support for organization-level texting hour enforcement

### Non-breaking

- Defensive fix to prevent dropped Twilio deliver reports ([#196](https://github.com/politics-rewired/Spoke/pull/196))
- Fix team navigation links for `TEXTER` role ([#186](https://github.com/politics-rewired/Spoke/pull/186))
- Escape RegEx special characters ([#161](https://github.com/politics-rewired/Spoke/pull/161), [#172](https://github.com/politics-rewired/Spoke/pull/172), [#177](https://github.com/politics-rewired/Spoke/pull/177))
- Support automatic rotation of shortlink domains for improved deliverability ([#153](https://github.com/politics-rewired/Spoke/pull/153))
- Add `.ebextensions` directory for Elastic Beanstalk deployment configuration ([#150](https://github.com/politics-rewired/Spoke/pull/150), [#158](https://github.com/politics-rewired/Spoke/pull/158))
- Force v4 AWS S3 signatures for better security ([#147](https://github.com/politics-rewired/Spoke/pull/147))
- Add "Autoassign Mode" to campaign edit ([#144](https://github.com/politics-rewired/Spoke/pull/144))
- Add pagination to campaign list ([#143](https://github.com/politics-rewired/Spoke/pull/143))
- Add "Escalate" button to texter view. This allows reassigning to a designated "Escalted Conversations" user for admin sweeping ([#121](https://github.com/politics-rewired/Spoke/pull/121), [#122](https://github.com/politics-rewired/Spoke/pull/122))
- Add ability to unassign conversations from within Message Review ([#109](https://github.com/politics-rewired/Spoke/pull/109))
- Add bulk editor for campaign scripts ([#106](https://github.com/politics-rewired/Spoke/pull/106))
- Add ability to sweep survery responses from Message Review ([#89](https://github.com/politics-rewired/Spoke/pull/89))
- Add ability to filter Message Review by contact first/last name ([#88](https://github.com/politics-rewired/Spoke/pull/88))
- Add user notice about media attachments on incoming MMS ([#84](https://github.com/politics-rewired/Spoke/pull/84))
- Add way to release unsent messages for a campaign [#73](https://github.com/politics-rewired/Spoke/pull/73)
- Add outgoing webhook on `sendMessage()` ([#59](https://github.com/politics-rewired/Spoke/pull/59))
- Add protected endpoint to remotely remove contacts from a campaign ([#47](https://github.com/politics-rewired/Spoke/pull/47))
- Add way to mark a campaign for second pass ([#39](https://github.com/politics-rewired/Spoke/pull/39), [#67](https://github.com/politics-rewired/Spoke/pull/67))
- Add texting hour enforcement at the campaign level ([#36](https://github.com/politics-rewired/Spoke/pull/36))
- Update text sending to be asyncronous ([#31](https://github.com/politics-rewired/Spoke/pull/31))
- Update `assignTexters()` to be more performant ([#26](https://github.com/politics-rewired/Spoke/pull/26))
- Add Slack passport strategy ([#19](https://github.com/politics-rewired/Spoke/pull/19))
- Add edit survey result from admin sweeper view ([#18](https://github.com/politics-rewired/Spoke/pull/18))
- Add user feedback for campaign copy completion ([#17](https://github.com/politics-rewired/Spoke/pull/17))
- Add "Remove Empty Texters" button to text assignment section of campaign edit ([#15](https://github.com/politics-rewired/Spoke/pull/15))
- Add authorization check to sendMessage ([#14](https://github.com/politics-rewired/Spoke/pull/14))
- Add reply from admin sweep view ([#10](https://github.com/politics-rewired/Spoke/pull/10))
- Remove personal canned responses ([#6](https://github.com/politics-rewired/Spoke/pull/6))

### Cosmetic

- Add phone messenger themeing to conversations ([#12](https://github.com/politics-rewired/Spoke/pull/12))
- Add campaign title to Edit screen ([#8](https://github.com/politics-rewired/Spoke/pull/8))

## Migration Steps

The general approach to migrating is to manually add the Knex migrations tables, get your schema roughly even with where we forked from `MoveOnOrg/Spoke`, update your codebase, and then run the remaining migrations using Knex.

### Knex Migration Tables

```sql
-- Migrations table
CREATE TABLE public.knex_migrations (
    id SERIAL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);

-- Lock table
CREATE TABLE public.knex_migrations_lock (
    index SERIAL,
    is_locked integer
);

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);
```

### Schema Parity

The schema in the first two Knex migration files should be even with `MoveOnOrg/Spoke` as of April 15, 2019.

- [`20190207220000_init_db.js`](../migrations/20190207220000_init_db.js)
- [`20190224000000_add_campaign_creator_id.js`](../migrations/20190224000000_add_campaign_creator_id.js)

Once you are sure your schema is in line with the above Knex migrations, manually insert the Knex migration records to mark these two as completed:

```sql
INSERT INTO knex_migrations (name, batch, migration_time)
VALUES
  ('20190207220000_init_db.js', 1, now()),
  ('20190224000000_add_campaign_creator_id.js', 1, now())
;
```

### Remaining Migrations

Running `yarn knex migrate:latest` will execute the remining migrations. Most of these do not need special attention. There are, however, a few exceptions:

**Special Notes**

- `20190225000000_add_message_campaign_contact_id.js` -- You will want to backfill `message.campaign_contact_id` using [`associate-messages.js`](../dev-tools/associate-messages.js).
  - _NOTE:_ This requires changing database engine `mysql` --> `pg`.
- [`20190426113700_add_unique_cc_campaign_call.js`](../migrations/20190426113700_add_unique_cc_campaign_call.js) -- See inline notes.
- [`20190604154700_add_messaging_service_tables.js`](../migrations/20190604154700_add_messaging_service_tables.js) and [`20190618151200_messaging_service_account_keys.js`](../migrations/20190618151200_messaging_service_account_keys.js) -- You will need to manually insert at least one record (messaging service SID, account SID, and encrypted auth token) for each organization.
  - The [`symmetric-encrypt.js`](../dev-tools/symmetric-encrypt.js) script can be used to encrypt the auth token. See inline notes.
