import {
  RequestAutoApproveType,
  UserRoleType
} from "../../api/organization-membership";
import { config } from "../../config";
import { stringIsAValidUrl } from "../../lib/utils";
import { r } from "../models";
import { organizationCache } from "../models/cacheable_queries/organization";
import { accessRequired, roleIndex } from "./errors";

interface IOrganizationSettings {
  defaulTexterApprovalStatus: string;
  optOutMessage: string;
  numbersApiKey?: string;
  trollbotWebhookUrl?: string;
  showContactLastName: boolean;
  showContactCell: boolean;
  confirmationClickForScriptLinks: boolean;
}

const SETTINGS_PERMISSIONS: {
  [key in keyof IOrganizationSettings]: UserRoleType;
} = {
  optOutMessage: UserRoleType.TEXTER,
  showContactLastName: UserRoleType.TEXTER,
  showContactCell: UserRoleType.TEXTER,
  confirmationClickForScriptLinks: UserRoleType.TEXTER,
  defaulTexterApprovalStatus: UserRoleType.OWNER,
  numbersApiKey: UserRoleType.OWNER,
  trollbotWebhookUrl: UserRoleType.OWNER
};

const SETTINGS_WRITE_PERMISSIONS: {
  [key in keyof IOrganizationSettings]: UserRoleType;
} = {
  optOutMessage: UserRoleType.OWNER,
  showContactLastName: UserRoleType.OWNER,
  showContactCell: UserRoleType.OWNER,
  confirmationClickForScriptLinks: UserRoleType.OWNER,
  defaulTexterApprovalStatus: UserRoleType.OWNER,
  numbersApiKey: UserRoleType.OWNER,
  trollbotWebhookUrl: UserRoleType.OWNER
};

const SETTINGS_NAMES: { [key: string]: string } = {
  optOutMessage: "opt_out_message"
};

const SETTINGS_DEFAULTS: IOrganizationSettings = {
  defaulTexterApprovalStatus: RequestAutoApproveType.APPROVAL_REQUIRED,
  optOutMessage:
    config.OPT_OUT_MESSAGE ??
    "I'm opting you out of texts immediately. Have a great day.",
  showContactLastName: false,
  showContactCell: false,
  confirmationClickForScriptLinks: true
};

const SETTINGS_TRANSFORMERS: { [key: string]: { (value: string): string } } = {
  numbersApiKey: (value: string) => `${value.slice(0, 4)}****************`
};

const SETTINGS_VALIDATORS: {
  [key in keyof IOrganizationSettings]?: { (value: string): void };
} = {
  numbersApiKey: (value: string) => {
    // User probably made a mistake - no API key will have a *
    if (value.includes("*")) {
      throw new Error("Numbers API Key cannot have character: *");
    }
  },
  trollbotWebhookUrl: (value: string) => {
    if (!stringIsAValidUrl(value)) {
      throw new Error("TrollBot webhook URL must be a valid URL");
    }
  }
};

const getOrgFeature = (
  featureName: keyof IOrganizationSettings,
  rawFeatures = "{}"
): string | boolean | null => {
  const defaultValue = SETTINGS_DEFAULTS[featureName];
  const finalName = SETTINGS_NAMES[featureName] ?? featureName;
  try {
    const features = JSON.parse(rawFeatures);
    const value = features[finalName] ?? defaultValue ?? null;
    const transformer = SETTINGS_TRANSFORMERS[featureName];
    if (transformer && value) {
      return SETTINGS_TRANSFORMERS[featureName](value);
    }
    return value;
  } catch (_err) {
    return SETTINGS_DEFAULTS[featureName] ?? null;
  }
};

interface SettingsResolverType {
  (
    organization: { id: string; features: string },
    _: any,
    context: { user: { id: string } }
  ): Promise<string | boolean | null>;
}

const settingResolvers = (settingNames: (keyof IOrganizationSettings)[]) =>
  settingNames.reduce((accumulator, settingName) => {
    const resolver: SettingsResolverType = async (
      { id: organizationId, features },
      _,
      { user }
    ) => {
      const permission = SETTINGS_PERMISSIONS[settingName];
      await accessRequired(user, organizationId, permission);
      return getOrgFeature(settingName, features);
    };
    return Object.assign(accumulator, { [settingName]: resolver });
  }, {});

export const resolvers = {
  OrganizationSettings: {
    id: (organization: { id: number }) => organization.id,
    ...settingResolvers([
      "defaulTexterApprovalStatus",
      "optOutMessage",
      "numbersApiKey",
      "trollbotWebhookUrl",
      "showContactLastName",
      "showContactCell",
      "confirmationClickForScriptLinks"
    ])
  }
};

export const writePermissionRequired = (
  input: Partial<IOrganizationSettings>
): UserRoleType => {
  let highestRole = UserRoleType.TEXTER;
  const settingNames = Object.keys(input) as (keyof IOrganizationSettings)[];

  for (const settingName of settingNames) {
    const settingRequires = SETTINGS_WRITE_PERMISSIONS[settingName]!;
    if ([highestRole, settingRequires].includes(UserRoleType.SUPERADMIN)) {
      highestRole = UserRoleType.SUPERADMIN;
    } else {
      highestRole =
        roleIndex(settingRequires) > roleIndex(highestRole)
          ? settingRequires
          : highestRole;
    }
  }

  return highestRole;
};

export const updateOrganizationSettings = async (
  id: number,
  input: Partial<IOrganizationSettings>
) => {
  const currentFeatures: IOrganizationSettings = await r
    .knex("organization")
    .where({ id })
    .first("features")
    .then(({ features }: { features: string }) => JSON.parse(features))
    .catch(() => ({}));

  const features = Object.entries(input).reduce((acc, entry) => {
    const [key, value] = entry as [
      keyof IOrganizationSettings,
      string | undefined
    ];
    const validator = SETTINGS_VALIDATORS[key];
    if (validator && value) {
      validator(value);
    }
    const dbKey = SETTINGS_NAMES[key] ?? key;
    return Object.assign(acc, { [dbKey]: value });
  }, currentFeatures);

  const [organization] = await r
    .knex("organization")
    .where({ id })
    .update({ features: JSON.stringify(features) })
    .returning("*");

  await organizationCache.clear(id);

  return organization;
};
