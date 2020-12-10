/* eslint-disable max-classes-per-file */

import AuthHasher from "passport-local-authenticate";

import { capitalizeWord } from "./api/lib/utils";
import { r } from "./models";

export class LocalAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.errorType = "LocalAuthError";
  }
}

export class InvalidInviteError extends LocalAuthError {
  constructor() {
    super("Invalid invite code. Contact your administrator.");
  }
}

export class InvalidCredentialsError extends LocalAuthError {
  constructor() {
    super("Invalid username or password");
  }
}

export class EmailTakenError extends LocalAuthError {
  constructor() {
    super("That email is already taken.");
  }
}

export class MismatchedPasswordsError extends LocalAuthError {
  constructor() {
    super("Passwords don't match.");
  }
}

export class InvalidResetHashError extends LocalAuthError {
  constructor() {
    super(
      "Invalid username or password reset link. Contact your administrator."
    );
  }
}

export class StalePasswordError extends LocalAuthError {
  constructor() {
    super("Old and new password can't be the same");
  }
}

const validUuid = async (nextUrl, uuidMatch) => {
  if (!nextUrl) throw new InvalidInviteError();

  let matchingRecord;
  if (nextUrl.includes("join")) {
    matchingRecord = await r
      .knex("organization")
      .where({ uuid: uuidMatch[0] })
      .first("id");
  } else if (nextUrl.includes("invite")) {
    const splitUrl = nextUrl.split("/");
    const inviteHash = splitUrl[splitUrl.length - 1];
    matchingRecord = await r
      .knex("invite")
      .where({ hash: inviteHash })
      .first("id");
  }

  if (!matchingRecord) throw new InvalidInviteError();
};

// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
const login = async ({ password, existingUser, nextUrl, uuidMatch }) => {
  if (!existingUser) throw new InvalidCredentialsError();

  // Get salt and hash and verify user password
  const pwFieldSplit = existingUser.auth0_id.split("|");
  const hashed = {
    salt: pwFieldSplit[1] || "",
    hash: pwFieldSplit[2] || ""
  };
  return new Promise((resolve, reject) => {
    AuthHasher.verify(password, hashed, (err, verified) => {
      if (err) reject(new LocalAuthError(err.message));
      if (verified) {
        resolve(existingUser);
      }
      reject(new InvalidCredentialsError());
    });
  });
};

const signup = async ({
  lowerCaseEmail,
  password,
  existingUser,
  nextUrl,
  uuidMatch,
  reqBody
}) => {
  // Verify UUID validity
  // If there is an error, it will be caught on local strategy invocation
  await validUuid(nextUrl, uuidMatch);

  // Verify user doesn't already exist
  if (existingUser && existingUser.email === lowerCaseEmail) {
    throw new EmailTakenError();
  }

  // Verify password and password confirm fields match
  if (password !== reqBody.passwordConfirm) {
    throw new MismatchedPasswordsError();
  }

  // create the user
  return new Promise((resolve, reject) => {
    AuthHasher.hash(password, async (err, hashed) => {
      if (err) reject(new LocalAuthError(err.message));
      // .salt and .hash
      const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
      const [user] = await r
        .knex("user")
        .insert({
          email: lowerCaseEmail,
          auth0_id: passwordToSave,
          first_name: capitalizeWord(reqBody.firstName),
          last_name: capitalizeWord(reqBody.lastName),
          cell: reqBody.cell,
          is_superadmin: false
        })
        .returning("*");
      resolve(user);
    });
  });
};

const reset = ({ password, existingUser, reqBody, uuidMatch }) => {
  if (!existingUser) {
    throw new InvalidResetHashError();
  }

  // Get user resetHash and date of hash creation
  const pwFieldSplit = existingUser.auth0_id.split("|");
  const [resetHash, datetime] = [pwFieldSplit[1], pwFieldSplit[2]];

  // Verify hash was created in the last day
  const isExpired = (Date.now() - datetime) / 1000 / 60 / 60 > 24;
  if (isExpired) {
    throw new InvalidResetHashError();
  }

  // Verify the UUID in request matches hash in DB
  if (uuidMatch[0] !== resetHash) {
    throw new InvalidResetHashError();
  }

  // Verify passwords match
  if (password !== reqBody.passwordConfirm) {
    throw new MismatchedPasswordsError();
  }

  // Save new user password to DB
  return new Promise((resolve, reject) => {
    AuthHasher.hash(password, async (err, hashed) => {
      if (err) reject(new LocalAuthError(err.message));
      // .salt and .hash
      const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
      const [updatedUser] = await r
        .knex("user")
        .update({ auth0_id: passwordToSave })
        .where({ id: existingUser.id })
        .returning("*");
      resolve(updatedUser);
    });
  });
};

// Only used in the changeUserPassword GraphQl mutation
export const change = ({ user, password, newPassword, passwordConfirm }) => {
  const pwFieldSplit = user.auth0_id.split("|");
  const hashedPassword = {
    salt: pwFieldSplit[1],
    hash: pwFieldSplit[2]
  };

  // Verify password and password confirm fields match
  if (newPassword !== passwordConfirm) {
    throw new MismatchedPasswordsError();
  }

  // Verify old and new passwords are different
  if (password === newPassword) {
    throw new StalePasswordError();
  }

  return new Promise((resolve, reject) => {
    AuthHasher.verify(password, hashedPassword, (error, verified) => {
      if (error) reject(new LocalAuthError(error.message));
      if (!verified) reject(new InvalidCredentialsError());
      return AuthHasher.hash(newPassword, async (err, hashed) => {
        if (err) reject(new LocalAuthError(err.message));
        const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
        const updatedUser = await r
          .knex("user")
          .update({ auth0_id: passwordToSave })
          .where({ id: user.id });
        resolve(updatedUser);
      });
    });
  });
};

export const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    AuthHasher.hash(password, (err, hashed) => {
      if (err) return reject(err);
      return resolve(`localauth|${hashed.salt}|${hashed.hash}`);
    });
  });
};

export default { login, signup, reset, hashPassword };
