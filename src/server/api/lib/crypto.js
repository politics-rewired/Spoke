const crypto = require("crypto");

const key = process.env.SESSION_SECRET;
const algorithm = process.env.ENCRYPTION_ALGORITHM || "aes256";
const inputEncoding = process.env.ENCRYPTION_INPUT_ENCODING || "utf8";
const outputEncoding = process.env.ENCRYPTION_OUTPUT_ENCODING || "hex";

if (!key) {
  throw new Error(
    "The SESSION_SECRET environment variable must be set to use crypto functions!"
  );
}

const symmetricEncrypt = value => {
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(value, inputEncoding, outputEncoding);
  encrypted += cipher.final(outputEncoding);
  return encrypted;
};

const symmetricDecrypt = encrypted => {
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, outputEncoding, inputEncoding);
  decrypted += decipher.final(inputEncoding);
  return decrypted;
};

module.exports = { symmetricEncrypt, symmetricDecrypt };
