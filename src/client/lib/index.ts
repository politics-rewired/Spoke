/* eslint-disable import/prefer-default-export */
export const supportsClipboard = () =>
  navigator?.clipboard?.readText !== undefined;
