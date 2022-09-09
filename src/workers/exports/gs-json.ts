import { Storage } from "@google-cloud/storage";

import { config } from "../../config";
import type { StorageBackend } from "./types";

const fetchKeys = () => {
  const keysEnvVar = config.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keysEnvVar) {
    throw new Error(
      "The $GOOGLE_APPLICATION_CREDENTIALS environment variable was not found!"
    );
  }
  const keys = JSON.parse(keysEnvVar);
  return keys;
};

let _storage: Storage | undefined;
const storage = (): Storage => {
  if (_storage === undefined) {
    const keys = fetchKeys();
    const credentials = {
      client_email: keys.client_email,
      private_key: keys.private_key
    };
    _storage = new Storage({ credentials, projectId: keys.project_id });
  }
  return _storage;
};

const getUploadStream = async (bucket: string, key: string) => {
  const uploadStream = await storage()
    .bucket(bucket)
    .file(key)
    .createWriteStream({ gzip: true });
  return uploadStream;
};

/**
 * Upload a payload to Google Cloud Storage.
 *
 * @param {string} bucket Name of the GCS bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @param {Buffer|Uint8Array|Blob|string|Readable} payload Payload to upload
 */
const upload = async (bucket: string, key: string, payload: any) => {
  return new Promise((resolve, reject) => {
    getUploadStream(bucket, key)
      .then((uploadStream) => {
        uploadStream.write(payload);
        uploadStream.end();
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      })
      .catch(reject);
  });
};

/**
 * Get a signed URL for an object that is valid for 24 hours.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @returns {string} Signed download URL
 */
const getDownloadUrl = async (bucket: string, key: string) => {
  const [url] = await storage()
    .bucket(bucket)
    .file(key)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
    });
  return url;
};

const backend: StorageBackend = {
  upload,
  getUploadStream,
  getDownloadUrl
};

export default backend;
