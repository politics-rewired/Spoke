import { r } from "../models";

/**
 * Fetch overlaping campaign contacts
 * @param {number} campaignId - ID of the source campaign to find overlaps for.
 * @param {number} organizationId - ID of the organization to to check other campaigns within.
 * @param {Knex=} knexObject - Optional Knex instance to execute query with (for use within transaction).
 */
export const queryCampaignOverlaps = async (
  options,
  knexObject = undefined
) => {
  const { campaignId, organizationId, includeArchived } = options;

  if (knexObject === undefined) knexObject = r.knex;

  const result = await knexObject.raw(
    `
    with campaign_ids_in_organization as (
      select id
      from campaign
      where
        organization_id = ?
        ${includeArchived ? "" : "and is_archived = false"}
    )
    select
      overlapping_cc.campaign_id,
      count(overlapping_cc.id),
      campaign.title as campaign_title,
      max(overlapping_cc.updated_at) as last_activity
    from campaign_contact
    join campaign_contact as overlapping_cc
      on campaign_contact.cell = overlapping_cc.cell
    join campaign on overlapping_cc.campaign_id = campaign.id
    where
      campaign_contact.campaign_id = ?
      and campaign_contact.message_status = 'needsMessage'
      and exists (
        select 1
        from campaign_ids_in_organization
        where overlapping_cc.campaign_id = campaign_ids_in_organization.id
      )
      and overlapping_cc.campaign_id != ?
    group by overlapping_cc.campaign_id, campaign_title
    order by overlapping_cc.campaign_id desc;
  `,
    [organizationId, campaignId, campaignId]
  );

  return result;
};

/**
 * Fetch overlap count for
 * @param {number} campaignId - ID of the source campaign to find overlaps for.
 * @param {number} overlapCampaignId -
 * @param {Knex=} knexObject - Optional Knex instance to execute query with (for use within transaction).
 */
export const queryCampaignOverlapCount = async (
  campaignId,
  overlapCampaignId,
  knexObject
) => {
  if (knexObject === undefined) knexObject = r.knex;

  const { rows } = await knexObject.raw(
    `
    select
      count(overlapping_cc.id) as overlap_count
    from campaign_contact
    join campaign_contact as overlapping_cc
      on campaign_contact.cell = overlapping_cc.cell
    where
      campaign_contact.campaign_id = ?
      and campaign_contact.message_status = 'needsMessage'
      and overlapping_cc.campaign_id = ?
    ;
  `,
    [campaignId, overlapCampaignId]
  );

  const { overlap_count: overlapCount } = rows[0];
  return overlapCount;
};
