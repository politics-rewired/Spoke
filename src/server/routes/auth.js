import express from "express";
const router = express.Router();

import { config } from "../../config";
import authStrategies from "../auth-passport";

router.use(authStrategies[config.PASSPORT_STRATEGY]());

router.get("/logout-callback", (req, res) => {
  req.logOut();
  res.redirect("/");
});

export default router;
