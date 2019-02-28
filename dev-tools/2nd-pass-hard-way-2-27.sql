-- Reference:
-- Old Brooklyn Campaign ID: 66
-- New Brooklyn Campaign ID: 74
-- Packer's assignment ID: 6145

-- Old Chicago Campaign ID: 69
-- New Chicago Campaign ID: 73
-- Packer's assignment ID: 5656

-- 0.a Check that 'messaged' have no messages and no question responses
SELECT count(*)
FROM question_response
    JOIN campaign_contact
        ON question_response.campaign_contact_id = campaign_contact.id
WHERE
    campaign_contact.campaign_id IN (66, 69)
    AND campaign_contact.assignment_id IN (5656, 6145)
    AND campaign_contact.message_status = 'messaged';

SELECT count(*)
FROM `message`
    JOIN campaign_contact
        ON `message`.campaign_contact_id = campaign_contact.id
WHERE
    campaign_contact.campaign_id IN (66, 69)
    AND campaign_contact.assignment_id IN (5656, 6145)
    AND campaign_contact.message_status = 'messaged';

-- 1.a
UPDATE campaign_contact
    SET assignment_id = 6174
WHERE
    assignment_id = 6145
    AND campaign_id = 66
    AND message_status != 'messaged';

-- 1.b
UPDATE `message`
    JOIN campaign_contact
        ON campaign_contact.id = `message`.campaign_contact_id
SET `message`.assignment_id = 6174
WHERE campaign_contact.assignment_id = 6174;


-- 2.a Update Brooklyn Event 'messaged' contacts
UPDATE campaign_contact
SET
    campaign_id = 74
WHERE
    message_status = 'messaged'
    AND campaign_id = 66
    AND assignment_id = 6145;

-- 2.b Update all Brooklyn assignments to reference new campaign
UPDATE assignment
SET
    assignment.campaign_id = 74
WHERE
    assignment.id = 6145;

-- 3.a
UPDATE campaign_contact
    SET assignment_id = 6175
WHERE
    assignment_id = 5656
    AND campaign_id = 69
    AND message_status != 'messaged';

-- 3.b
UPDATE `message`
    JOIN campaign_contact
        ON campaign_contact.id = `message`.campaign_contact_id
SET `message`.assignment_id = 6175
WHERE campaign_contact.assignment_id = 6175;


-- 4.a Update Chicago Event 'messaged' contacts
UPDATE campaign_contact
SET
    campaign_id = 73
WHERE
    message_status = 'messaged'
    AND campaign_id = 69
    AND assignment_id = 5656;

-- 4.b Update all Chicago assignments to reference new campaign
UPDATE assignment
SET
    assignment.campaign_id = 73
WHERE
    assignment.id = 5656;
