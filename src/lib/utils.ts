import fs from "fs";
import escapeRegExp from "lodash/escapeRegExp";
import isEqual from "lodash/isEqual";
import isObject from "lodash/isObject";
import transform from "lodash/transform";
import request from "request";

export const VALID_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/3gpp",
  "video/mp4"
];

export const sleep = (ms = 0) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export function difference(object: Record<any, any>, base: Record<any, any>) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  function changes(object: Record<any, any>, base: Record<any, any>) {
    return transform(object, (result: Record<any, any>, value, key) => {
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

export const downloadFromUrl = async (url: string, filePath: string) => {
  const file = fs.createWriteStream(filePath);

  const downloadRequest = request.get(url);

  const fileWritePromise = new Promise((resolve) => {
    downloadRequest.on("response", (response) => {
      if (response.statusCode !== 200) {
        // Status Code Not 200, delete file, and return false
        // we failed to download attachment
        fs.unlink(filePath, () => {
          return false;
        });
        resolve(false);
      }
      downloadRequest.pipe(file);
    });
    file.on("finish", () => {
      file.close();
      resolve(true);
    });
  });

  downloadRequest.on("error", () => {
    fs.unlink(filePath, () => {
      return false;
    });
    return false;
  });

  file.on("error", () => {
    fs.unlink(filePath, () => {
      return false;
    });
    return false;
  });

  // Return fileWritePromise which will return true for downloaded file
  // false if file errors out
  return fileWritePromise;
};

export const stringIsAValidUrl = (s: string) => {
  try {
    // eslint-disable-next-line no-new
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};

export const asPercent = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : (numerator / denominator) * 100;

export const asPercentWithTotal = (numerator: number, denominator: number) =>
  `${asPercent(numerator, denominator).toString().slice(0, 4)}%(${numerator})`;

export const replaceAll = (str: string, find: string, replace: string) =>
  str.replace(new RegExp(escapeRegExp(find), "g"), replace);
