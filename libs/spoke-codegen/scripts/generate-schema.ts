import fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { schema as apiSchema } from "../../../src/gql-schema/schema";

const SCHEMA_PATH = path.join(__dirname, "../../../src/schema.graphql");

const dumpSchema = async () => {
  const fullSchema = apiSchema.join("\n\n").replace(/^[ ]{2}/gm, "");
  fs.writeFileSync(SCHEMA_PATH, fullSchema);
};

dumpSchema()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
