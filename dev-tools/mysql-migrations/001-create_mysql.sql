-- Thinky does not create the MySQL columns correctly.
-- Run this script instead to initially create the Spoke schema.

-- Delete all tables:
-- DROP TABLE `assignment`; DROP TABLE `campaign`; DROP TABLE `campaign_contact`; DROP TABLE `canned_response`; DROP TABLE `interaction_step`; DROP TABLE `invite`; DROP TABLE `job_request`; DROP TABLE `log`; DROP TABLE `message`; DROP TABLE `migrations`; DROP TABLE `opt_out`; DROP TABLE `organization`; DROP TABLE `pending_message_part`; DROP TABLE `question_response`; DROP TABLE `user`; DROP TABLE `user_cell`; DROP TABLE `user_organization`; DROP TABLE `zip_code`;

SET autocommit=0;
START TRANSACTION;

-- ----------------
-- Create tables
-- ----------------

CREATE TABLE assignment (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    campaign_id int(11) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    max_contacts int(11),
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE campaign (
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
    timezone varchar(255),
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE campaign_contact (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    assignment_id int(11),
    external_id varchar(255) DEFAULT '',
    first_name varchar(255) DEFAULT '',
    last_name varchar(255) DEFAULT '',
    cell varchar(15) NOT NULL,
    zip varchar(255) DEFAULT '',
    custom_fields varchar(255) DEFAULT '{}',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message_status varchar(255) DEFAULT 'needsMessage',
    is_opted_out bool DEFAULT 0,
    timezone_offset varchar(255) DEFAULT '',
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE canned_response (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    `text` text NOT NULL,
    title text NOT NULL,
    user_id int(11),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE interaction_step (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    question varchar(255) DEFAULT '',
    script text DEFAULT '',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parent_interaction_id int(11),
    answer_option varchar(255) DEFAULT '',
    answer_actions varchar(255) DEFAULT '',
    is_deleted bool DEFAULT 0 NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE invite (
    id int(11) NOT NULL AUTO_INCREMENT,
    is_valid bool NOT NULL,
    `hash` text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE job_request (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_id int(11) NOT NULL,
    payload text NOT NULL,
    queue_name varchar(50) NOT NULL,
    job_type text NOT NULL,
    result_message varchar(255) DEFAULT '',
    locks_queue bool DEFAULT 0,
    assigned bool DEFAULT 0,
    `status` int(11) DEFAULT 0,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE log (
    id int(11) NOT NULL AUTO_INCREMENT,
    message_sid text NOT NULL,
    body text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE message (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11),
    user_number varchar(255) DEFAULT '',
    contact_number varchar(15) NOT NULL,
    is_from_contact bool NOT NULL,
    text varchar(255) DEFAULT '',
    service_response varchar(255) DEFAULT '',
    assignment_id int(11) NOT NULL,
    service varchar(255) DEFAULT '',
    service_id varchar(255) DEFAULT '',
    send_status varchar(10) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    queued_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    service_response_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    send_before timestamp,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE migrations (
    id int(11) NOT NULL AUTO_INCREMENT,
    completed int(11) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE opt_out (
    id int(11) NOT NULL AUTO_INCREMENT,
    cell varchar(15) NOT NULL,
    assignment_id int(11) NOT NULL,
    organization_id int(11) NOT NULL,
    reason_code varchar(255) DEFAULT '',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE organization (
    id int(11) NOT NULL AUTO_INCREMENT,
    uuid text,
    `name` text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    features varchar(255) DEFAULT '',
    texting_hours_enforced bool DEFAULT 0,
    texting_hours_start int(11) DEFAULT 9,
    texting_hours_end int(11) DEFAULT 21,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE pending_message_part (
    id int(11) NOT NULL AUTO_INCREMENT,
    `service` varchar(100) NOT NULL,
    service_id text NOT NULL,
    parent_id varchar(255) DEFAULT '',
    service_message text NOT NULL,
    user_number varchar(255) DEFAULT '',
    contact_number text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE question_response (
    id int(11) NOT NULL AUTO_INCREMENT,
    campaign_contact_id int(11) NOT NULL,
    interaction_step_id int(11) NOT NULL,
    `value` text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE `user` (
    id int(11) NOT NULL AUTO_INCREMENT,
    auth0_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    cell text NOT NULL,
    email text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_cell text,
    is_superadmin bool,
    terms bool DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE user_cell (
    id int(11) NOT NULL AUTO_INCREMENT,
    cell text NOT NULL,
    user_id int(11) NOT NULL,
    service text,
    is_primary bool,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE user_organization (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    organization_id int(11) NOT NULL,
    role text NOT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE zip_code (
    zip VARCHAR(5) NOT NULL,
    city text NOT NULL,
    `state` text NOT NULL,
    latitude real NOT NULL,
    longitude real NOT NULL,
    timezone_offset real NOT NULL,
    has_dst bool NOT NULL,
    PRIMARY KEY (zip)
) ENGINE=MyISAM;


-- ----------------
-- Create indices
-- ----------------

-- Assignment
CREATE INDEX assignment_user_id_index
    ON assignment(user_id) USING btree;

CREATE INDEX assignment_campaign_id_index
    ON assignment(campaign_id) USING btree;

-- Campaign
CREATE INDEX campaign_organization_id_index
    ON campaign(organization_id) USING btree;

-- Campaign Contact
CREATE INDEX campaign_contact_assignment_id_index
    ON campaign_contact(assignment_id) USING btree;

CREATE INDEX campaign_contact_campaign_id_index
    ON campaign_contact(campaign_id) USING btree;

CREATE INDEX campaign_contact_cell_index
    ON campaign_contact(cell) USING btree;

CREATE INDEX campaign_contact_campaign_id_assignment_id_index
    ON campaign_contact(campaign_id,assignment_id) USING btree;

CREATE INDEX campaign_contact_assignment_id_timezone_offset_index
    ON campaign_contact(assignment_id, timezone_offset) USING btree;

-- Canned Response

CREATE INDEX canned_response_campaign_id_index
    ON canned_response(campaign_id) USING btree;

CREATE INDEX canned_response_user_id_index
    ON canned_response(user_id) USING btree;

-- Interaction Step

CREATE INDEX interaction_step_parent_interaction_id_index
    ON interaction_step(parent_interaction_id) USING btree;

CREATE INDEX interaction_step_campaign_id_index
    ON interaction_step(campaign_id) USING btree;

-- Invite

CREATE INDEX invite_is_valid_index
    ON invite(is_valid) USING btree;

-- Job Request

CREATE INDEX job_request_queue_name_index
    ON job_request(queue_name) USING btree;

-- Message

CREATE INDEX message_assignment_id_index
    ON message(assignment_id) USING btree;

CREATE INDEX message_send_status_index
    ON message(send_status) USING btree;

CREATE INDEX message_user_number_index
    ON message(user_number) USING btree;

CREATE INDEX message_contact_number_index
    ON message(contact_number) USING btree;

CREATE INDEX message_service_id_index
    ON message(service_id) USING btree;

-- Opt Out

CREATE INDEX opt_out_cell_index
    ON opt_out(cell) USING btree;

CREATE INDEX opt_out_assignment_id_index
    ON opt_out(assignment_id) USING btree;

CREATE INDEX opt_out_organization_id_index
    ON opt_out(organization_id) USING btree;

-- Question Response

CREATE INDEX question_response_campaign_contact_id_index
    ON question_response(campaign_contact_id) USING btree;

CREATE INDEX question_response_interaction_step_id_index
    ON question_response(interaction_step_id) USING btree;

-- Pending Message Part

CREATE INDEX pending_message_part_parent_id_index
    ON pending_message_part(parent_id) USING btree;

CREATE INDEX pending_message_part_service_index
    ON pending_message_part(`service`) USING btree;

-- User Organization

CREATE INDEX user_organization_user_id_index
    ON user_organization(user_id) USING btree;

CREATE INDEX user_organization_organization_id_index
    ON user_organization(organization_id) USING btree;

CREATE INDEX user_organization_organization_id_user_id_index
    ON user_organization(organization_id,user_id) USING btree;

-- ----------------
-- Add Foreign Keys
-- ----------------

ALTER TABLE assignment
    ADD CONSTRAINT assignment_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES campaign(id);

ALTER TABLE assignment
    ADD CONSTRAINT assignment_user_id_foreign FOREIGN KEY (user_id) REFERENCES `user`(id);

ALTER TABLE campaign_contact
    ADD CONSTRAINT campaign_contact_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES assignment(id);

ALTER TABLE campaign_contact
    ADD CONSTRAINT campaign_contact_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES campaign(id);

ALTER TABLE campaign
    ADD CONSTRAINT campaign_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES organization(id);

ALTER TABLE canned_response
    ADD CONSTRAINT canned_response_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES campaign(id);

ALTER TABLE canned_response
    ADD CONSTRAINT canned_response_user_id_foreign FOREIGN KEY (user_id) REFERENCES `user`(id);

ALTER TABLE interaction_step
    ADD CONSTRAINT interaction_step_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES campaign(id);

ALTER TABLE interaction_step
    ADD CONSTRAINT interaction_step_parent_interaction_id_foreign FOREIGN KEY (parent_interaction_id) REFERENCES interaction_step(id);

ALTER TABLE job_request
    ADD CONSTRAINT job_request_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES campaign(id);

ALTER TABLE message
    ADD CONSTRAINT message_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES assignment(id);

ALTER TABLE message
    ADD CONSTRAINT message_user_id_foreign FOREIGN KEY (user_id) REFERENCES `user`(id);

ALTER TABLE opt_out
    ADD CONSTRAINT opt_out_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES assignment(id);

ALTER TABLE opt_out
    ADD CONSTRAINT opt_out_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES organization(id);

ALTER TABLE question_response
    ADD CONSTRAINT question_response_campaign_contact_id_foreign FOREIGN KEY (campaign_contact_id) REFERENCES campaign_contact(id);

ALTER TABLE question_response
    ADD CONSTRAINT question_response_interaction_step_id_foreign FOREIGN KEY (interaction_step_id) REFERENCES interaction_step(id);

ALTER TABLE user_cell
    ADD CONSTRAINT user_cell_user_id_foreign FOREIGN KEY (user_id) REFERENCES `user`(id);

ALTER TABLE user_organization
    ADD CONSTRAINT user_organization_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES organization(id);

ALTER TABLE user_organization
    ADD CONSTRAINT user_organization_user_id_foreign FOREIGN KEY (user_id) REFERENCES `user`(id);


-- -------------
-- Peg migration
-- -------------

INSERT INTO migrations (completed) VALUES (14);

COMMIT;

SET autocommit=1;
