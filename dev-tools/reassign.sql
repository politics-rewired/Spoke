SELECT
    message.id as message_id,
    campaign_contact.assignment_id as assignment_id
FROM message
    JOIN campaign_contact
        ON campaign_contact.cell = message.contact_number
        AND message.assignment_id != campaign_contact.assignment_id;

-- To be used like (make sure you update the query and dump file!):
-- mysql -h bernie-pgbouncer.politicsrewired.com -P 4006 -p -u spoke spoke_prod -e "SELECT message.id as message_id, campaign_contact.assignment_id as assignment_id FROM message JOIN campaign_contact ON campaign_contact.cell = message.contact_number AND message.assignment_id != campaign_contact.assignment_id;" | sed "s/'/\'/;s/\t/\",\"/g;s/^/\"/;s/$/\"/;s/\n//g" > ~/DUMP3.csv