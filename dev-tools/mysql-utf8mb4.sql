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

