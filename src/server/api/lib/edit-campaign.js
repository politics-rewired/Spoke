import AutoDetectDecoderStream from "autodetect-decoder-stream";
import iconv from "iconv-lite";
import partition from "lodash/partition";
import Papa from "papaparse";

import {
  fieldAliases,
  requiredUploadFields,
  topLevelUploadFields,
  validateCsv
} from "../../../lib";

const missingHeaderFields = (fields) =>
  requiredUploadFields.reduce((missingFields, requiredField) => {
    return fields.includes(requiredField)
      ? missingFields
      : missingFields.concat([requiredField]);
  }, []);

const isTopLevelEntry = ([field, _]) => topLevelUploadFields.includes(field);
const trimEntry = ([key, value]) => [key, value.trim()];
const FIELD_DEFAULTS = { external_id: "", zip: "" };

const sanitizeRawContact = (rawContact) => {
  const allFields = Object.entries({ ...FIELD_DEFAULTS, ...rawContact });
  const [contactEntries, customFieldEntries] = partition(
    allFields,
    isTopLevelEntry
  );
  const contact = Object.fromEntries(contactEntries.map(trimEntry));
  const customFields = Object.fromEntries(customFieldEntries.map(trimEntry));
  return { ...contact, customFields };
};

export const processContactsFile = async (file, onlyCell = false) => {
  const { createReadStream } = await file;
  const stream = createReadStream()
    .pipe(new AutoDetectDecoderStream())
    .pipe(iconv.encodeStream("utf8"));

  return new Promise((resolve, reject) => {
    let missingFields;
    let resultMeta;
    const resultData = [];

    Papa.parse(stream, {
      header: true,
      transformHeader: (header) => {
        const trimmedHeader = header.trim();
        for (const [field, aliases] of Object.entries(fieldAliases)) {
          if (aliases.includes(trimmedHeader)) {
            return field;
          }
        }
        return trimmedHeader;
      },
      step: ({ data, meta, errors: _errors }, parser) => {
        // Exit early on bad header
        if (resultMeta === undefined) {
          resultMeta = meta;
          if (onlyCell) {
            missingFields = meta.fields.includes("cell");
          } else {
            missingFields = missingHeaderFields(meta.fields);
          }
          if (missingFields.length > 0) {
            parser.abort();
          }
        }
        const contact = sanitizeRawContact(data);
        resultData.push(contact);
      },
      complete: ({ meta: { aborted } }) => {
        if (aborted) return reject(`CSV missing fields: ${missingFields}`);
        const { contacts, validationStats } = validateCsv({
          data: resultData,
          meta: resultMeta,
          onlyCell
        });
        return resolve({ contacts, validationStats });
      },
      error: (err) => reject(err)
    });
  });
};

export default processContactsFile;
