import { r } from "../models";
import { organizationCache } from "../models/cacheable_queries/organization";
import { config } from "../../config";
import { RequestAutoApproveType } from "../../api/organization-membership";

const SETTINGS_NAMES = {
  optOutMessage: "opt_out_message"
};

const SETTINGS_DEFAULTS = {
  defaulTexterApprovalStatus: RequestAutoApproveType.APPROVAL_REQUIRED,
  optOutMessage:
    config.OPT_OUT_MESSAGE ||
    "I'm opting you out of texts immediately. Have a great day."
};

const SETTINGS_TRANSFORMERS = {
  numbersApiKey: value => value.slice(0, 4) + "****************"
};

const SETTINGS_VALIDATORS = {
  numbersApiKey: value => {
    // User probably made a mistake - no API key will have a *
    if (value.includes("*")) {
      throw new Error("Numbers API Key cannot have character: *");
    }
  }
};

const getOrgFeature = (featureName, rawFeatures = "{}") => {
  const defaultValue = SETTINGS_DEFAULTS[featureName];
  featureName = SETTINGS_NAMES[featureName] || featureName;
  try {
    const features = JSON.parse(rawFeatures);
    const value = features[featureName] || defaultValue || null;
    if (SETTINGS_TRANSFORMERS[featureName] && value) {
      return SETTINGS_TRANSFORMERS[featureName](value);
    }
    return value;
  } catch (_err) {
    return SETTINGS_DEFAULTS[featureName] || null;
  }
};

const settingResolvers = settingNames =>
  settingNames.reduce((accumulator, settingName) => {
    const resolver = ({ features }) => getOrgFeature(settingName, features);
    return Object.assign(accumulator, { [settingName]: resolver });
  }, {});

export const resolvers = {
  OranizationSettings: {
    id: organization => organization.id,
    ...settingResolvers([
      "defaulTexterApprovalStatus",
      "optOutMessage",
      "numbersApiKey"
    ])
  }
};

export const updateOrganizationSettings = async (id, input) => {
  const currentFeatures = await r
    .knex("organization")
    .where({ id })
    .first("features")
    .then(({ features }) => JSON.parse(features))
    .catch(() => ({}));

  const features = Object.entries(input).reduce((acc, [key, value]) => {
    if (SETTINGS_VALIDATORS[key]) {
      SETTINGS_VALIDATORS[key](value);
    }
    key = SETTINGS_NAMES[key] || key;
    return Object.assign(acc, { [key]: value });
  }, currentFeatures);

  const [organization] = await r
    .knex("organization")
    .where({ id })
    .update({ features: JSON.stringify(features) })
    .returning("*");

  await organizationCache.clear(id);

  return organization;
};
