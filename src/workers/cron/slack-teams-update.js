import knex from "knex";
import Slack from "slack";
import { config } from "../../config";
import knexConfig from "../../server/knex";

const params = { token: config.SLACK_TOKEN };
const slack = new Slack(params);

const db = knex(knexConfig);

async function main() {
  const allTeams = await db("team").select("title", "id");
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

    console.log(`Updated memberships for ${teamTitle}`, totalMembershipCount);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
