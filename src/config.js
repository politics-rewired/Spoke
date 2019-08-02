const envalid = require("envalid");
const pickBy = require("lodash/pickBy");
const { str, bool, num, email, url, host, port } = envalid;

const validators = {
  ALTERNATE_LOGIN_URL: url({
    desc:
      'When set, the "Login" link on the home page will direct to this alternate URL',
    default: undefined
  }),
  APOLLO_OPTICS_KEY: str({
    desc: "A key for Apollo tracer.",
    default: undefined
  }),
  ASSETS_DIR: str({
    desc:
      "Directory path where front-end packaged JavaScript is saved and loaded.",
    default: "./build/client/assets"
  }),
  ASSETS_MAP_FILE: str({
    desc:
      "File name of map file, within ASSETS_DIR, containing map of general file names to unique build-specific file names.",
    default: "assets.json"
  }),
  AUTH0_DOMAIN: host({
    desc: "Domain name on Auth0 account",
    example: "example.auth0.com",
    default: undefined,
    isClient: true
  }),
  AUTH0_CLIENT_ID: str({
    desc: "Client ID from Auth0 app.",
    default: undefined,
    isClient: true
  }),
  AUTH0_CLIENT_SECRET: str({
    desc: "Client secret from Auth0 app.",
    default: undefined
  }),
  AWS_ACCESS_AVAILABLE: bool({
    desc: "Enable or disable S3 campaign exports within Amazon Lambda.",
    default: false
  }),
  AWS_ENDPOINT: url({
    desc:
      "An alternate endpoint to use with the AWS SDK. This allows uploading to S3-compatible services such as Wasabi and Google Cloud Storage.",
    default: undefined
  }),
  AWS_ACCESS_KEY_ID: str({
    desc:
      "AWS access key ID with access to S3 bucket, required for campaign exports outside Amazon Lambda.",
    default: undefined
  }),
  AWS_SECRET_ACCESS_KEY: str({
    desc:
      "AWS access key secret with access to S3 bucket, required for campaign exports outside Amazon Lambda.",
    default: undefined
  }),
  AWS_S3_BUCKET_NAME: str({
    desc: "Name of S3 bucket for saving campaign exports.",
    default: undefined
  }),
  AWS_S3_KEY_PREFIX: str({
    desc: "Optional prefix to add to campaign export S3 keys.",
    example: "spoke/exports/",
    default: undefined
  }),
  BASE_URL: url({
    desc:
      "The base URL of the website, without trailing slash, used to construct various URLs.",
    example: "https://example.org"
  }),
  CACHE_PREFIX: str({
    desc:
      "If REDISURL is set, then this will prefix keys CACHE_PREFIX, which might be useful if multiple applications use the same redis server.",
    default: undefined
  }),
  CAMPAIGN_ID: num({
    desc:
      "Campaign ID used by dev-tools/export-query.js to identify which campaign should be exported.",
    default: -1
  }),
  DB_HOST: host({
    desc: "Domain or IP address of database host.",
    example: "pg-db.example.org",
    default: undefined
  }),
  DB_MIN_POOL: num({
    desc: "Database connection pool minumum size. ",
    default: 2
  }),
  DB_MAX_POOL: num({
    desc: "Database connection pool maximum size. ",
    default: 10
  }),
  DB_NAME: str({
    desc: "Database connection name.",
    example: "spoke_prod",
    default: undefined
  }),
  DB_TYPE: str({
    desc: "Database connection type for Knex.",
    choices: ["mysql", "pg", "sqlite3"],
    default: undefined
  }),
  DB_USE_SSL: bool({
    desc:
      "Boolean value to determine whether database connections should use SSL.",
    default: false
  }),
  PGSSLMODE: str({
    desc:
      "Postgres SSL mode. Due to a Knex bug, this environment variable must be used in order to specify the SSL mode directly in the driver. This must be set to PGSSLMODE=require to work with Heroku databases above the free tier.",
    choice: ["require"],
    default: undefined
  }),
  DEBUG_SCALING: bool({
    desc: "Emit console.log on events related to scaling issues.",
    default: false
  }),
  DEFAULT_SERVICE: str({
    desc: "Default SMS service.",
    choices: ["twilio", "nexmo", "fakeservice"],
    default: "fakeservice"
  }),
  DEFAULT_ORG: num({
    desc:
      "Set only with FIX_ORGLESS. Set to integer organization.id corresponding to the organization you want orgless users to be assigned to.",
    default: -1
  }),
  DEV_APP_PORT: num({
    desc: "Port for development Webpack server.",
    devDefault: 8090
  }),
  DST_REFERENCE_TIMEZONE: str({
    desc:
      "Timezone to use to determine whether DST is in effect. If it's DST in this timezone, we assume it's DST everywhere. Note that DST is opposite in the northern and souther hemispheres.",
    example: "Australia/Sydney",
    default: "America/New_York"
  }),
  EMAIL_FROM: email({
    desc:
      "Email from address. Required to send email from either Mailgun or a custom SMTP server.",
    default: undefined
  }),
  EMAIL_HOST: host({
    desc: "Email server host. Required for custom SMTP server usage.",
    default: undefined
  }),
  EMAIL_HOST_PASSWORD: str({
    desc: "Email server password. Required for custom SMTP server usage.",
    default: undefined
  }),
  EMAIL_HOST_PORT: port({
    desc: "Email server port. Required for custom SMTP server usage.",
    default: 465
  }),
  EMAIL_HOST_USER: str({
    desc: "Email server user. Required for custom SMTP server usage.",
    default: undefined
  }),
  EXTERNAL_FAQ_URL: url({
    desc:
      'When set, the "Have you checked the FAQ?" text in the Escalate Conversation flow will link to this page. When unset, the text will be static.',
    default: undefined
  }),
  FIX_ORGLESS: bool({
    desc:
      "Set to true only if you want to run the job that automatically assigns the default org (see DEFAULT_ORG) to new users who have no assigned org.",
    default: false
  }),
  GRAPHQL_URL: str({
    desc: "Optional URL for pointing GraphQL API requests. ",
    example: "https://externalservice.org/graphql",
    default: "/graphql"
  }),
  JOBS_SAME_PROCESS: bool({
    desc:
      "Whether jobs should be executed in the same process in which they are created (vs. processing asyncronously via worker processes).",
    default: true
  }),
  MAILGUN_DOMAIN: host({
    desc: "The domain you set up in Mailgun. Required for Mailgun usage.",
    example: "email.bartletforamerica.com",
    default: undefined
  }),
  MAILGUN_PUBLIC_KEY: str({
    desc:
      "Should be automatically set during Heroku auto-deploy. Do not modify.",
    default: undefined
  }),
  MAILGUN_SMTP_LOGIN: str({
    desc: "'Default SMTP Login' in Mailgun. Required for Mailgun usage.",
    default: undefined
  }),
  MAILGUN_SMTP_PASSWORD: str({
    desc: "'Default Password' in Mailgun. Required for Mailgun usage.",
    default: undefined
  }),
  MAILGUN_SMTP_PORT: port({
    desc: "'Default Password' in Mailgun. Required for Mailgun usage.",
    default: 587
  }),
  MAILGUN_SMTP_SERVER: host({
    desc: "Do not modify. Required for Mailgun usage.",
    default: "smtp.mailgun.org"
  }),
  MAX_CONTACTS: num({
    desc:
      "If set each campaign can only have a maximum of the value (an integer). This is good for staging/QA/evaluation instances. Set to 0 for no maximum.",
    default: 0
  }),
  MAX_CONTACTS_PER_TEXTER: num({
    desc:
      "Maximum contacts that a texter can receive. This is particularly useful for dynamic assignment. Set to 0 for no maximum.",
    default: 0
  }),
  MAX_MESSAGE_LENGTH: num({
    desc:
      "The maximum size for a message that a texter can send. When you send a SMS message over 160 characters the message will be split, so you might want to set this as 160 or less if you have a high SMS-only target demographic.",
    default: 99999
  }),
  NEXMO_API_KEY: str({
    desc: "Nexmo API key. Required if using Nexmo.",
    default: undefined
  }),
  NEXMO_API_SECRET: str({
    desc: "Nexmo API secret. Required if using Nexmo.",
    default: undefined
  }),
  NO_EXTERNAL_LINKS: bool({
    desc:
      "Removes google fonts and auth0 login script -- good for development offline when you already have an auth0 session.",
    default: false
  }),
  NOT_IN_USA: bool({
    desc:
      "A flag to affirmatively indicate the ability to use features that are discouraged or not legally usable in the United States. Consult with an attorney about the implications for doing so. Default assumes a USA legal context.",
    default: false
  }),
  OPT_OUT_MESSAGE: str({
    desc: "Spoke instance-wide default for opt out message.",
    default: undefined
  }),
  OPTOUTS_SHARE_ALL_ORGS: bool({
    desc:
      "Can be set to true if opt outs should be respected per instance and across organizations.",
    default: false
  }),
  OUTPUT_DIR: str({
    desc: "Directory path for packaged files should be saved to. Required.",
    default: "./build"
  }),
  PASSPORT_STRATEGY: str({
    desc: "Which passport strategy to use for authentication.",
    choices: ["auth0", "slack", "local"],
    default: "auh0",
    isClient: true
  }),
  PHONE_NUMBER_COUNTRY: str({
    desc: "Country code for phone number formatting.",
    default: "US"
  }),
  PORT: port({
    desc: "Port for Heroku servers.",
    default: 3000
  }),
  PUBLIC_DIR: str({
    desc: "Directory path server should use to serve files. Required.",
    default: "./build/client"
  }),
  REDIS_URL: url({
    desc:
      "	This enables caching using the url option in redis library. This is an area of active development. More can be seen at server/models/cacheable-queries/README",
    default: undefined
  }),
  REVERE_SQS_URL: url({
    desc: "SQS URL to process outgoing Revere SMS Messages.",
    default: undefined
  }),
  REVERE_LIST_ID: str({
    desc: "Revere List to add user to.",
    default: undefined
  }),
  REVERE_NEW_SUBSCRIBER_MOBILE_FLOW: str({
    desc: "Revere mobile flow to trigger upon recording action.",
    default: undefined
  }),
  REVERE_MOBILE_API_KEY: str({
    desc: "Revere authentication api key to use to access Revere API.",
    default: undefined
  }),
  REVERE_API_URL: url({
    desc: "Revere api endpoint to use for triggering a mobile flow.",
    default: undefined
  }),
  ROLLBAR_CLIENT_TOKEN: str({
    desc: "Client token for Rollbar error tracking.",
    default: undefined
  }),
  ROLLBAR_ACCESS_TOKEN: str({
    desc: "Access token for Rollbar error tracking.",
    default: undefined
  }),
  ROLLBAR_ENDPOINT: url({
    desc: "Endpoint URL for Rollbar error tracking.",
    default: undefined
  }),
  SESSION_SECRET: str({
    desc: "Unique key used to encrypt sessions."
  }),
  SLACK_NOTIFY_URL: url({
    desc:
      "If set, then on post-install (often from deploying) a message will be posted to a slack channel's #spoke channel",
    default: undefined
  }),
  SUPPRESS_SELF_INVITE: bool({
    desc:
      "Prevent self-invitations. Recommend setting before making sites available to public.",
    default: true
  }),
  TERMS_REQUIRE: bool({
    desc:
      "Require texters to accept the Terms page before they can start texting.",
    default: false
  }),
  TWILIO_API_KEY: str({
    desc: "Twilio API key. Required if using Twilio.",
    default: undefined
  }),
  TWILIO_APPLICATION_SID: str({
    desc: "Twilio application ID. Required if using Twilio.",
    default: undefined
  }),
  TWILIO_AUTH_TOKEN: str({
    desc: "Twilio auth token. Required if using Twilio.",
    default: undefined
  }),
  TWILIO_MESSAGE_SERVICE_SID: str({
    desc: "Twilio message service ID. Required if using Twilio.",
    default: undefined
  }),
  TWILIO_STATUS_CALLBACK_URL: url({
    desc: "URL for Twilio status callbacks. Required if using Twilio.",
    example: "https://example.org/twilio-message-report",
    default: undefined
  }),
  TWILIO_SQS_QUEUE_URL: url({
    desc:
      "AWS SQS URL to handle incoming messages when app isn't connected to Twilio.",
    default: undefined
  }),
  TWILIO_VALIDATION_HOST: host({
    desc:
      'Allow overriding the host Spoke validates Twilio headers against. This can be useful if you are running Spoke behind a proxy. If set to "", the host option will be undefined.',
    default: undefined
  }),
  SKIP_TWILIO_VALIDATION: bool({
    desc: "Whether to bypass Twilio header validation altogether.",
    default: false
  }),
  WAREHOUSEDBTYPE: str({
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    choices: ["mysql", "pg", "sqlite3"],
    default: undefined
  }),
  WAREHOUSE_DB_HOST: host({
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  }),
  WAREHOUSE_DB_PORT: port({
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: 5432
  }),
  WAREHOUSE_DB_NAME: str({
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  }),
  WAREHOUSE_DB_USER: str({
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  }),
  WAREHOUSE_DB_PASSWORD: str({
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  }),
  WAREHOUSE_DB_LAMBDA_ITERATION: bool({
    desc:
      "f the WAREHOUSE_DB connection/feature is enabled, then on AWS Lambda, queries that take longer than 5min can expire. This will enable incrementing through queries on new lambda invocations to avoid timeouts.",
    default: false
  }),
  WEBPACK_HOST: host({
    desc: "Host domain or IP for Webpack development server.",
    default: "127.0.0.1."
  }),
  WEBPACK_PORT: port({
    desc: "Port for Webpack development server.",
    default: 3000
  })
};

const config = envalid.cleanEnv(process.env, validators, {
  strict: true
});

const clientConfig = pickBy(
  Object.assign({}, config),
  (value, key) => validators[key].isClient
);

module.exports = {
  config,
  clientConfig
};
