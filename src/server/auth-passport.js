import passport from "passport";
import Auth0Strategy from "passport-auth0";
import passportSlack from "@aoberoi/passport-slack";
import AuthHasher from "passport-local-authenticate";
import { Strategy as LocalStrategy } from "passport-local";
import { userLoggedIn } from "./models/cacheable_queries";
import { User, Organization, r } from "./models";
import wrap from "./wrap";
import { split } from "apollo-link";

const SHOULD_AUTOJOIN_NEW_USER = !!process.env.AUTOJOIN_ORG_UUID;
const AUTOJOIN_URL = SHOULD_AUTOJOIN_NEW_USER
  ? `${process.env.BASE_URL}/${process.env.AUTOJOIN_ORG_UUID}/join`
  : "";

export function setupSlackPassport() {
  const options = {
    clientID: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/login-callback`
  };

  if (process.env.SLACK_TEAM_NAME) {
    options.authorizationURL = `https://${
      process.env.SLACK_TEAM_NAME
    }.slack.com/oauth/authorize`;
  }

  const strategy = new passportSlack.Strategy(options, function(
    accessToken,
    scopes,
    team,
    { bot, incomingWebhook },
    { user: userProfile, team: teamProfile },
    done
  ) {
    done(null, userProfile);
  });

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    const auth0Id = user.id;
    return done(null, auth0Id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      const user = await userLoggedIn(id);
      return done(null, user || false);
    })
  );

  return {
    first: passport.authenticate("slack", {
      scope: ["identity.basic", "identity.email", "identity.team"]
    }),
    callback: passport.authenticate("slack", {
      failureRedirect: "/login"
    }),
    after: async (req, res) => {
      const user = req.user;
      // set slack_id to auth0Id to avoid changing the schema
      const auth0Id = user && user.id;
      if (!auth0Id) {
        throw new Error("Null user in login callback");
      }
      const existingUser = await User.filter({ auth0_id: auth0Id });

      if (existingUser.length === 0) {
        let first_name, last_name;
        const splitName = user.name ? user.name.split(" ") : ["First", "Last"];
        if (splitName.length == 1) {
          first_name = splitName[0];
          last_name = "";
        } else if (splitName.length == 2) {
          first_name = splitName[0];
          last_name = splitName[1];
        } else {
          first_name = splitName[0];
          last_name = splitName.slice(1, splitName.length + 1).join(" ");
        }

        const userData = {
          auth0_id: auth0Id,
          // eslint-disable-next-line no-underscore-dangle
          first_name,
          // eslint-disable-next-line no-underscore-dangle
          last_name,
          cell: "unknown",
          // eslint-disable-next-line no-underscore-dangle
          email: user.email,
          is_superadmin: false
        };

        await User.save(userData);

        return redirectPostSignIn(req, res);
      }

      return redirectPostSignIn(req, res);
    }
  };
}

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/login-callback`
    },
    (accessToken, refreshToken, extraParams, profile, done) =>
      done(null, profile)
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    // This is the Auth0 user object, not the db one
    const auth0Id = user.id || user._json.sub;
    done(null, auth0Id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      // add new cacheable query
      const user = await userLoggedIn(id);
      done(null, user || false);
    })
  );

  return [
    passport.authenticate("auth0", {
      failureRedirect: "/login"
    }),
    wrap(async (req, res) => {
      const auth0Id = req.user && (req.user.id || req.user._json.sub);
      if (!auth0Id) {
        throw new Error("Null user in login callback");
      }
      const existingUser = await User.filter({ auth0_id: auth0Id });

      if (existingUser.length === 0) {
        const userMetadata =
          // eslint-disable-next-line no-underscore-dangle
          req.user._json["https://spoke/user_metadata"] ||
          // eslint-disable-next-line no-underscore-dangle
          req.user._json.user_metadata ||
          {};
        const userData = {
          auth0_id: auth0Id,
          // eslint-disable-next-line no-underscore-dangle
          first_name: userMetadata.given_name || "",
          // eslint-disable-next-line no-underscore-dangle
          last_name: userMetadata.family_name || "",
          cell: userMetadata.cell || "",
          // eslint-disable-next-line no-underscore-dangle
          email: req.user._json.email,
          is_superadmin: false
        };

        await User.save(userData);

        return redirectPostSignIn(req, res);
      }

      return redirectPostSignIn(req, res);
    })
  ];
}

function redirectPostSignIn(req, res) {
  return res.redirect(
    req.query.state == "/"
      ? SHOULD_AUTOJOIN_NEW_USER
        ? AUTOJOIN_URL
        : "/"
      : req.query.state
        ? req.query.state
        : "/"
  );
}

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "auth0_id" // using the legacy fieldname for password
    },
    function(username, password, done) {
      User.filter({ email: username }, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }

        // AuthHasher.hash(password, function(err, hashed) {
        // const passwordToSave = `${hashed.salt}|${hashed.hash}`
        // .salt and .hash
        // });
        const pwFieldSplit = user.auth0_id.split("|");
        const hashed = {
          salt: pwFieldSplit[0],
          hash: pwFieldSplit[1]
        };
        AuthHasher.verify(password, hashed, function(err, verified) {
          if (verified) {
            return done(null, false);
          } else {
            done(null, user);
          }
        });
      });
    }
  );
  passport.use(strategy);

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(
    wrap(async (id, done) => {
      const user = await User.filter({ id });
      done(null, user[0] || false);
    })
  );

  return null; // no loginCallback
}
