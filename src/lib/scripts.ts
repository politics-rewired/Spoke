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
const CAPITALIZE_FIELDS = [
  "firstName",
  "lastName",
  "texterFirstName",
  "texterLastName"
];

// Special first names that should not be capitalized
const LOWERCASE_FIRST_NAMES = ["friend", "there"];

// TODO: This will include zipCode even if you ddin't upload it
export const allScriptFields = (customFields: string[]) =>
  TOP_LEVEL_UPLOAD_FIELDS.concat(TEXTER_SCRIPT_FIELDS).concat(customFields);

const capitalize = (str: string) => {
  const strTrimmed = str.trim();
  return strTrimmed.charAt(0).toUpperCase() + strTrimmed.slice(1).toLowerCase();
};

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

  const isCapitalizedField = CAPITALIZE_FIELDS.includes(fieldName);
  const isSpecialFirstName =
    fieldName === "firstName" &&
    LOWERCASE_FIRST_NAMES.includes(result.toLowerCase());
  if (isCapitalizedField && !isSpecialFirstName) {
    result = capitalize(result);
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
