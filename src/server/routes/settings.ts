import express from "express";

import { clientConfig } from "../../config";
import { CustomTheme } from "../../styles/types";

const router = express.Router();

router.get("/settings/instance", (req, res) => {
  return res.json(clientConfig);
});

router.get("/settings/theme", (req, res) => {
  const customTheme: CustomTheme = {
    primaryColor: "#187DBB",
    secondaryColor: "#FF0000",
    logoUrl: "https://politicsrewired.com/images/grritsabear.png",
    welcomeText: "Grr it's a bear!"
  };
  return res.json(customTheme);
});

export default router;
