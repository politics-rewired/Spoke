import stream from "stream";

export interface StorageBackend {
  upload(bucket: string, key: string, payload: any): Promise<any>;
  getUploadStream(bucket: string, key: string): Promise<stream.Writable>;
  getDownloadUrl(bucket: string, key: string): Promise<string>;
}
