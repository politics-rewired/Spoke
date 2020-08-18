import NumbersClient from "assemble-numbers-client";

import { config } from "../../config";

interface NumbersClientOptions {
  apiKey: string;
  endpointBaseUrl?: string;
}

export const makeNumbersClient = (apiKey: string) => {
  const options: NumbersClientOptions = { apiKey };
  if (config.SWITCHBOARD_BASE_URL) {
    options.endpointBaseUrl = config.SWITCHBOARD_BASE_URL;
  }
  return new NumbersClient(options);
};
