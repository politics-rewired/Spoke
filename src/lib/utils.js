import transform from "lodash/transform";
import isEqual from "lodash/isEqual";
import isObject from "lodash/isObject";
import { URL } from "url";

export const sleep = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export function difference(object, base) {
  function changes(object, base) {
    return transform(object, function(result, value, key) {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value;
      }
    });
  }
  return changes(object, base);
}

export const stringIsAValidUrl = s => {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};
