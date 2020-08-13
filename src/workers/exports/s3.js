const AWS = require("aws-sdk");
const { config } = require("../../config");

const { AWS_ENDPOINT: awsEndpoint } = config;

const createS3 = (bucket, endpointUrl = awsEndpoint) => {
  let endpoint = undefined;
  if (endpointUrl) {
    endpoint = new AWS.Endpoint(endpointUrl);
  }
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
  const credentials = new AWS.Credentials(
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY
  );
  const s3Client = new AWS.S3({
    signatureVersion: "v4",
    params: { Bucket: bucket },
    credentials,
    endpoint
  });
  return s3Client;
};

/**
 * Upload a payload to AWS S3.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @param {Buffer|Uint8Array|Blob|string|Readable} payload Payload to upload
 */
const upload = async (bucket, key, payload, endpointUrl) => {
  const s3Client = createS3(bucket, endpointUrl);
  const uploadParams = { Key: key, Body: payload };
  return s3Client.putObject(uploadParams).promise();
};

/**
 * Get a signed URL for an object that is valid for 24 hours.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @returns {string} Signed download URL
 */
const getDownloadUrl = async (bucket, key) => {
  const s3Client = createS3(bucket);
  const expiresSeconds = 60 * 60 * 24;
  const options = { Key: key, Expires: expiresSeconds };
  return new Promise((resolve, reject) => {
    s3Client.getSignedUrl("getObject", options, (err, url) => {
      if (err) reject(err);
      resolve(url);
    });
  });
};

module.exports = {
  upload,
  getDownloadUrl
};
