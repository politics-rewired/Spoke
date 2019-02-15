-- Thinky does not create the MySQL columns correctly.
-- Run this script instead to initially create the Spoke schema.

SET autocommit=0;
START TRANSACTION;

-- ----------------
-- Create tables
-- ----------------

CREATE TABLE spoke_prod.assignment (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    campaign_id int(11) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    max_contacts int(11)
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.campaign (
    id int(11) NOT NULL AUTO_INCREMENT,
    organization_id int(11) NOT NULL,
    title varchar(255) DEFAULT '',
    description varchar(255) DEFAULT '',
    is_started bool,
    due_by timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_archived bool,
    use_dynamic_assignment bool,
    logo_image_url text,
    intro_html text,
    primary_color text,
    override_organization_texting_hours bool DEFAULT 0,
    texting_hours_enforced bool DEFAULT 1,
    texting_hours_start int(11) DEFAULT 9,
    texting_hours_end int(11) DEFAULT 21,
    timezone varchar(255) DEFAULT 'US/Eastern'
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.campaign_contact (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    assignment_id int(11),
    external_id varchar(255) DEFAULT '',
    first_name varchar(255) DEFAULT '',
    last_name varchar(255) DEFAULT '',
    cell text NOT NULL,
    zip varchar(255) DEFAULT '',
    custom_fields varchar(255) DEFAULT '{}',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message_status varchar(255) DEFAULT 'needsMessage',
    is_opted_out bool DEFAULT 0,
    timezone_offset varchar(255) DEFAULT ''
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.canned_response (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    text text NOT NULL,
    title text NOT NULL,
    user_id int(11),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.interaction_step (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    question varchar(255) DEFAULT '',
    script varchar(255) DEFAULT '',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parent_interaction_id int(11),
    answer_option varchar(255) DEFAULT '',
    answer_actions varchar(255) DEFAULT '',
    is_deleted bool DEFAULT 0 NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.invite (
    id int(11) NOT NULL AUTO_INCREMENT,
    is_valid bool NOT NULL,
    hash text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.job_request (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    payload text NOT NULL,
    queue_name text NOT NULL,
    job_type text NOT NULL,
    result_message varchar(255) DEFAULT '',
    locks_queue bool DEFAULT 0,
    assigned bool DEFAULT 0,
    `status` int(11) DEFAULT 0,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.log (
    id int(11) NOT NULL AUTO_INCREMENT,
    message_sid text NOT NULL,
    body text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.lookup_tool_migrations (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(255),
    batch int(11),
    migration_time timestamp
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.lookup_tool_migrations_lock (
    `index` int(11) NOT NULL,
    is_locked int(11)
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.message (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11),
    user_number varchar(255) DEFAULT '',
    contact_number text NOT NULL,
    is_from_contact bool NOT NULL,
    text varchar(255) DEFAULT '',
    service_response varchar(255) DEFAULT '',
    assignment_id int(11) NOT NULL,
    service varchar(255) DEFAULT '',
    service_id varchar(255) DEFAULT '',
    send_status text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    queued_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    service_response_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    send_before timestamp
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.migrations (
    id int(11) NOT NULL AUTO_INCREMENT,
    completed int(11) NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.opt_out (
    id int(11) NOT NULL AUTO_INCREMENT,
    cell text NOT NULL,
    assignment_id int(11) NOT NULL,
    organization_id int(11) NOT NULL,
    reason_code varchar(255) DEFAULT '',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.organization (
    id int(11) NOT NULL AUTO_INCREMENT,
    uuid text,
    name text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    features varchar(255) DEFAULT '',
    texting_hours_enforced bool DEFAULT 0,
    texting_hours_start int(11) DEFAULT 9,
    texting_hours_end int(11) DEFAULT 21
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.pending_message_part (
    id int(11) NOT NULL AUTO_INCREMENT,
    service text NOT NULL,
    service_id text NOT NULL,
    parent_id varchar(255) DEFAULT '',
    service_message text NOT NULL,
    user_number varchar(255) DEFAULT '',
    contact_number text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.phone_data (
    `number` varchar(255) NOT NULL,
    caller_name varchar(255),
    country_code varchar(255),
    national_format varchar(255),
    mobile_country_code varchar(255),
    mobile_network_code varchar(255),
    carrier_name varchar(255),
    carrier_type varchar(255)
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.question_response (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_contact_id int(11) NOT NULL,
    interaction_step_id int(11) NOT NULL,
    value text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.`user` (
    id int(11) NOT NULL AUTO_INCREMENT,
    auth0_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    cell text NOT NULL,
    email text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_cell text,
    is_superadmin bool,
    terms bool DEFAULT 0
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.user_cell (
    id int(11) NOT NULL AUTO_INCREMENT,
    cell text NOT NULL,
    user_id int(11) NOT NULL,
    service text,
    is_primary bool
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.user_organization (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    organization_id int(11) NOT NULL,
    role text NOT NULL
) ENGINE=MyISAM;

CREATE TABLE spoke_prod.zip_code (
    zip VARCHAR(5) NOT NULL,
    city text NOT NULL,
    `state` text NOT NULL,
    latitude real NOT NULL,
    longitude real NOT NULL,
    timezone_offset real NOT NULL,
    has_dst bool NOT NULL
) ENGINE=MyISAM;


-- ------------------------------------------
-- Create primary keys
--   (Most are created with the table syntax)
-- ------------------------------------------

ALTER TABLE spoke_prod.assignment
    ADD CONSTRAINT assignment_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.campaign_contact
    ADD CONSTRAINT campaign_contact_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.campaign
    ADD CONSTRAINT campaign_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.canned_response
    ADD CONSTRAINT canned_response_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.interaction_step
    ADD CONSTRAINT interaction_step_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.invite
    ADD CONSTRAINT invite_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.job_request
    ADD CONSTRAINT job_request_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.log
    ADD CONSTRAINT log_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.lookup_tool_migrations_lock
    ADD CONSTRAINT lookup_tool_migrations_lock_pkey PRIMARY KEY (index);

ALTER TABLE spoke_prod.lookup_tool_migrations
    ADD CONSTRAINT lookup_tool_migrations_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.opt_out
    ADD CONSTRAINT opt_out_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.pending_message_part
    ADD CONSTRAINT pending_message_part_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.phone_data
    ADD CONSTRAINT phone_data_number_unique UNIQUE (`number`);

ALTER TABLE spoke_prod.phone_data
    ADD CONSTRAINT phone_data_pkey PRIMARY KEY (`number`);

ALTER TABLE spoke_prod.question_response
    ADD CONSTRAINT question_response_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.user_cell
    ADD CONSTRAINT user_cell_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.user_organization
    ADD CONSTRAINT user_organization_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);

ALTER TABLE spoke_prod.zip_code
    ADD CONSTRAINT zip_code_pkey PRIMARY KEY (zip);


-- ----------------
-- Create indices
-- ----------------

CREATE INDEX phone_data_carrier_type_index ON spoke_prod.phone_data(carrier_type) USING btree;


-- ----------------
-- Add Foreign Keys
-- ----------------

ALTER TABLE spoke_prod.assignment
    ADD CONSTRAINT assignment_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES spoke_prod.campaign(id);

ALTER TABLE spoke_prod.assignment
    ADD CONSTRAINT assignment_user_id_foreign FOREIGN KEY (user_id) REFERENCES spoke_prod.`user`(id);

ALTER TABLE spoke_prod.campaign_contact
    ADD CONSTRAINT campaign_contact_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES spoke_prod.assignment(id);

ALTER TABLE spoke_prod.campaign_contact
    ADD CONSTRAINT campaign_contact_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES spoke_prod.campaign(id);

ALTER TABLE spoke_prod.campaign
    ADD CONSTRAINT campaign_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES spoke_prod.organization(id);

ALTER TABLE spoke_prod.canned_response
    ADD CONSTRAINT canned_response_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES spoke_prod.campaign(id);

ALTER TABLE spoke_prod.canned_response
    ADD CONSTRAINT canned_response_user_id_foreign FOREIGN KEY (user_id) REFERENCES spoke_prod.`user`(id);

ALTER TABLE spoke_prod.interaction_step
    ADD CONSTRAINT interaction_step_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES spoke_prod.campaign(id);

ALTER TABLE spoke_prod.interaction_step
    ADD CONSTRAINT interaction_step_parent_interaction_id_foreign FOREIGN KEY (parent_interaction_id) REFERENCES spoke_prod.interaction_step(id);

ALTER TABLE spoke_prod.job_request
    ADD CONSTRAINT job_request_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES spoke_prod.campaign(id);

ALTER TABLE spoke_prod.message
    ADD CONSTRAINT message_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES spoke_prod.assignment(id);

ALTER TABLE spoke_prod.message
    ADD CONSTRAINT message_user_id_foreign FOREIGN KEY (user_id) REFERENCES spoke_prod.`user`(id);

ALTER TABLE spoke_prod.opt_out
    ADD CONSTRAINT opt_out_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES spoke_prod.assignment(id);

ALTER TABLE spoke_prod.opt_out
    ADD CONSTRAINT opt_out_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES spoke_prod.organization(id);

ALTER TABLE spoke_prod.question_response
    ADD CONSTRAINT question_response_campaign_contact_id_foreign FOREIGN KEY (campaign_contact_id) REFERENCES spoke_prod.campaign_contact(id);

ALTER TABLE spoke_prod.question_response
    ADD CONSTRAINT question_response_interaction_step_id_foreign FOREIGN KEY (interaction_step_id) REFERENCES spoke_prod.interaction_step(id);

ALTER TABLE spoke_prod.user_cell
    ADD CONSTRAINT user_cell_user_id_foreign FOREIGN KEY (user_id) REFERENCES spoke_prod.`user`(id);

ALTER TABLE spoke_prod.user_organization
    ADD CONSTRAINT user_organization_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES spoke_prod.organization(id);

ALTER TABLE spoke_prod.user_organization
    ADD CONSTRAINT user_organization_user_id_foreign FOREIGN KEY (user_id) REFERENCES spoke_prod.`user`(id);


-- -------------
-- Peg migration
-- -------------

INSERT INTO spoke_prod.migrations (completed) VALUES (14);

COMMIT;

SET autocommit=1;
