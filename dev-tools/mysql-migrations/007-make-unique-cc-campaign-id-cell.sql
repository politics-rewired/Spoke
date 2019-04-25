-- 1.1 Discover duplicates
-- -----------------------

select
  contact.id as contact_id,
  duplicate.id as duplicate_id,
  contact.cell as contact_cell,
  duplicate.cell as duplicate_cell,
  contact.campaign_id as contact_campaign_id,
  duplicate.campaign_id as duplicate_campaign_id,
  contact.assignment_id as contact_assignment_id.
  duplicate.assignment_id as duplicate_assignment_id
  -- count(*) as duplicate_count
from
  campaign_contact as contact
join
  campaign_contact as duplicate
  on
    duplicate.cell = contact.cell
    and duplicate.campaign_id = contact.campaign_id
where
  duplicate.id > contact.id
  and contact.campaign_id = 411
-- group by
--   contact_campaign_id
;


-- 1.2 Migrate messages from duplicate to contact
-- ----------------------------------------------

-- Count duplicates' messages

select
  count(*) as message_count
from
  campaign_contact as contact
join
  campaign_contact as duplicate
  on
    duplicate.cell = contact.cell
    and duplicate.campaign_id = contact.campaign_id
join
  message
  on
    message.campaign_contact_id = duplicate.id
where
  duplicate.id > contact.id
  and contact.campaign_id = 411
;

-- Migrate the messages

update
  (
    select
      contact.id as contact_id,
      duplicate.id as duplicate_id,
      contact.assignment_id as contact_assignment_id
    from
      campaign_contact as contact
    join
      campaign_contact as duplicate
      on
        duplicate.cell = contact.cell
        and duplicate.campaign_id = contact.campaign_id
    where
      duplicate.id > contact.id
      and contact.campaign_id = 411
  ) duplicates
join
  message
  on message.campaign_contact_id = duplicates.duplicate_id
set
  message.campaign_contact_id = duplicates.contact_id,
  message.assignment_id = duplciates.contact_assignment_id
;

-- TODO: verify count query above is 0


-- 1.3 Migrate question responses from duplicate to contact
-- --------------------------------------------------------

-- Count duplicates' question responses

select
  count(*) as response_count
from
  campaign_contact as contact
join
  campaign_contact as duplicate
  on
    duplicate.cell = contact.cell
    and duplicate.campaign_id = contact.campaign_id
join
  question_response
  on
    question_response.campaign_contact_id = duplicate.id
where
  duplicate.id > contact.id
  and contact.campaign_id = 411
;

-- Migrate the question responses

update
  (
    select
      contact.id as contact_id,
      duplicate.id as duplicate_id
    from
      campaign_contact as contact
    join
      campaign_contact as duplicate
      on
        duplicate.cell = contact.cell
        and duplicate.campaign_id = contact.campaign_id
    where
      duplicate.id > contact.id
      and contact.campaign_id = 411
  ) duplicates
join
  question_response
  on question_response.campaign_contact_id = duplicates.duplicate_id
set
  question_response.campaign_contact_id = duplicates.contact_id
;

-- TODO: verify count query above is 0


-- 1.4 Delete duplicates
-- ---------------------

delete
from
  campaign_contact
where
  id in (
    select
      duplicate.id as id
    from
      campaign_contact as contact
    join
      campaign_contact as duplicate
      on
        duplicate.cell = contact.cell
        and duplicate.campaign_id = contact.campaign_id
    where
      duplicate.id > contact.id
      and contact.campaign_id = 411
  )
;

-- TODO: verify initial discovery count is 0

-- TODO: steps 1.1 - 1.4 for other four affected campaigns


-- 2.0 Add unique constraint
-- -------------------------

alter table
  campaign_contact
add constraint
  unique_cc_campaign_id_cell
  unique (campaign_id, cell)
;
