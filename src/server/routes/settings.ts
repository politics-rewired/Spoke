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
  const settings = await r
    .knex<InstanceSettingRow>("instance_setting")
    .where("name", "like", "theme.%");

  const getSetting = (settingName: string) =>
    settings.find(({ name }) => name === settingName)?.value;

  const customTheme: CustomTheme = {
    primaryColor: getSetting("theme.primaryColor"),
    secondaryColor: getSetting("theme.secondaryColor"),
    logoUrl: getSetting("theme.logoUrl"),
    firstMessageIconUrl: getSetting("theme.firstMessageIconUrl"),
    welcomeText: getSetting("theme.welcomeText")
  };
  return res.json(customTheme);
});

export default router;
