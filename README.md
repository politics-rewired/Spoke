# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org at https://github.com/MoveOnOrg/Spoke.

This repository is a branch of MoveOn/Spoke created by Politics Rewired, a small campaign tech consultancy created in 2019.

Due to a desire to develop more quickly, we did not maintain compatibility with MoveOn/Spoke, which means although this repository will be
a useful source of ideas, it may more work than is worth it to merge it back into MoveOn/Spoke, although we welcome any efforts towards
that goal. See [`HOWTO_MIGRATE_FROM_MOVEON_MAIN.md`](./docs/HOWTO_MIGRATE_FROM_MOVEON_MAIN.md)

## Getting started

**NOTE: This guide was tested on Debian Linux. OS X and Windows are untested, however you are welcome to try and submit a PR if you are successful.**

1.  Install Postgres. Minimum version v10.

2.  Install the Node version listed under `engines` in `package.json`. [NVM](https://github.com/creationix/nvm) is one way to do this.

3.  Switch to the directory you cloned or extracted Spoke too.

4.  `yarn install` to install all of the nessary packages.

5.  `yarn add global foreman` To add the forman package globally.

6.  `cp .env.example .env` To make a fresh copy of the env config file.

7. Configure your .env configuration file as per the reference documentation. See [`REFERENCE-environment_variables.md`](./docs/REFERENCE-environment_variables.md)

   - At the minimum, you should be able to get up and working properly with this config assuming you replace the necessary values:

   ```
   NODE_ENV=development
   SUPPRESS_SELF_INVITE=false
   JOBS_SAME_PROCESS=1
   DEV_APP_PORT=8090
   OUTPUT_DIR=./build
   ASSETS_DIR=./build/client/assets
   ASSETS_MAP_FILE=assets.json
   CAMPAIGN_ID=1
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=spokedev
   DB_TYPE=pg
   DATABASE_URL="postgres://postgres@127.0.0.1:5432/spokedev"
   DB_MIN_POOL=2
   DB_MAX_POOL=10
   DB_USE_SSL=false
   WEBPACK_HOST=localhost
   WEBPACK_PORT=3000
   BASE_URL=http://localhost:3000
   SESSION_SECRET=SOMETOTALLYRANDOMSTRINGTHATYOUSHOULDCHANGE
   PHONE_NUMBER_COUNTRY=US
   ROLLBAR_ENDPOINT=https://api.rollbar.com/api/1/item/
   ALLOW_SEND_ALL=false
   DST_REFERENCE_TIMEZONE='America/New_York'
   DEFAULT_SERVICE=fakeservice
   ```

   
8. Decide if you want to use auth0(google auth, ect) or the local authentication database(quicker setup). 

   **TO USE THE LOCAL DATABASE:**
   Add the following line to your .env file:
   `PASSPORT_STRATEGY=local`

   

   **TO USE AUTH0:**

   **Note:** Your development environment must be served on an https connection to use Auth0. It **does not** need to be publicly accessible, so a self signed certificate will work fine for this purpose. Adding SSL to your spoke environment is outside the scope of this guide, [but feel free to use this simple tutorial to acomplish that](https://medium.com/@mightywomble/how-to-set-up-nginx-reverse-proxy-with-lets-encrypt-8ef3fd6b79e5), or [this one if you don't have a public facing environment](https://linuxtechlab.com/simple-guide-to-configure-nginx-reverse-proxy-with-ssl/).

   - Create an [Auth0](https://auth0.com) account.

   - In your Auth0 account, go to [Applications](https://manage.auth0.com/#/applications/), click on `Default App` and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). 

   - Write those values from step 8.2 to your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
     In addition to those lines, you will also need to add the following line to your `.env` file:
     `PASSPORT_STRATEGY=local`

   - In your Auth0 app settings on auth0.com, add `https://localhost:3000/login-callback` , `https://localhost:3000` and `https://localhost:3000/logout-callback` to "Allowed Callback URLs", "Allowed Web Origins" and "Allowed Logout URLs" respectively. (If you get an error when logging in later about "OIDC", go to Advanced Settings section, and then OAuth, and turn off 'OIDC Conformant')
     NOTE: If you are using any other host other than `localhost` for your this instance, please replace localhost accordingly.

   - Add a new [rule](https://manage.auth0.com/#/rules/create) in Auth0:

   ```javascript
   function (user, context, callback) {
   context.idToken["https://spoke/user_metadata"] = user.user_metadata;
   callback(null, user, context);
   }
   ```

   

9.  Configure the Postgres connection and database:
    
    - In `.env` set `DB_TYPE=pg`.
    
    - Set `DB_PORT=5432`, which is the default port for Postgres.
    
    - Create the `spokedev` database: `psql -c "create database spokedev;"`

    NOTE: If you use custom postgres roles or passwords, you will need to change the `DATABASE_URL` to reflect;
	ie. `DATABASE_URL="postgres://USERNAME:PASSWORD@127.0.0.1:5432/spokedev"`
	or `DATABASE_URL="postgres://USERNAME@127.0.0.1:5432/spokedev"`

10. To populate the database with it's initial data:

    - Run `yarn knex migrate:latest` to create the public schema

    - Run `yarn migrate:worker` to create the graphile worker schema
      

11. Now you should be ready to run Spoke. `yarn run dev`

    -  Wait until you see both "Node app is running." and "wdm: Compiled successfully" before attempting to connect.
       

12. Go to `http://localhost:3000` or `https://localhost:3000` to load the app, **DO NOT LOGIN OR SIGNUP!**
    
13. Next you need to determine the best way to create your first organization. This will depend on if you are going to configure Twilio at the same time. 

    - **If you are not using Twilio**, as long as you leave `SUPPRESS_SELF_INVITE=` blank and unset in your `.env` you should be able to invite yourself from the homepage.

      If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run, inside of a `psql` shell:

      ```
      		echo "INSERT INTO invite (hash,is_valid) VALUES ('abc', true);"
      ```

      Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/abc or https://localhost:3000/invite/abc. This should redirect you to the login screen. Use the "Sign Up" option to create your account.


    - **If you are using Twilio**, you can automate the creation of your invite and creation of the messaging service database entry.
      If on Linux, a script called `./insert-invite.sh` can be used to create the invite. It is used in the following manner:
      `./insert-invite.sh AMadeUpInviteCode`

      

      You can then visit https://localhost:3000/invite/AMadeUpInviteCode or http://localhost:3000/invite/AMadeUpInviteCode to claim that invite and create your org.

      **NOTE: If you already have an organization set up and want to use Twilio**, it may be easier just to insert the messaging service records manually:

      ```
      	# Make sure that SESSION_SECRET is set to your production value in .env before:
      	$ node ./dev-tools/symmetric-encrypt.js SecretTwilioAuthToken
      	# copy the output
      
      	$ psql "postgres://my_prod_postgres_conncection_string"
      
      	psql> \set my_existing_org_id 1
      	psql> insert into messaging_service (organization_id, service_type, messaging_service_sid, account_sid, encrypted_auth_token)
      	values (:my_existing_org_id, 'twilio', 'MSTwilioMessagingServiceSID', 'ACTwilioAccountSID', 'OutputFromSymmetricEncrypt');
      ```

      

14. You should then be prompted to create an organization. Create it.

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies` or `https://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary.

**Twilio**

To use Twilio, you will need to set `DEFAULT_SERVICE` to `twilio` in your `.env` file:
`DEFAULT_SERVICE=twilio`

Twilio provides test credentials that will not charge your account as described in their [documentation](https://www.twilio.com/docs/iam/test-credentials). You may use either your test credentials or your live keys by following the instructions [here](./docs/HOWTO_INTEGRATE_TWILIO.md).

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
