import {
  campaign as CampaignRecord,
  user as UserRecord
} from "@spoke/spoke-codegen";
import type { RedisClient } from "redis";

import { cacheOpts, memoizer } from "../../memoredis";
import thinky from "../thinky";

const { r } = thinky;

const getUserByAuth0Id = memoizer.memoize(
  async ({ auth0Id }: { auth0Id: string | number }) => {
    const userAuth = await r
      .reader("user")
      .where("auth0_id", auth0Id)
      .first("*");

    return userAuth;
  },
  cacheOpts.GetUser
);

const getUserById = memoizer.memoize(
  async ({ id }: { id: string | number }) => {
    const userAuth = await r.reader("user").where({ id }).first("*");

    return userAuth;
  },
  cacheOpts.GetUser
);

export async function userLoggedIn(
  val: string | number,
  field: "id" | "auth0_id" = "id"
) {
  const result =
    field === "id"
      ? await getUserById({ id: val })
      : field === "auth0_id"
      ? await getUserByAuth0Id({ auth0Id: val })
      : null;

  return result;
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
