import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import { r } from "../models";
import { config } from "../../config";
import authStrategies, { sessionUserMap } from "../auth-passport";

router.use(authStrategies[config.PASSPORT_STRATEGY]());

router.get("/logout-callback", (req, res) => {
  req.logOut();
  res.redirect("/");
});

const superadminLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many superadmin login attempts, please try again after an hour"
});
router.post(
  "/superadmin-login",
  superadminLoginLimiter,
  async (req, res, next) => {
    const secret = config.SUPERADMIN_LOGIN_SECRET;
    const reqToken = req.get("X-Spoke-Superadmin-Token");

    if (!secret || secret !== reqToken)
      return res.status(403).send({
        message:
          "Either superadmin login is not enabled or you are using an invalid secret"
      });

    const userQuery = r.knex
      .select("user.*")
      .from("user")
      .join("user_organization", "user_organization.user_id", "user.id")
      .where({ role: "OWNER" })
      .first();

    if (req.body.organizationId) {
      userQuery.where({ organization_id: req.body.organizationId });
    }

    const user = await userQuery;

    if (user) {
      const passportUser = sessionUserMap[config.PASSPORT_STRATEGY](user);
      return req.login(passportUser, err => {
        if (err) return next(err);

        return res.status(200).send({ message: "Success" });
      });
    }

    return res.status(400).send({ message: "No owners" });
  }
);

export default router;
