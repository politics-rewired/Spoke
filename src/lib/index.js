import _ from "lodash";
import Papa from "papaparse";
import zlib from "zlib";

import { getDisplayPhoneNumber, getFormattedPhoneNumber } from "./phone-format";
import { sleep } from "./utils";
import { getFormattedZip } from "./zip-format";

export { getFormattedPhoneNumber, getDisplayPhoneNumber };

export {
  getFormattedZip,
  zipToTimeZone,
  findZipRanges,
  getCommonZipRanges
} from "./zip-format";
export { getProcessEnvTz } from "./tz-helpers";
export { DstHelper } from "./dst-helper";
export { isClient } from "./is-client";
export { sleep };
export {
  findParent,
  getInteractionPath,
  getInteractionTree,
  sortInteractionSteps,
  interactionStepForId,
  getTopMostParent,
  getChildren,
  makeTree
} from "./interaction-step-helpers";

export const fieldAliases = {
  firstName: ["first_name", "firstname"],
  lastName: ["last_name", "lastname"]
};

export const requiredUploadFields = ["firstName", "lastName", "cell"];

export const topLevelUploadFields = [
  "firstName",
  "lastName",
  "cell",
  "zip",
  "external_id"
];

const notCustomFields = topLevelUploadFields
  .map(field => fieldAliases[field] || [field])
  .reduce((acc, fieldWithAliases) => acc.concat(fieldWithAliases), []);

export {
  ROLE_HIERARCHY,
  getHighestRole,
  hasRole,
  isRoleGreater
} from "./permissions";

const PHONE_NUMBER_COUNTRY =
  typeof window !== "undefined"
    ? window.PHONE_NUMBER_COUNTRY
    : require("../config").config.PHONE_NUMBER_COUNTRY;

const getValidatedData = (data, optOuts) => {
  const optOutCells = optOuts.map(optOut => optOut.cell);
  let validatedData;
  let result;
  // For some reason destructuring is not working here
  result = _.partition(data, row => !!row.cell);
  [validatedData] = result;
  const missingCellRows = result[1];

  validatedData = _.map(validatedData, row =>
    _.extend(row, {
      cell: getFormattedPhoneNumber(row.cell, PHONE_NUMBER_COUNTRY)
    })
  );
  // Restrict to 10-digit US numbers
  result = _.partition(validatedData, row =>
    /^\+1[0-9]{10}$/.test(row.cell || "")
  );
  [validatedData] = result;
  const invalidCellRows = result[1];

  const count = validatedData.length;
  validatedData = _.uniqBy(validatedData, row => row.cell);
  const dupeCount = count - validatedData.length;

  result = _.partition(
    validatedData,
    row => optOutCells.indexOf(row.cell) === -1
  );
  [validatedData] = result;
  const optOutRows = result[1];

  validatedData = _.map(validatedData, row =>
    _.extend(row, {
      zip: row.zip ? getFormattedZip(row.zip) : null
    })
  );
  const zipCount = validatedData.filter(row => !!row.zip).length;

  return {
    validatedData,
    validationStats: {
      dupeCount,
      optOutCount: optOutRows.length,
      invalidCellCount: invalidCellRows.length,
      missingCellCount: missingCellRows.length,
      zipCount
    }
  };
};

export const gzip = str =>
  new Promise((resolve, reject) => {
    zlib.gzip(str, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

export const gunzip = buf =>
  new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

export const validateCsv = ({ data, meta }) => {
  const { fields } = meta;

  const missingFields = [];
  const useAliases = {};

  for (const field of requiredUploadFields) {
    if (!fields.includes(field)) {
      let fieldFoundViaAlias = false;
      for (const alias of fieldAliases[field] || []) {
        if (fields.includes(alias)) {
          useAliases[field] = alias;
          fieldFoundViaAlias = true;
        }
      }

      if (!fieldFoundViaAlias) {
        missingFields.push(field);
      }
    }
  }

  if (missingFields.length > 0) {
    const errorMessage = `Missing fields: ${missingFields.join(", ")}`;
    throw new Error(errorMessage);
  } else {
    if (Object.keys(useAliases).length > 0) {
      for (const row of data) {
        for (const field of Object.keys(useAliases)) {
          row[field] = row[useAliases[field]];
          delete row[useAliases[field]];
        }
      }
    }

    const { validationStats, validatedData } = getValidatedData(data, []);

    const customFields = fields.filter(
      field => !notCustomFields.includes(field)
    );

    return {
      customFields,
      validationStats,
      contacts: validatedData
    };
  }
};

export const parseCSV = (file, optOuts, callback) => {
  Papa.parse(file, {
    // worker: true,
    header: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data, meta, errors: _errors }, _file) => {
      const result = validateCsv({ data, meta });
      callback(result);
    }
  });
};
