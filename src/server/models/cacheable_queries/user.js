import { cacheOpts, memoizer } from "../../memoredis";
import thinky from "../thinky";

const { r } = thinky;

const getUserByAuth0Id = memoizer.memoize(async ({ auth0Id }) => {
  const userAuth = await r.reader("user").where("auth0_id", auth0Id).first("*");

  return userAuth;
}, cacheOpts.GetUser);

const getUserById = memoizer.memoize(async ({ id }) => {
  const userAuth = await r.reader("user").where({ id }).first("*");

  return userAuth;
}, cacheOpts.GetUser);

export async function userLoggedIn(val, field = "id") {
  const result =
    field === "id"
      ? await getUserById({ id: val })
      : field === "auth0_id"
      ? await getUserByAuth0Id({ auth0Id: val })
      : null;

  return result;
}

export async function currentEditors(redis, campaign, user) {
  // Add user ID in case of duplicate admin names
  const displayName = `${user.id}~${user.first_name} ${user.last_name}`;

  await r.redis.hsetAsync(
    `campaign_editors_${campaign.id}`,
    displayName,
    new Date()
  );
  await r.redis.expire(`campaign_editors_${campaign.id}`, 120);
  let editors = await r.redis.hgetallAsync(`campaign_editors_${campaign.id}`);

  // Only get editors that were active in the last 2 mins, and exclude the
  // current user
  editors = Object.entries(editors).filter((editor) => {
    const rightNow = new Date();
    return (
      rightNow - new Date(editor[1]) <= 120000 && editor[0] !== displayName
    );
  });

  // Return a list of comma-separated names
  return editors
    .map((editor) => {
      return editor[0].split("~")[1];
    })
    .join(", ");
}
