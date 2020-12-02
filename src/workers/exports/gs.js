const { config } = require("../../config");
const { upload: awsUpload } = require("./s3");
const crypto = require("crypto");
const moment = require("moment");

const {
  AWS_ENDPOINT: awsEndpoint = "https://storage.googleapis.com",
  AWS_ACCESS_KEY_ID: hmacKey,
  AWS_SECRET_ACCESS_KEY: hmacSecret
} = config;

const encodeSign = (url, encoding = "hex") => {
  const hmac = crypto.createHmac("sha256", Buffer.from(hmacSecret, "base64"));
  hmac.update(url);
  const signature = hmac.digest(encoding);
  return signature;
};

const SIGNING_ALGORITHM = "GOOG4-HMAC-SHA256";
const PAYLOAD = "UNSIGNED-PAYLOAD";

// Must be sorted by character code of header name
const HEADERS = [["host", "storage.googleapis.com"]];

const getCanonicalHeaders = () =>
  HEADERS.map(([headerName, headerValue]) => `${headerName}:${headerValue}`);

const getSignedHeaders = () => HEADERS.map(([headerName]) => headerName);

// https://cloud.google.com/storage/docs/access-control/signed-urls#credential-scope
const getCredentialScope = () => {
  const date = moment().format("YYYYMMDD");
  const location = "auto";
  const service = "storage";
  const urlType = "goog4_request";
  return [date, location, service, urlType].join("/");
};

const encodeForwardSlashes = (str) => str.replace(/\//g, "%2F");

// https://cloud.google.com/storage/docs/authentication/canonical-requests#about-query-strings
const queryStringParameters = () => ({
  "X-Goog-Algorithm": SIGNING_ALGORITHM,
  "X-Goog-Credential": encodeForwardSlashes(
    `${hmacKey}/${getCredentialScope()}`
  ),
  "X-Goog-Date": moment().format("YYYYMMDD[T]HHMMSS[Z]"),
  "X-Goog-Expires": 60 * 60 * 24, // 24 hours
  "X-Goog-SignedHeaders": getSignedHeaders().join(";")
});

const getCanonicalQueryString = () => {
  const canonicalQueryStringParams = queryStringParameters();
  const canonicalQueryString = Object.keys(canonicalQueryStringParams)
    .sort()
    .map((key) => `${key}=${canonicalQueryStringParams[key]}`)
    .join("&");
  return canonicalQueryString;
};

const getCanonicalRequest = (bucket, key) => {
  const httpVerb = "GET";
  const pathToResource = `/${bucket}/${key}`;
  const canonicalQueryString = getCanonicalQueryString();
  const canonicalHeaders = `${getCanonicalHeaders().join("\n")}`;
  const signedHeaders = getSignedHeaders().join(";");

  const canonicalRequest = `${httpVerb}\n${pathToResource}\n${canonicalQueryString}\n${canonicalHeaders}\n\n${signedHeaders}\n${PAYLOAD}`;
  return canonicalRequest;
};

/**
 * Upload a payload to Google Cloud Storage.
 *
 * @param {string} bucket Name of the GCS bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @param {Buffer|Uint8Array|Blob|string|Readable} payload Payload to upload
 */
const upload = async (bucket, key, payload) => {
  throw new Error("Unimplemented storage engine!");
  // eslint-disable-next-line no-unreachable
  return awsUpload(bucket, key, payload, awsEndpoint);
};

/**
 * Get a signed URL for an object that is valid for 24 hours.
 *
 * @param {string} bucket Name of the S3 bucket to upload the object to
 * @param {string} key Name of key of destination object
 * @returns {string} Signed download URL
 */
const getDownloadUrl = async (bucket, key) => {
  throw new Error("Unimplemented storage engine!");

  // See https://cloud.google.com/storage/docs/access-control/signing-urls-manually
  // eslint-disable-next-line no-unreachable
  const currentDatetime = new Date().toISOString();
  const credentialScope = getCredentialScope();
  const canonicalRequest = getCanonicalRequest(bucket, key);
  const canonicalQueryString = getCanonicalQueryString();

  const hash = crypto.createHash("sha256");
  hash.update(canonicalRequest);
  const hashedCanonicalRequest = hash.digest("hex");

  const stringToSign = `${SIGNING_ALGORITHM}\n${currentDatetime}\n${credentialScope}\n${hashedCanonicalRequest}`;
  const requestSignature = encodeSign(stringToSign);

  const signedUrl = `${awsEndpoint}/${bucket}/${key}?${canonicalQueryString}&X-Goog-Signature=${requestSignature}`;
  return signedUrl;
};

module.exports = {
  upload,
  getDownloadUrl
};
