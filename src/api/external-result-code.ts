/* eslint-disable import/prefer-default-export */
import type { ExternalResultCode } from "@spoke/spoke-codegen";

export const resultCodeWarning = (
  resultCode: ExternalResultCode
): string | undefined => {
  switch (resultCode.name) {
    case "Disconnected":
      return "VAN recommends using Deliverability Error instead!";
    default:
      return undefined;
  }
};
