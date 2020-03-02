import Papa from "papaparse";

import { validateCsv, requiredUploadFields, fieldAliases } from "../../../lib";

const missingHeaderFields = fields =>
  requiredUploadFields.reduce((missingFields, requiredField) => {
    return fields.includes(requiredField)
      ? missingFields
      : missingFields.concat([requiredField]);
  }, []);

export const processContactsFile = async file => {
  const { createReadStream } = await file;
  const stream = createReadStream();

  return new Promise((resolve, reject) => {
    let missingFields = undefined;
    let resultMeta = undefined;
    const resultData = [];

    Papa.parse(stream, {
      header: true,
      transformHeader: header => {
        for (const [field, aliases] of Object.entries(fieldAliases)) {
          if (aliases.includes(header)) {
            return field;
          }
        }
        return header;
      },
      step: ({ data, meta, errors }, parser) => {
        // Exit early on bad header
        if (resultMeta === undefined) {
          resultMeta = meta;
          missingFields = missingHeaderFields(meta.fields);
          if (missingFields.length > 0) {
            parser.abort();
          }
        }

        resultData.push(data);
      },
      complete: ({ meta: { aborted } }) => {
        if (aborted) return reject(`CSV missing fields: ${missingFields}`);
        const { contacts } = validateCsv({
          data: resultData,
          meta: resultMeta
        });
        return resolve(contacts);
      },
      error: err => reject(err)
    });
  });
};
