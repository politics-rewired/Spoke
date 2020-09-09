# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org at https://github.com/MoveOnOrg/Spoke.

This repository is a branch of MoveOn/Spoke created by Politics Rewired, a small campaign tech consultancy created in 2019.

Due to a desire to develop more quickly, we did not maintain compatibility with MoveOn/Spoke, which means although this repository will be
a useful source of ideas, it may more work than is worth it to merge it back into MoveOn/Spoke, although we welcome any efforts towards
that goal. See [`HOWTO_MIGRATE_FROM_MOVEON_MAIN.md`](./docs/HOWTO_MIGRATE_FROM_MOVEON_MAIN.md)

## Getting started

1.  Run `docker-compose up` to start up Postgres and Redis.
2.  Install the Node version listed under `engines` in `package.json`. [NVM](https://github.com/creationix/nvm) is one way to do this.
3.  `yarn install`
4.  `npm install -g foreman`
5.  `cp .env.example .env`
6.  Run `yarn babel-node dev-tools/migrate-worker.js && yarn knex migrate:latest` to run the initial migrations
7.  Create an [Auth0](https://auth0.com) account. In your Auth0 account, go to [Applications](https://manage.auth0.com/#/applications/), click on `Default App` and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). Add those inside your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
8.  In your Auth0 app settings, add `http://localhost:3000/login-callback` , `http://localhost:3000` and `http://localhost:3000/logout-callback` to "Allowed Callback URLs", "Allowed Web Origins" and "Allowed Logout URLs" respectively. (If you get an error when logging in later about "OIDC", go to Advanced Settings section, and then OAuth, and turn off 'OIDC Conformant')
9. Add a new [rule](https://manage.auth0.com/#/rules/create) in Auth0:

```javascript
function (user, context, callback) {
context.idToken["https://spoke/user_metadata"] = user.user_metadata;
callback(null, user, context);
}
```

10. Run `npm run dev` to start the app. Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
11. Go to `http://localhost:3000` to load the app.
12. As long as you leave `SUPPRESS_SELF_INVITE=` blank and unset in your `.env` you should be able to invite yourself from the homepage.
    - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run, inside of a `psql` shell:

```
echo "INSERT INTO invite (hash,is_valid) VALUES ('abc', true);"
```

- Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/abc. This should redirect you to the login screen. Use the "Sign Up" option to create your account.

13. You should then be prompted to create an organization. Create it.

If you want to create an invite via the home page "Login and get started" link, make sure your `SUPPRESS_SELF_INVITE` variable is not set.

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database. This is set by default in `.env`.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary.

**Twilio**

Twilio provides test credentials that will not charge your account as described in their [documentation](https://www.twilio.com/docs/iam/test-credentials). You may use either your test credentials or your live keys by following the instructions [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md).

### Migrations

Spoke uses [`knex`](https://knexjs.org/) to manage application schema. Spoke also uses [`graphile-worker`](https://github.com/graphile/worker) as it's database-backed job queue.

**graphile-worker**

The `graphile-worker` migrations only need to be run once:

```sh
yarn migrate:worker
```

**knex**

The knex migrations need to be run any time a new release has made changes to the application schema, as indicated by a new migration file in `./migrations`. Some migrations require application downtime, some do not. It is up to YOU to review migration notes before rolling out a new release.

```sh
yarn knex migrate:latest
```

## Contributing

### Commit Messages

This project adheres to the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/). You can use `yarn commit` instead of `git commit`.

### Merging PRs

Pull Request merges should use the "Squash and merge" strategy. The final commit message should include relevant information from the component commits and its heading should reflect the purpose of the PR itself; if the PR adds a feature, it should be a `feat: add feature x` even if it includes a necessary bug fix (ideally unrelated bug fixes are submitted as separate PRs in the first place).

## Releases

Each release gets its own commit on `master` that includes the version bump and changelog updates. The version bump, changelog updates, commit, and tag are generated by [`standard-version`](https://github.com/conventional-changelog/standard-version):

```sh
yarn release
```

Other helpful options are:

```sh
# Preview the changes
yarn release --dry-run

# Specify the version manually
yarn release --release-as 1.5.0
# or the semver version type to bump
yarn release --release-as minor

# Specify an alpha release
yarn release --prerelease
# or the pre-release type
yarn release --prerelease alpha
```

## Deploying

We deploy via https://github.com/assemble-main/spoke-terraform, which deploys one Elastic Beanstalk cluster and one Lambda function side-
by-side, interacting with the same Aurora Postgresql Serverless database. We use a small proxy app (https://github.com/assemble-main/spoke-fly)
built to run on https://fly.io to route traffic from the /admin UI to Elastic Beanstalk, and all other requests to Lambda. This let's
Lambda deal with high throughput traffic (sending and receiving texts) and the long running servers on EBs can handle actions (such as
uploading or exporting) that may exceed Lambda's limits.

# License

See [LICENSE](./LICENSE).
