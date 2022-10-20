import Crypto from "crypto";
import fs from "fs";
import escapeRegExp from "lodash/escapeRegExp";
import isEqual from "lodash/isEqual";
import isObject from "lodash/isObject";
import transform from "lodash/transform";
import os from "os";
import path from "path";
import request from "superagent";

export type TempDownloadHandler = <T>(filePath: string) => Promise<T> | T;

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
  let fileDownloaded = false;
  const file = fs.createWriteStream(filePath);

  file.on("error", () => {
    fileDownloaded = false;
    fs.unlinkSync(filePath);
  });

  const fileWritePromise = new Promise((resolve) => {
    file.on("finish", () => {
      fileDownloaded = true;
      file.close();
      resolve(true);
    });
  });

  try {
    const downloadRequest = request.get(url);
    downloadRequest.pipe(file);
    fileDownloaded = true;
  } catch (e) {
    fileDownloaded = false;
    fs.unlinkSync(filePath);
  }

  await fileWritePromise;
  return fileDownloaded;
};

export const withTempDownload = async (
  fileUrl: string,
  handler: TempDownloadHandler
) => {
  const tempFilePath = path.join(
    os.tmpdir(),
    `tempFile-${Crypto.randomBytes(16).toString("hex")}`
  );
  const fileDownloaded = await downloadFromUrl(fileUrl, tempFilePath);

  if (!fileDownloaded) return false;

  const result = await handler(tempFilePath);

  fs.unlinkSync(tempFilePath);
  return result;
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
