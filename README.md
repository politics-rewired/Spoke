# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org at https://github.com/MoveOnOrg/Spoke.

This repository is a branch of MoveOn/Spoke created by Politics Rewired, a small campaign tech consultancy created in 2019. 

Due to a desire to develop more quickly, we did not maintain compatibility with MoveOn/Spoke, which means although this repository will be 
a useful source of ideas, it may more work than is worth it to merge it back into MoveOn/Spoke, although we welcome any efforts towards 
that goal.

The main difficulties and source of differences that I can think of at this moment in time are:

* Instead of associating messages to campaign_contacts via `cell = contact_number` and `assignment_id = assignment_id`, we have a foreign 
key on `message` that points to `campaign_contact`. This was necessary for some of the more flexible reassignment flows we built. We have 
a script that should migrate from one to the other, but it is a potentially dangerous process that may require downtime.

* In order to support multiple different Twilio subaccount / messaging service relationships (and multiple messaging services to get 
around Twilio's limit of 400 numbers per service), we've moved those controls from `.env` variables to new database schemas. Those 
database rows will need to be inserted carefully in order to avoid disrupting existing conversations.

We will continue to add to this as we notice differences, and add a list of the things we've done likely under a wiki to come.


## Getting started

1. Install Postgres.
2. Install the Node version listed under `engines` in `package.json`. [NVM](https://github.com/creationix/nvm) is one way to do this.
3. `npm install`
4. `npm install -g foreman`
5. `cp .env.example .env`
6. If you want to use Postgres:
   - In `.env` set `DB_TYPE=pg`. (Otherwise, you will use sqlite.)
   - Set `DB_PORT=5432`, which is the default port for Postgres.
   - Create the spokedev database: `psql -c "create database spokedev;"`
7. Create an [Auth0](https://auth0.com) account. In your Auth0 account, go to [Applications](https://manage.auth0.com/#/applications/), click on `Default App` and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). Add those inside your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
8. Run `npm run dev` to create and populate the tables.
9. In your Auth0 app settings, add `http://localhost:3000/login-callback` , `http://localhost:3000` and `http://localhost:3000/logout-callback` to "Allowed Callback URLs", "Allowed Web Origins" and "Allowed Logout URLs" respectively. (If you get an error when logging in later about "OIDC", go to Advanced Settings section, and then OAuth, and turn off 'OIDC Conformant')
10. Add a new [rule](https://manage.auth0.com/#/rules/create) in Auth0:

```javascript
function (user, context, callback) {
context.idToken["https://spoke/user_metadata"] = user.user_metadata;
callback(null, user, context);
}
```

11. If the application is still running from step 8, kill the process and re-run `npm run dev` to restart the app. Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
12. Go to `http://localhost:3000` to load the app.
13. As long as you leave `SUPPRESS_SELF_INVITE=` blank and unset in your `.env` you should be able to invite yourself from the homepage.
    - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run, inside of a `psql` shell:

```
echo "INSERT INTO invite (hash,is_valid) VALUES ('abc', true);"
```

- Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/abc. This should redirect you to the login screen. Use the "Sign Up" option to create your account.

14. You should then be prompted to create an organization. Create it.

If you want to create an invite via the home page "Login and get started" link, make sure your `SUPPRESS_SELF_INVITE` variable is not set.

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary.

**Twilio**

Twilio provides test credentials that will not charge your account as described in their [documentation](https://www.twilio.com/docs/iam/test-credentials). You may use either your test credentials or your live keys by following the instructions [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md).

## Deploying

We deploy via https://github.com/assemble-main/spoke-terraform, which deploys one Elastic Beanstalk cluster and one Lambda function side-
by-side, interacting with the same Aurora Postgresql Serverless database. We use a small proxy app (https://github.com/assemble-main/spoke-fly) 
built to run on https://fly.io to route traffic from the /admin UI to Elastic Beanstalk, and all other requests to Lambda. This let's 
Lambda deal with high throughput traffic (sending and receiving texts) and the long running servers on EBs can handle actions (such as 
uploading or exporting) that may exceed Lambda's limits.

# License

Spoke is licensed under the MIT license.
