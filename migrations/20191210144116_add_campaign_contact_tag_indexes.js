exports.up = function(knex) {
  return knex.schema.alterTable("campaign_contact_tag", table => {
    table.index(["tag_id"], "campaign_contact_tag_tag_idx");
    // create index concurrently campaign_contact_tag_tag_idx on campaign_contact_tag (tag_id);
    table.index(["campaign_contact_id"], "campaign_contact_tag_contact_idx");
    // create index concurrently campaign_contact_tag_contact_idx on campaign_contact_tag (campaign_contact_id);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign_contact_tag", table => {
    table.dropIndex(
      ["campaign_contact_id"],
      "campaign_contact_tag_contact_idx"
    );
    // drop index concurrently campaign_contact_tag_contact_idx
    table.dropIndex(["tag_id"], "campaign_contact_tag_tag_idx");
    // drop index concurrently campaign_contact_tag_tag_idx
  });
};
