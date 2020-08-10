const { Storage } = require("@google-cloud/storage");
const { config } = require("../../config");

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

let _storage = undefined;
const storage = () => {
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

/**
 * Upload a payload to Google Cloud Storage.
 *
 * @param {string} bucket Name of the GCS bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @param {Buffer|Uint8Array|Blob|string|Readable} payload Payload to upload
 */
const upload = async (bucket, key, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadStream = await storage()
        .bucket(bucket)
        .file(key)
        .createWriteStream({ gzip: true });
      uploadStream.write(payload);
      uploadStream.end();
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

const getUploadStream = async (bucket, key) => {
  const uploadStream = await storage()
    .bucket(bucket)
    .file(key)
    .createWriteStream({ gzip: true });
  return uploadStream;
};

/**
 * Get a signed URL for an object that is valid for 24 hours.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @returns {string} Signed download URL
 */
const getDownloadUrl = async (bucket, key) => {
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

module.exports = {
  upload,
  getUploadStream,
  getDownloadUrl
};
