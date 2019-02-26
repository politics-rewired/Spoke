SELECT campaign_contact.cell
FROM campaign_contact
   INNER JOIN (SELECT cell
                FROM  campaign_contact
                GROUP  BY cell
                HAVING COUNT(id) > 1) dup
        ON campaign_contact.cell = dup.cell;



SELECT campaign_contact.id, campaign_contact.cell
FROM campaign_contact
INNER JOIN (
        SELECT cell
        FROM campaign_contact
            GROUP BY cell
            HAVING count(cell) > 1
            LIMIT 50
    ) dup
    ON campaign_contact.cell = dup.cell;


SELECT count(*)
        FROM campaign_contact
        INNER JOIN (
                SELECT cell
                FROM campaign_contact
                    GROUP BY cell
                    HAVING count(cell) > 1
                      AND SUM(
                        CASE 
                          WHEN message_status = 'needsMessage'
                          THEN 1
                          ELSE 0
                        END
                      ) > 0
            ) dup
            ON campaign_contact.cell = dup.cell;