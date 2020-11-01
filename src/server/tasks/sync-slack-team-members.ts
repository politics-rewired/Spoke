import { Task, JobHelpers } from "pg-compose";
import bot from "slack";
import promiseRetry from "promise-retry";
import isEmpty from "lodash/isEmpty";

import { config } from "../../config";
import { sleep } from "../../lib/utils";
import { withTransaction } from "../utils";

const retrySlack = async <T extends unknown>(
  fn: () => Promise<T>
): Promise<T> =>
  promiseRetry({ retries: 5, maxTimeout: 1000 }, (retry) =>
    fn().catch((err) => {
      if (err.message === "ratelimited") {
        const retryS = (err.retry && parseInt(err.retry, 10)) || 0;
        return sleep(retryS * 1000).then(retry);
      }
      throw err;
    })
  );

const PARAMS = { token: config.SLACK_TOKEN };

interface SpokeTeamRow {
  id: string;
  organization_id: string;
  title: string;
}

interface SlackChannelRecord {
  id: string;
  name: string;
  name_normalized: string;
}

interface SlackPagination<T> {
  acc?: T[];
  next_cursor?: string;
}

type UserEmailMap = { [key: string]: string };

interface FetchAllChannelsOptions extends SlackPagination<SlackChannelRecord> {}

const fetchAllChannels = async (
  options: FetchAllChannelsOptions = {}
): Promise<SlackChannelRecord[]> => {
  const { acc = [], next_cursor } = options;
  const params = {
    ...PARAMS,
    types: "public_channel,private_channel",
    exclude_archived: true,
    limit: 200,
    ...(isEmpty(next_cursor) ? {} : { cursor: next_cursor })
  };
  const response = await retrySlack(() => bot.conversations.list(params));
  const { channels, response_metadata } = response;
  const strippedChannels: SlackChannelRecord = channels.map(
    ({ id, name, name_normalized }: SlackChannelRecord) => ({
      id,
      name,
      name_normalized
    })
  );

  if (response_metadata.next_cursor) {
    return await fetchAllChannels({
      acc: acc.concat(strippedChannels),
      next_cursor: response_metadata.next_cursor
    });
  } else {
    return acc.concat(strippedChannels);
  }
};

interface FetchChannelMembersOptions extends SlackPagination<any> {
  channelId: string;
}

const fetchChannelMembers = async (
  options: FetchChannelMembersOptions
): Promise<string[]> => {
  const { channelId, acc = [], next_cursor } = options;

  const params = {
    ...PARAMS,
    channel: channelId,
    limit: 1000,
    ...(isEmpty(next_cursor) ? {} : { cursor: next_cursor })
  };
  const response = await retrySlack(() => bot.conversations.members(params));
  const { members, response_metadata } = response;
  const strippedMembers = members;

  if (response_metadata.next_cursor) {
    return await fetchChannelMembers({
      channelId,
      acc: acc.concat(strippedMembers),
      next_cursor: response_metadata.next_cursor
    });
  } else {
    const allMembers = acc.concat(strippedMembers);
    return allMembers;
  }
};

let slackIdEmailCache: { [key: string]: string } = {};

const emailForSlackId = async (slackId: string) =>
  slackIdEmailCache[slackId]
    ? slackIdEmailCache[slackId]
    : retrySlack<string>(() =>
        bot.users
          .info({ ...PARAMS, user: slackId })
          .then(({ user }) => user.profile.email)
      ).then((email) => {
        slackIdEmailCache[slackId] = email;
        return email;
      });

interface SyncTeamOptions {
  spokeTeam: SpokeTeamRow;
  slackChannel: SlackChannelRecord;
  helpers: JobHelpers;
  syncOnEmail: boolean;
}

const syncTeam = async (options: SyncTeamOptions) => {
  const { spokeTeam, slackChannel, helpers, syncOnEmail } = options;

  const allChannelMembers = await fetchChannelMembers({
    channelId: slackChannel.id
  });

  const whereField = syncOnEmail ? "email" : "auth0_id";
  const whereValues = syncOnEmail
    ? await Promise.all(allChannelMembers.map(emailForSlackId)).then((emails) =>
        emails.filter((email) => email !== undefined)
      )
    : allChannelMembers;

  const updateCount = await helpers.withPgClient(async (poolClient) =>
    withTransaction(poolClient, async (client) => {
      await client.query(`delete from user_team where team_id = $1`, [
        spokeTeam.id
      ]);
      return client
        .query<{ count: number }>(
          `
            with user_ids_to_add as (
              select id as user_id
              from public.user
              where ${whereField} = any ($3)
            ),
            org_memberships as (
              insert into user_organization (user_id, organization_id, role)
              select
                user_id,
                $1 as organization_id,
                'TEXTER' as role
              from user_ids_to_add
              where not exists (
                select 1 from user_organization existing
                where
                  existing.user_id = user_id
                  and existing.organization_id = $1
              )
              returning user_id
            ),
            team_memberships as (
              insert into user_team (user_id, team_id)
              select
                user_id,
                $2 as team_id
              from user_ids_to_add
              where not exists (
                select 1 from user_team existing
                where
                  existing.user_id = user_id
                  and existing.team_id = $2
              )
              returning 1
            )
            select count(*) from team_memberships
          `,
          [spokeTeam.organization_id, spokeTeam.id, whereValues]
        )
        .then(({ rows: [{ count }] }) => count);
    })
  );
  return updateCount;
};

export const syncSlackTeamMembers: Task = async (_payload, helpers) => {
  const syncOnEmail = config.PASSPORT_STRATEGY !== "slack";

  // Reset in-memory cache on each invocation
  slackIdEmailCache = {};

  const { rows: allTeams } = await helpers.query<SpokeTeamRow>(
    `select id, organization_id, title from team`
  );

  const allChannels = await fetchAllChannels();
  const syncedTeams: { title: string; updateCount: number }[] = [];

  for (const spokeTeam of allTeams) {
    const normalizedTeamName = spokeTeam.title.toLowerCase().replace(/ /g, "-");
    const matchingChannel = allChannels.find((channel) => {
      return channel.name_normalized === normalizedTeamName;
    });

    if (matchingChannel) {
      const updateCount = await syncTeam({
        spokeTeam,
        slackChannel: matchingChannel,
        helpers,
        syncOnEmail
      });

      syncedTeams.push({ title: spokeTeam.title, updateCount });
    }
  }

  helpers.logger.info("finished sycing teams", { syncedTeams });
};

export default syncSlackTeamMembers;
