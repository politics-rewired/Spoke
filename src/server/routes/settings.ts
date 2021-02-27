import express from "express";

import { clientConfig } from "../../config";
import { CustomTheme } from "../../styles/types";

const router = express.Router();

router.get("/settings/instance", (req, res) => {
  return res.json(clientConfig);
});

router.get("/settings/theme", (req, res) => {
  const customTheme: CustomTheme = {
    primaryColor: "#FF0000",
    secondaryColor: "#FF8888",
    logoUrl:
      "https://lh3.ggpht.com/QcM5ze2mGK0frV4cbdL7otLHts8p_RoC-N2mggz7M6Jv36vZN3B9Y3OmFvJwwLHuUyDc=s180"
  };
  return res.json(customTheme);
});

export default router;
