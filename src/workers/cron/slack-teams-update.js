import knex from "knex";
import Slack from "slack";
import { config } from "../../config";
import knexConfig from "../../server/knex";

const params = { token: config.SLACK_TOKEN };
const slack = new Slack(params);

const db = knex(knexConfig);

async function main() {
  const allTeams = await db("team").select("title id");
  const { channels: allChannels } = await slack.conversations.list(
    Object.assign({}, params, {
      types: "public_channel,private_channel"
    })
  );

  for (let team of allTeams) {
    const teamTitle = team.title;
    const teamId = team.id;

    const matchingChannel = allChannels.find(channel => {
      return (
        channel.name_normalized ===
        teamTitle.toLowerCase().replace(" ", "-", "g")
      );
    });

    if (!matchingChannel) {
      console.log(`Did not find channel for ${teamTitle}`);
      return;
    }

    console.log(`Found channel (${matchingChannel.id}) for ${teamTitle}`);

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

    await knex.trx(async trx => {
      await trx("user_team")
        .delete()
        .where({ team_id: teamId });

      await trx.raw(
        `
        insert into user_team (user_id, team_id)
        select ? as team_id, user_id as user_id
        from user
        where auth0_id in (??)
      `,
        [teamId, members]
      );
    });

    console.log(`Updated memberships for ${teamTitle}`);
  }
}

main()
  .then(() => process.exit())
  .catch(() => process.exit());
