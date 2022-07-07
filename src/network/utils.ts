/* eslint-disable import/prefer-default-export */

export const catchError = (response: any) => {
  const { errors } = response;
  if (errors) {
    const errorMessages = errors.map((error) => error.message).join(", ");
    throw new Error(errorMessages);
  }
  return response;
};
