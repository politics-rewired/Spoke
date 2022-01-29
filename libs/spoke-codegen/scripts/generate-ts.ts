/* eslint-disable import/no-extraneous-dependencies */
import { generate } from "@graphql-codegen/cli";
import fs from "fs";
import path from "path";

interface GeneratedTS {
  filename: string;
  content: string;
}

const SCHEMA_PATH = path.join(__dirname, "../schema.graphql");
const DOCUMENTS_GLOB = path.join(__dirname, "../src/graphql/**/*.graphql");
const OUTPUT_FILE_PATH = path.join(__dirname, "../src/generated.ts");

const generateTypes = async () => {
  const generatedFiles: GeneratedTS[] = await generate(
    {
      schema: SCHEMA_PATH,
      generates: {
        [OUTPUT_FILE_PATH]: {
          documents: DOCUMENTS_GLOB,
          plugins: [
            "typescript",
            "typescript-resolvers",
            "typescript-operations",
            "typescript-react-apollo"
          ],
          config: {
            withHooks: true,
            withComponent: false,
            withHOC: false
          }
        }
      }
    },
    true
  );

  await Promise.all(
    generatedFiles.map(async ({ filename, content }) => {
      fs.writeFileSync(filename, content);
    })
  );
};

generateTypes()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
