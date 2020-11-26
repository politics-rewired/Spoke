/* eslint-disable import/prefer-default-export */

export const catchError = (response: any) => {
  if (response.errors) {
    throw new Error(response.errors);
  }
  return response;
};
