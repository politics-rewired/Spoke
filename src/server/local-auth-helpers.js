import AuthHasher from "passport-local-authenticate";

import { User, Invite, Organization } from "./models";
import { capitalizeWord } from "./api/lib/utils";

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

  let foundUUID;
  if (nextUrl.includes("join")) {
    foundUUID = await Organization.filter({ uuid: uuidMatch[0] });
  } else if (nextUrl.includes("invite")) {
    const splitUrl = nextUrl.split("/");
    const inviteHash = splitUrl[splitUrl.length - 1];
    foundUUID = await Invite.filter({ hash: inviteHash });
  }

  if (foundUUID.length === 0) throw new InvalidInviteError();
};

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
      if (err) reject(err);
      if (verified) {
        resolve(existingUser);
      }
      throw new InvalidCredentialsError();
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
    AuthHasher.hash(password, async function(err, hashed) {
      if (err) reject(err);
      // .salt and .hash
      const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
      const user = await User.save({
        email: lowerCaseEmail,
        auth0_id: passwordToSave,
        first_name: capitalizeWord(reqBody.firstName),
        last_name: capitalizeWord(reqBody.lastName),
        cell: reqBody.cell,
        is_superadmin: false
      });
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

  // Verify hash was created in the last 15 mins
  const isExpired = (Date.now() - datetime) / 1000 / 60 > 15;
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
    AuthHasher.hash(password, async function(err, hashed) {
      if (err) reject(err);
      // .salt and .hash
      const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
      const updatedUser = await User.get(existingUser.id)
        .update({ auth0_id: passwordToSave })
        .run();
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
      if (error) throw new LocalAuthError(error.message);
      if (!verified) throw new InvalidCredentialsError();
      return AuthHasher.hash(newPassword, async function(err, hashed) {
        if (err) throw new LocalAuthError(err.message);
        const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`;
        const updatedUser = await User.get(user.id)
          .update({ auth0_id: passwordToSave })
          .run();
        resolve(updatedUser);
      });
    });
  });
};

export default { login, signup, reset };
