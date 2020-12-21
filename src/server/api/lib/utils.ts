import humps from "humps";

/**
 * Returns resolvers mapping GraphQL-style properties to their Postgres-style columns
 * @param {string[]} gqlKeys The lower camel case GraphQL keys to map
 */
export const sqlResolvers = (gqlKeys: string[]) =>
  gqlKeys.reduce((accumulator, gqlKey) => {
    const sqlKey = humps.decamelize(gqlKey, { separator: "_" });
    const resolver = (instance: { [key: string]: unknown }) => instance[sqlKey];
    return Object.assign(accumulator, { [gqlKey]: resolver });
  }, {});

export const capitalizeWord = (word?: string) => {
  if (word) {
    return word[0].toUpperCase() + word.slice(1);
  }
  return "";
};

export const graphileSecretRef = (organizationId: string, ref: string) =>
  `${organizationId}|${ref}`;
