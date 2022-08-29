import AWS from "aws-sdk";
import stream from "stream";

import { config } from "../../config";
import logger from "../../logger";
import type { StorageBackend } from "./types";

const { AWS_ENDPOINT: awsEndpoint } = config;

const createS3 = (bucket: string, endpointUrl: string = awsEndpoint) => {
  let endpoint: string | undefined;
  if (endpointUrl) {
    endpoint = new AWS.Endpoint(endpointUrl).toString();
  }

  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error("Missing AWS access credentials");
  }

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
const upload = async (
  bucket: string,
  key: string,
  payload: any,
  endpointUrl?: string
) => {
  const s3Client = createS3(bucket, endpointUrl);
  const uploadParams: AWS.S3.Types.PutObjectRequest = {
    Bucket: bucket,
    Key: key,
    Body: payload
  };
  return s3Client.putObject(uploadParams).promise();
};

/**
 * Get a writeable upload stream
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 */
const getUploadStream = async (
  bucket: string,
  key: string,
  endpointUrl?: string
) => {
  const s3Client = createS3(bucket, endpointUrl);
  const passThrough = new stream.PassThrough();
  const uploadParams: AWS.S3.Types.PutObjectRequest = {
    Bucket: bucket,
    Key: key,
    Body: passThrough
  };

  // Either callback or .promise() is required to begin upload.
  s3Client
    .upload(uploadParams)
    .promise()
    .catch((err) => logger.error("Error uploading to S3: ", err));

  return passThrough;
};

/**
 * Get a signed URL for an object that is valid for 24 hours.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @returns {string} Signed download URL
 */
const getDownloadUrl = async (bucket: string, key: string): Promise<string> => {
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

const backend: StorageBackend = {
  upload,
  getUploadStream,
  getDownloadUrl
};

export default backend;
