import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";

export const phoneNumberRegex = /(?:[-+() ]*\d){10,13}/g;
export const getFormattedPhoneNumber = (cell: string, country = "US") => {
  const phoneUtil = PhoneNumberUtil.getInstance();
  // we return an empty string vs null when the phone number is inValid
  // because when the cell is null, batch inserts into campaign contacts fail
  // then when contacts have cell.length < 12 (+1), it's deleted before assignments are created
  try {
    const inputNumber = phoneUtil.parse(cell, country);
    const isValid = phoneUtil.isValidNumber(inputNumber);
    if (isValid) {
      return phoneUtil.format(inputNumber, PhoneNumberFormat.E164);
    }
    return "";
  } catch (err) {
    return "";
  }
};

export const getDisplayPhoneNumber = (e164Number: string, country = "US") => {
  const phoneUtil = PhoneNumberUtil.getInstance();
  const parsed = phoneUtil.parse(e164Number, country);
  return phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL);
};
