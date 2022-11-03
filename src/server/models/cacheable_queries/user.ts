import type {
  campaign as CampaignRecord,
  user as UserRecord
} from "@spoke/spoke-codegen";
import type { RedisClient } from "redis";

import MemoizeHelper, { cacheOpts } from "../../memoredis";
import thinky from "../thinky";

const { r } = thinky;

const getUserByAuth0Id = async ({ auth0Id }: { auth0Id: string | number }) => {
  const userAuth = await r.reader("user").where("auth0_id", auth0Id).first("*");

  return userAuth;
};

export const getUserById = async ({ id }: { id: string | number }) => {
  const userAuth = await r.reader("user").where({ id }).first("*");

  return userAuth;
};

export async function userLoggedIn(
  val: string | number,
  field: "id" | "auth0_id" = "id"
) {
  const memoizer = await MemoizeHelper.getMemoizer();
  const memoizedGetUserById = memoizer.memoize(getUserById, cacheOpts.User);
  const memoizedgetUserByAuth0Id = memoizer.memoize(
    getUserByAuth0Id,
    cacheOpts.User
  );

  const result =
    field === "id"
      ? await memoizedGetUserById({ id: val })
      : field === "auth0_id"
      ? await memoizedgetUserByAuth0Id({ auth0Id: val })
      : null;

  return result?.is_suspended === true ? null : result;
}

export async function currentEditors(
  redis: RedisClient,
  campaign: CampaignRecord,
  user: UserRecord
) {
  // Add user ID in case of duplicate admin names
  const displayName = `${user.id}~${user.first_name} ${user.last_name}`;

  await r.redis?.hsetAsync(
    `campaign_editors_${campaign.id}`,
    displayName,
    new Date().valueOf()
  );
  await r.redis?.expire(`campaign_editors_${campaign.id}`, 120);
  const editors: Record<string, string> = await r.redis?.hgetallAsync(
    `campaign_editors_${campaign.id}`
  );

  // Only get editors that were active in the last 2 mins, and exclude the
  // current user
  const recentEditors = Object.entries(editors).filter((editor) => {
    const isCurrentUser = editor[0] === displayName;
    const isRecentEditor =
      new Date().valueOf() - new Date(editor[1]).valueOf() <= 120000;
    return isRecentEditor && !isCurrentUser;
  });

  // Return a list of comma-separated names
  return recentEditors
    .map((editor) => {
      return editor[0].split("~")[1];
    })
    .join(", ");
}
