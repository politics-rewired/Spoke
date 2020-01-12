// Run this script from the top level directory to encrypt a value:
//
//    node ./dev-tools/symmetric-encrypt.js ValueToBeEncrypted

require("dotenv").config();
const { symmetricDecrypt } = require("../src/server/api/lib/crypto");

const result = symmetricDecrypt(process.argv[2]);
console.log(result);
process.exit(0);
