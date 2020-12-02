import { Client, PoolClient } from "pg";

/**
 * Convert an Error instance to a plain object, including all its non-iterable properties.
 * @param err Error to convert to Object
 * @returns Object representation of the error
 */
export const errToObj = (err: any): any =>
  Object.getOwnPropertyNames(err).reduce<any>((acc, name) => {
    acc[name] = err[name];
    return acc;
  }, {});

export type WithClientFn<T> = (client: PoolClient | Client) => Promise<T>;

export const withTransaction = async <T extends unknown>(
  client: PoolClient | Client,
  callback: WithClientFn<T>
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
