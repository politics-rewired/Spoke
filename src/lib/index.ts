import _ from "lodash";
import zlib from "zlib";

import { getDisplayPhoneNumber, getFormattedPhoneNumber } from "./phone-format";
import { sleep } from "./utils";

export { getFormattedPhoneNumber, getDisplayPhoneNumber };

export {
  getFormattedZip,
  zipToTimeZone,
  findZipRanges,
  getCommonZipRanges
} from "./zip-format";
export { DstHelper } from "./dst-helper";
export { isClient } from "./is-client";
export { sleep };
export {
  findParent,
  getInteractionPath,
  getInteractionTree,
  interactionStepForId,
  getTopMostParent,
  getChildren,
  makeTree
} from "./interaction-step-helpers";

export {
  ROLE_HIERARCHY,
  getHighestRole,
  hasRole,
  isRoleGreater
} from "./permissions";

export const gzip = (str: string) =>
  new Promise((resolve, reject) => {
    zlib.gzip(str, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

export const gunzip = (buf: zlib.InputType) =>
  new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
