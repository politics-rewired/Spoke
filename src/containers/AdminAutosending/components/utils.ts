/* eslint-disable import/prefer-default-export */

export const convertValueToLimit = (limit: string) => {
  return limit === "" ? null : parseInt(limit, 10);
};
