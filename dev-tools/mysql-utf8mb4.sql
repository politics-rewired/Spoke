-- This migration updates the character set on an existing MySQL database

-- Note: changes will also need to be made to the RDS cluster parameter group:
--
-- character_set_client       utf8mb4
-- character_set_connection   utf8mb4
-- character_set_database     utf8mb4
-- character_set_server       utf8mb4
-- collation_connection       utf8mb4_unicode_ci
-- collation_server           utf8mb4_unicode_ci
--
-- Source: https://stackoverflow.com/a/49963840

--  For each database:
-- Or, is this done via RDS settings?
ALTER DATABASE spoke_prod CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Table level encoding changes
ALTER TABLE assignment CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign_contact CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE canned_response CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interaction_step CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE invite CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE job_request CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE knex_migrations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE knex_migrations_lock CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE log CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE lookup_tool_migrations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE lookup_tool_migrations_lock CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE message CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE migrations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE opt_out CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE organization CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pending_message_part CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE phone_data CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE question_response CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE tag CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE token CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user_cell CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user_organization CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE utterance CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE zip_code CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------------------------------------------
------ Column level encoding changes –-------
---------------------------------------------
--------- <Instructions from the guide>
-- When converting from utf8 to utf8mb4, the maximum length of a column or index key
-- is unchanged in terms of bytes. Therefore, it is smaller in terms of characters,
-- because the maximum length of a character is now four bytes instead of three.

-- For example, a TINYTEXT column can hold up to 255 bytes, which correlates to 
-- 85 three-byte or 63 four-byte characters. Let’s say you have a TINYTEXT column
-- that uses utf8 but must be able to contain more than 63 characters. Given this requirement,
-- you can’t convert this column to utf8mb4 unless you also change the data type to a longer
-- type such as TEXT — because if you’d try to fill it with four-byte characters, you’d only
-- be able to enter 63 characters, but not more.

-- The same goes for index keys. The InnoDB storage engine has a maximum index length of 767 bytes,
-- so for utf8 or utf8mb4 columns, you can index a maximum of 255 or 191 characters, respectively.
-- If you currently have utf8 columns with indexes longer than 191 characters, you will need to
-- index a smaller number of characters when using utf8mb4. (Because of this, I had to change some
-- indexed VARCHAR(255) columns to VARCHAR(191).)
--------- </Instructions from the guide>
--------- <Ben's working through it>
-- I checked via `show engines;` and we are using InnoDB, so we do have to watch out for too big indexes
-- I'm going through table by table and finding which columns need to be changed and how
-- If a table has no text or varchars, it's fine, and will be ommitted here

---------- campaign
-- campaign.title and campaign.description are varchars – we should make them of type `text` anywho
-- timezone is a varchar but really it's an enum (we know the values and that they won't be 4 byte chars), so we're fine
ALTER TABLE campaign CHANGE title title TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign CHANGE description description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign CHANGE timezone timezone VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- campaign - just noting which ones are charging to text
ALTER TABLE campaign_contact CHANGE external_id external_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign_contact CHANGE first_name first_name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- first_name changing to text
ALTER TABLE campaign_contact CHANGE last_name last_name TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- last_name changing to text
ALTER TABLE campaign_contact CHANGE cell cell VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign_contact CHANGE zip zip VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign_contact CHANGE custom_fields custom_fields TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- custom_fields changing to text
ALTER TABLE campaign_contact CHANGE message_status message_status VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE campaign_contact CHANGE timezone_offset timezone_offset VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- canned_response - both were already text
ALTER TABLE canned_response CHANGE title title TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE canned_response CHANGE `text` `text` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- interaction_step – all changed to text, except script, which was already text
ALTER TABLE interaction_step CHANGE question question TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interaction_step CHANGE script script TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interaction_step CHANGE answer_option answer_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interaction_step CHANGE answer_actions answer_actions TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- invite – was text
ALTER TABLE invite CHANGE hash hash TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- job_request - kept varchars - queue_name has an index, but it's VARCHAR(50), so that's fine
ALTER TABLE job_request CHANGE queue_name queue_name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE job_request CHANGE result_message result_message VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- knex migrations - kept varchars
ALTER TABLE knex_migrations CHANGE name name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE knex_migrations CHANGE name name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- log - was text
ALTER TABLE log CHANGE message_sid message_sid TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE log CHANGE body body TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- message - mixed, but all preserved - user_number and service are indexed 255s, making them 191s
-- first two won't have emojis for sure
ALTER TABLE message CHANGE user_number user_number varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
ALTER TABLE message CHANGE contact_number contact_number varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- already text so no adjustments needed
-- next all won't have emojis
ALTER TABLE message CHANGE `text` `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE message CHANGE service_response varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE message CHANGE service varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE message CHANGE service_id varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- opt_out - neither would have emojis
ALTER TABLE opt_out CHANGE cell cell VARCHAR(15) SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE opt_out CHANGE reason_code reason_code VARCHAR(255) SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- organization - none have emojis
ALTER TABLE organizaiton CHANGE uuid uuid TEXT SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE organization CHANGE name name TEXT SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE organization CHANGE features features VARCHAR(255) SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---------- pending_message_part - parts that have emojis (service_message) are already text
-- parent_id is indexed, making it a 191
ALTER TABLE pending_message_part CHANGE service service varchar(100) SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pending_message_part CHANGE service_id service_id text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pending_message_part CHANGE parent_id parent_id varchar(191) SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pending_message_part CHANGE service_message service_message text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pending_message_part CHANGE user_number user_number varchar(255)  SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pending_message_part CHANGE contact_number contact_number text SET utf8mb4 COLLATE utf8mb4_unicode_ci;

----------- question_response - already text
ALTER TABLE question_response CHANGE value value TEXT SET utf8mb4 COLLATE utf8mb4_unicode_ci;

----------- tag - indexed
ALTER TABLE tag CHANGE tag tag VARCHAR(191) SET utf8mb4 COLLATE utf8mb4_unicode_ci;

----------- token - indexed
ALTER TABLE token CHANGE tag tag VARCHAR(191) SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
ALTER TABLE token CHANGE token token VARCHAR(191) SET utf8mb4 COLLATE utf8mb4_unicode_ci; 

----------- user - nothing indexed except id lol
ALTER TABLE user CHANGE auth0_id auth0_id text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user CHANGE first_name first_name text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user CHANGE last_name last_name text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user CHANGE cell cell text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user CHANGE email email text SET utf8mb4 COLLATE utf8mb4_unicode_ci;

----------- user_cell
ALTER TABLE user_cell CHANGE cell cell text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user_cell CHANGE service service text SET utf8mb4 COLLATE utf8mb4_unicode_ci;

----------- utterance - token indexed
ALTER TABLE utterance CHANGE token token varchar(191) SET utf8mb4 COLLATE utf8mb4_unicode_ci;

----------- zip_code - zip is indexed but only 5 so fine
ALTER TABLE zip_code CHANGE zip zip varchar(5) SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE zip_code CHANGE city city text SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE zip_code CHANGE state state text SET utf8mb4 COLLATE utf8mb4_unicode_ci;

--------- </Ben's working through it>
--------- <Stuff to run after>
mysqlcheck -u root -p --auto-repair --optimize --all-databases

