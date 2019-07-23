const fs = require("fs");
const Papa = require("papaparse");
const { zipToTimeZone } = require("../src/lib/zip-format");

const fetchZipCodes = () => {
  const absolutePath = `${__dirname}/data/zip-codes.csv`;
  const content = fs.readFileSync(absolutePath, { encoding: "binary" });
  const { data, error } = Papa.parse(content, { header: true });
  if (error) {
    throw new Error("Failed to seed zip codes");
  }

  console.info("Parsed a CSV with ", data.length, " zip codes");
  const zipCodes = data.filter(row => !zipToTimeZone(row.zip)).map(row => ({
    zip: row.zip,
    city: row.city,
    state: row.state,
    timezone_offset: Number(row.timezone_offset),
    has_dst: Boolean(row.has_dst),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude)
  }));

  console.info(zipCodes.length, "ZIP CODES");
  return zipCodes;
};

exports.seed = (knex, Promise) => {
  const checkHasZipCodes = async () => !!(await knex("zip_code").first("zip"));

  return checkHasZipCodes().then(hasZipCodes => {
    if (hasZipCodes) {
      return console.log("Zip codes have already been seeded. Skipping.");
    }

    const zipCodes = fetchZipCodes();
    return knex
      .batchInsert("zip_code", zipCodes)
      .then(() => log.info("Finished seeding"))
      .catch(err => log.error("error", err));
  });
};
