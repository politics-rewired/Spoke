-- Create new column
ALTER TABLE `message` ADD campaign_contact_id INT(11) AFTER id;

-- Backfill
-- Approach from: https://stackoverflow.com/a/11588758
UPDATE
    `message` AS M
    INNER JOIN assignment AS A
        ON M.assignment_id = A.id
    INNER JOIN campaign_contact AS CC
        ON M.contact_number = CC.cell
        AND CC.assignment_id = A.id
SET M.campaign_contact_id = CC.id;

-- Update column
ALTER TABLE `message` MODIFY COLUMN campaign_contact_id INT(11) NOT NULL;
CREATE INDEX message_campaign_contact_id_index
    ON `message`(campaign_contact_id) USING btree;
ALTER TABLE `message`
    ADD CONSTRAINT message_campaign_contact_id_foreign FOREIGN KEY (campaign_contact_id)
    REFERENCES campaign_contact(id);