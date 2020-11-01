const { config } = require("../../../config");
const crypto = require("crypto");

const key = config.SESSION_SECRET;
const algorithm = config.ENCRYPTION_ALGORITHM;
const inputEncoding = config.ENCRYPTION_INPUT_ENCODING;
const outputEncoding = config.ENCRYPTION_OUTPUT_ENCODING;

if (!key) {
  throw new Error(
    "The SESSION_SECRET environment variable must be set to use crypto functions!"
  );
}

const symmetricEncrypt = (value) => {
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(value, inputEncoding, outputEncoding);
  encrypted += cipher.final(outputEncoding);
  return encrypted;
};

const symmetricDecrypt = (encrypted) => {
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, outputEncoding, inputEncoding);
  decrypted += decipher.final(inputEncoding);
  return decrypted;
};

module.exports = { symmetricEncrypt, symmetricDecrypt };
