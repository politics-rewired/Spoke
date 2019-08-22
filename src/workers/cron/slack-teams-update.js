import knex from "knex";
import Slack from "slack";
import logger from "../../logger";
import { config } from "../../config";
import knexConfig from "../../server/knex";

const params = { token: config.SLACK_TOKEN };
const slack = new Slack(params);

const db = knex(knexConfig);

async function main() {
  const allTeams = await db("team").select("title", "id");
  const allChannels = await fetchAllChannels();

  for (let team of allTeams) {
    const teamTitle = team.title;
    const teamId = team.id;

    const normalizedTeamName = teamTitle.toLowerCase().replace(/ /g, "-");
    const matchingChannel = allChannels.find(channel => {
      return channel.name_normalized === normalizedTeamName;
    });

    if (!matchingChannel) {
      logger.warn(`Did not find channel for ${teamTitle}`);
    } else {
      logger.info(`Found channel (${matchingChannel.id}) for ${teamTitle}`);

      let done = false;
      let cursor = "dummy";
      let allMembers = [];

      while (!done) {
        const iterationParams = Object.assign(
          {},
          params,
          { channel: matchingChannel.id },
          cursor == "dummy" ? {} : { cursor }
        );

        const {
          members,
          response_metadata: { next_cursor: cursor }
        } = await slack.conversations.members(iterationParams);
        allMembers = allMembers.concat(members);

        if (cursor === "") {
          done = true;
        }
      }

      const totalMembershipCount = await db.transaction(async trx => {
        await trx("user_team")
          .delete()
          .where({ team_id: teamId });

        return await trx.raw(
          `
        insert into user_team (team_id, user_id)
        select ? as team_id, id as user_id
        from public.user
        where auth0_id in (${allMembers.map(str => `'${str}'`).join(", ")})
      `,
          [teamId]
        );
      });

      logger.info(`Updated memberships for ${teamTitle}`, totalMembershipCount);
    }
  }
}

const fetchAllChannels = async (acc = [], next_cursor) => {
  const response = await slack.conversations.list(
    Object.assign(
      {},
      params,
      {
        types: "public_channel,private_channel",
        limit: 1000
      },
      next_cursor === "" ? {} : { cursor: next_cursor }
    )
  );

  const { channels, response_metadata } = response;

  if (response_metadata.next_cursor) {
    return await fetchAllChannels(
      acc.concat(channels),
      response_metadata.next_cursor
    );
  } else {
    return acc.concat(channels);
  }
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });
