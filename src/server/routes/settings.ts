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
    secondaryTextColor: getSetting("theme.secondaryTextColor") ?? "#333333",
    primaryColor: getSetting("theme.primaryColor") ?? "#001F2E",
    secondaryColor: getSetting("theme.secondaryColor") ?? "#001F2E",
    infoColor: getSetting("theme.infoColor") ?? "#FF781D",
    successColor: getSetting("theme.successColor"),
    warningColor: getSetting("theme.warningColor"),
    errorColor: getSetting("theme.errorColor"),
    badgeColor: getSetting("theme.badgeColor") ?? "#E10000",
    disabledTextColor: getSetting("theme.disabledTextColor"),
    disabledBackgroundColor: getSetting("theme.disabledBackgroundColor"),
    defaultCampaignColor: getSetting("theme.defaultCampaignColor"),
    defaultCampaignLogo: getSetting("theme.defaultCampaignLogo"),
    logoUrl: getSetting("theme.logoUrl"),
    firstMessageIconUrl: getSetting("theme.firstMessageIconUrl"),
    welcomeText: getSetting("theme.welcomeText"),
    tabBackgroundColor: getSetting("theme.tabBackgroundColor") ?? "white",
    tabTextColor: getSetting("theme.tabTextColor") ?? "black"
  };
  return res.json(customTheme);
});

export default router;

/*
ASSEMBLE PALETTE
Assemble White #EFEBDF Assemble Orange #FF0000 Assemble Navy #001F2E
SECONDARY PALETTE: PROGRESSIVE-LEFT
Secondary Orange #FF3405 Secondary Salmon #FF5B36 Secondary Red #E10000
TERTIARY PALETTE: DEMOCRATIC PARTY
Tertiary Dark Blue #004B70 Tertiary Light Blue #0085C0
*/
