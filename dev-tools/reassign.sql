SELECT
    message.id as message_id,
    campaign_contact.assignment_id as assignment_id
FROM message
    JOIN campaign_contact
        ON campaign_contact.cell = message.contact_number
        AND message.assignment_id != campaign_contact.assignment_id;
