import { config } from "../../config";
import logger from "../../logger";
import s3 from "./s3";
import gsJson from "./gs-json";

const validAwsCredentials =
  config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY;
const valudGcpCredentials = !!config.GOOGLE_APPLICATION_CREDENTIALS;
const validS3Config =
  config.EXPORT_DRIVER === "s3" &&
  (validAwsCredentials || config.AWS_ACCESS_AVAILABLE);
const validGcpHmacConfig = config.EXPORT_DRIVER === "gs" && validAwsCredentials;
const validGcpConfig =
  config.EXPORT_DRIVER === "gs-json" && valudGcpCredentials;

const exporters = {
  s3: s3,
  "gs-json": gsJson
};

export const uploadToCloud = async (key: string, payload: string) => {
  if (!validS3Config && !validGcpHmacConfig && !validGcpConfig) {
    logger.debug(`Would have saved ${key} to cloud storage`);
    throw new Error("Invalid cloud storage configuration!");
  }

  const exportDriver = config.EXPORT_DRIVER as "s3" | "gs-json";
  const { upload, getDownloadUrl } = exporters[exportDriver];

  const prefixedKey = `${config.AWS_S3_KEY_PREFIX}${key}`;
  await upload(config.AWS_S3_BUCKET_NAME, prefixedKey, payload);
  return getDownloadUrl(config.AWS_S3_BUCKET_NAME, prefixedKey) as string;
};
