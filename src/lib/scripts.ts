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

export const VARIABLE_NAME_REGEXP = /^[a-zA-Z0-9 \-_]+$/;

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

export enum ScriptTokenType {
  Text = "Text",
  CustomField = "CustomField",
  UndefinedField = "UndefinedField"
}

export interface ScriptToElemsOptions {
  script: string;
  customFields: string[];
}

export type ScriptToken = { type: ScriptTokenType; text: string };

export interface ScriptToElemsPayload {
  tokens: ScriptToken[];
  customFieldsUsed: string[];
  undefinedFieldsUsed: string[];
}

export const scriptToTokens = (
  options: ScriptToElemsOptions
): ScriptToElemsPayload => {
  const { script, customFields } = options;

  if (script.trim().length === 0) {
    return {
      tokens: [],
      customFieldsUsed: [],
      undefinedFieldsUsed: []
    };
  }

  const customFieldTags = allScriptFields(customFields).map(
    (customField) => `{${customField}}`
  );

  const tokenRegExp = /(\{[a-zA-Z0-9\s]+\})/g;
  const scriptTokens = script.split(tokenRegExp).filter(Boolean);

  const scriptElems = scriptTokens.reduce<ScriptToElemsPayload>(
    (acc, token) => {
      if (customFieldTags.includes(token)) {
        const newToken = {
          type: ScriptTokenType.CustomField,
          text: token
        };
        return {
          ...acc,
          tokens: [...acc.tokens, newToken],
          customFieldsUsed: [...acc.customFieldsUsed, token]
        };
      }
      if (/\{[a-zA-Z0-9\s]+\}/.test(token)) {
        const newToken = {
          type: ScriptTokenType.UndefinedField,
          text: token
        };
        return {
          ...acc,
          tokens: [...acc.tokens, newToken],
          undefinedFieldsUsed: [...acc.undefinedFieldsUsed, token]
        };
      }
      const newToken = {
        type: ScriptTokenType.Text,
        text: token
      };
      return {
        ...acc,
        tokens: [...acc.tokens, newToken]
      };
    },
    {
      tokens: [],
      customFieldsUsed: [],
      undefinedFieldsUsed: []
    }
  );

  return scriptElems;
};
