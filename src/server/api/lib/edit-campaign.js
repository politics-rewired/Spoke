import Papa from "papaparse";
import { validateCsv } from "../../../lib";

export const processContactsFile = async file => {
  const { createReadStream, filename } = await file;
  const stream = createReadStream();

  const contacts = await new Promise((resolve, reject) =>
    Papa.parse(stream, {
      header: true,
      complete: ({ data, meta, errors: _errors }) => {
        try {
          const { contacts } = validateCsv({ data, meta });
          return resolve(contacts);
        } catch (err) {
          reject(err);
        }
      },
      error: err => reject(err)
    })
  );

  return contacts;
};
