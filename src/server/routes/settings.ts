import express from "express";

import { clientConfig } from "../../config";
import { CustomTheme } from "../../styles/types";
import { r } from "../models";

const router = express.Router();

interface InstanceSettingRow {
  name: string;
  type: string;
  value: string;
}

router.get("/settings/instance", (req, res) => {
  return res.json(clientConfig);
});

router.get("/settings/theme", async (req, res) => {
  const settings: InstanceSettingRow[] = await r
    .knex("instance_setting")
    .where("name", "like", "theme.%");

  const getSetting = (settingName: string) =>
    settings.find(({ name }) => name === settingName)?.value;

  const customTheme: CustomTheme = {
    canvassColor: getSetting("theme.canvassColor"),
    primaryTextColor: getSetting("theme.primaryTextColor"),
    secondaryTextColor: getSetting("theme.secondaryTextColor"),
    primaryColor: getSetting("theme.primaryColor"),
    secondaryColor: getSetting("theme.secondaryColor"),
    infoColor: getSetting("theme.infoColor"),
    successColor: getSetting("theme.successColor"),
    warningColor: getSetting("theme.warningColor"),
    errorColor: getSetting("theme.errorColor"),
    badgeColor: getSetting("theme.badgeColor"),
    disabledTextColor: getSetting("theme.disabledTextColor"),
    disabledBackgroundColor: getSetting("theme.disabledBackgroundColor"),
    defaultCampaignColor: getSetting("theme.defaultCampaignColor"),
    defaultCampaignLogo: getSetting("theme.defaultCampaignLogo"),
    logoUrl: getSetting("theme.logoUrl"),
    firstMessageIconUrl: getSetting("theme.firstMessageIconUrl"),
    welcomeText: getSetting("theme.welcomeText")
  };
  return res.json(customTheme);
});

export default router;
