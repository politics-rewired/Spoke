// Run this script from the top level directory to decrypt a value:
//
//    node ./dev-tools/graphile-secrets-decrypt.js ValueToBeDecrypted

require("dotenv").config();
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.SESSION_SECRET);

const result = cryptr.decrypt(process.argv[2]);
console.log(result);
process.exit(0);
