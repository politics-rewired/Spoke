import axios from "axios";
import escapeRegExp from "lodash/escapeRegExp";

import { CampaignContact } from "../api/campaign-contact";
import { User } from "../api/user";

export const delimiters = {
  startDelimiter: "{",
  endDelimiter: "}"
};

export const delimit = (text: string) => {
  const { startDelimiter, endDelimiter } = delimiters;
  return `${startDelimiter}${text}${endDelimiter}`;
};

// const REQUIRED_UPLOAD_FIELDS = ['firstName', 'lastName', 'cell']
const TOP_LEVEL_UPLOAD_FIELDS = [
  "firstName",
  "lastName",
  "cell",
  "zip",
  "external_id"
];
const TEXTER_SCRIPT_FIELDS = ["texterFirstName", "texterLastName"];

// Fields that should be capitalized when a script is applied
const TITLE_CASE_FIELDS = [
  "firstName",
  "lastName",
  "texterFirstName",
  "texterLastName"
];

const VALID_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/3gpp",
  "video/mp4"
];

const mediaExtractor = /\[\s*(http[^\]\s]*)\s*\]/;

// Special first names that should not be capitalized
const LOWERCASE_FIRST_NAMES = ["friend", "there"];

// TODO: This will include zipCode even if you ddin't upload it
export const allScriptFields = (customFields: string[]) =>
  TOP_LEVEL_UPLOAD_FIELDS.concat(TEXTER_SCRIPT_FIELDS).concat(customFields);

export const titleCase = (str: string) =>
  str
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const getScriptFieldValue = (
  contact: CampaignContact,
  texter: User,
  fieldName: string
) => {
  let result;
  if (fieldName === "texterFirstName") {
    result = texter.firstName;
  } else if (fieldName === "texterLastName") {
    result = texter.lastName;
  } else if (TOP_LEVEL_UPLOAD_FIELDS.indexOf(fieldName) !== -1) {
    result = contact[fieldName as keyof CampaignContact];
  } else {
    const customFieldNames = JSON.parse(contact.customFields);
    result = customFieldNames[fieldName];
  }

  const isTitleCaseField = TITLE_CASE_FIELDS.includes(fieldName);
  const isSpecialFirstName =
    fieldName === "firstName" &&
    LOWERCASE_FIRST_NAMES.includes(result.toLowerCase());
  if (isTitleCaseField && !isSpecialFirstName) {
    result = titleCase(result);
  }

  return result;
};

interface ApplyScriptOptions {
  script: string;
  contact: CampaignContact;
  customFields: string[];
  texter: User;
}

export const applyScript = ({
  script,
  contact,
  customFields,
  texter
}: ApplyScriptOptions) => {
  const scriptFields = allScriptFields(customFields);
  let appliedScript = script;

  for (const field of scriptFields) {
    const re = new RegExp(escapeRegExp(delimit(field)), "g");
    appliedScript = appliedScript.replace(
      re,
      getScriptFieldValue(contact, texter, field)
    );
  }
  return appliedScript;
};

export const getMessageType = (text: string) => {
  return mediaExtractor.test(text) ? "MMS" : "SMS";
};

export const isAttachmentImage = async (text: string) => {
  const results = text.match(mediaExtractor);
  if (results) {
    // eslint-disable-next-line prefer-destructuring
    const mediaUrl = results[1];

    try {
      const response = await axios.head(mediaUrl);
      return VALID_CONTENT_TYPES.includes(response.headers["content-type"]);
    } catch (e) {
      console.error("Unable to fetch details from URL");
    }
    return false;
  }

  return true;
};
