const { upload: awsUpload } = require("./s3");
const crypto = require("crypto");

const {
  AWS_ENDPOINT: awsEndpoint = "https://storage.googleapis.com",
  AWS_ACCESS_KEY_ID: hmacKey,
  AWS_SECRET_ACCESS_KEY: hmacSecret
} = process.env;
const SIGNING_ALGORITHM = "GOOG4-RSA-SHA256";

const base64Sign = url => {
  const hmac = crypto.createHmac("sha256", hmacSecret);
  hmac.update(url);
  const signature = hmac.digest("base64");
  return signature;
};

/**
 * Upload a payload to Google Cloud Storage.
 *
 * @param {string} bucket Name of the GCS bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @param {Buffer|Uint8Array|Blob|string|Readable} payload Payload to upload
 */
const upload = async (bucket, key, payload) =>
  awsUpload(bucket, key, payload, awsEndpoint);

/**
 * Get a signed URL for an object that is valid for 24 hours.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @returns {string} Signed download URL
 */
const getDownloadUrl = async (bucket, key) => {
  throw new Error("Unimplemented!");

  // See https://cloud.google.com/storage/docs/access-control/signing-urls-manually
};

module.exports = {
  upload,
  getDownloadUrl
};
