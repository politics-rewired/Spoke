import { Task, JobHelpers } from "pg-compose";
import { PoolClient } from "pg";
import bot from "slack";
import promiseRetry from "promise-retry";

import { config } from "../../config";
import { sleep } from "../../lib/utils";

const retrySlack = async <T extends unknown>(
  fn: () => Promise<T>
): Promise<T> =>
  promiseRetry(retry =>
    fn().catch(err => {
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
    limit: 1000,
    ...(next_cursor === "" ? {} : { cursor: next_cursor })
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

interface FetchUserListOptions extends SlackPagination<any> {}

const fetchUserList = async (
  options: FetchUserListOptions = {}
): Promise<UserEmailMap> => {
  const { acc = [], next_cursor } = options;
  const params = {
    ...PARAMS,
    limit: 1000,
    ...(next_cursor === "" ? {} : { cursor: next_cursor })
  };
  const response = await retrySlack(() => bot.users.list(params));
  const { members, response_metadata } = response;
  const strippedMembers = members.map(({ id, profile: { email } }) => ({
    id,
    email
  }));
  if (response_metadata.next_cursor) {
    return await fetchUserList({
      acc: acc.concat(strippedMembers),
      next_cursor: response_metadata.next_cursor
    });
  } else {
    const allMembers = acc.concat(strippedMembers);
    return allMembers.reduce<UserEmailMap>(
      (acc, user) => ({ ...acc, [user.id]: user.email }),
      {}
    );
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
    ...(next_cursor === "" ? {} : { cursor: next_cursor })
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

type TransactionCallback<T> = (client: PoolClient) => Promise<T>;
const withTransaction = async <T extends unknown>(
  client: PoolClient,
  callback: TransactionCallback<T>
) => {
  await client.query("begin");
  try {
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
};

interface SyncTeamOptions {
  spokeTeam: SpokeTeamRow;
  slackChannel: SlackChannelRecord;
  helpers: JobHelpers;
  syncOnEmail: boolean;
  userEmailMap: { [key: string]: string };
}

const syncTeam = async (options: SyncTeamOptions) => {
  const {
    spokeTeam,
    slackChannel,
    helpers,
    syncOnEmail,
    userEmailMap
  } = options;

  const allChannelMembers = await fetchChannelMembers({
    channelId: slackChannel.id
  });

  const whereField = syncOnEmail ? "email" : "auth0_id";
  const whereValues = syncOnEmail
    ? allChannelMembers
        .map(id => userEmailMap[id])
        .filter(email => email !== undefined)
    : allChannelMembers;
  const wrappedValues = whereValues.map(str => `'${str}'`).join(", ");

  await helpers.withPgClient(async poolClient =>
    withTransaction(poolClient, async client => {
      await client.query(`delete from user_team where team_id = $1`, [
        spokeTeam.id
      ]);
      await client.query(
        `
          with user_ids_to_add as (
            select id as user_id
            from public.user
            where ${whereField} in (${wrappedValues})
          ),
          org_memberships as (
            insert into user_organization (user_id, organization_id, role)
            select
              user_id,
              $1 as organization_id,
              'TEXTER' as role
            from user_ids_to_add
            on conflict (user_id, organization_id) do nothing
          )
          insert into user_team (user_id, team_id)
          select
            user_id,
            $2 as team_id
          from user_ids_to_add
        `,
        [spokeTeam.organization_id, spokeTeam.id]
      );
    })
  );
};

export const syncSlackTeamMembers: Task = async (_payload, helpers) => {
  const syncOnEmail = config.PASSPORT_STRATEGY !== "slack";
  const userEmailMap = syncOnEmail ? await fetchUserList() : {};

  const { rows: allTeams } = await helpers.query<SpokeTeamRow>(
    `select id, organization_id, title from team`
  );
  const allChannels = await fetchAllChannels();

  for (const spokeTeam of allTeams) {
    const normalizedTeamName = spokeTeam.title.toLowerCase().replace(/ /g, "-");
    const matchingChannel = allChannels.find(channel => {
      return channel.name_normalized === normalizedTeamName;
    });

    if (matchingChannel) {
      await syncTeam({
        spokeTeam,
        slackChannel: matchingChannel,
        helpers,
        syncOnEmail,
        userEmailMap
      });
    }
  }
};

export default syncSlackTeamMembers;
