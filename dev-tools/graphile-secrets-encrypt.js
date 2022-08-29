// Run this script from the top level directory to encrypt a value:
//
//    node ./dev-tools/graphile-secrets-encrypt.js ValueToBeEncrypted

require("dotenv").config();
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.SESSION_SECRET);

const result = cryptr.encrypt(process.argv[2]);
console.log(result);
process.exit(0);
