import * as envalid from "envalid";
import _ from "lodash";
// const pickBy = require("lodash/pickBy");

const { str, bool, num, email, url, host, port } = envalid;

type envalidValidator<T> = (spec?: envalid.Spec<T>) => envalid.ValidatorSpec<T>;
interface SpokeEnvvarSpec<T> extends envalid.Spec<T> {
  validator: envalidValidator<T>;
  isClient?: boolean;
}
interface SpokeClientConfig {
  ALLOW_SEND_ALL: boolean;
  ALTERNATE_LOGIN_URL: string;
  ASSIGNMENT_SHOW_REQUESTS_AVAILABLE: boolean;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  BASE_URL: string;
  BULK_SEND_CHUNK_SIZE: number;
  DST_REFERENCE_TIMEZONE: string;
  DISABLE_ASSIGNMENT_PAGE: boolean;
  ENABLE_TROLLBOT: boolean;
  ENABLE_SHORTLINK_DOMAINS: boolean;
  DISABLE_CAMPAIGN_EDIT_TEXTERS: boolean;
  DISABLE_SIDEBAR_BADGES: boolean;
  GRAPHQL_URL: string;
  MAX_MESSAGE_LENGTH: number;
  NODE_ENV: string;
  NOT_IN_USA: boolean;
  PASSPORT_STRATEGY: string;
  PHONE_NUMBER_COUNTRY: string;
  ROLLBAR_CLIENT_TOKEN: string;
  ROLLBAR_ACCESS_TOKEN: string;
  SEND_DELAY: number;
  SLACK_CLIENT_ID: string;
  SUPPRESS_SELF_INVITE: boolean;
  TERMS_REQUIRE: boolean;
  TZ: string;
  SPOKE_VERSION: string;
}

interface SpokeConfig extends envalid.CleanEnv {
  ACTION_HANDLERS: string;
  AK_BASEURL: string;
  AK_SECRET: string;
  ALLOW_SEND_ALL: boolean;
  ALTERNATE_LOGIN_URL: string;
  APOLLO_OPTICS_KEY: string;
  ASSETS_DIR: string;
  ASSETS_MAP_FILE: string;
  ASSIGNMENT_USERNAME: string;
  ASSIGNMENT_PASSWORD: string;
  ASSIGNMENT_REQUESTED_URL: string;
  ASSIGNMENT_REQUESTED_URL_REQUIRED: boolean;
  ASSIGNMENT_REQUESTED_TOKEN: string;
  ASSIGNMENT_COMPLETE_NOTIFICATION_URL: string;
  ASSIGNMENT_COMPLETE_NOTIFICATION_TEAM_IDS: string;
  ASSIGNMENT_SHOW_REQUESTS_AVAILABLE: boolean;
  ASSIGNMENT_MANAGER_DATABASE_URL: string;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  AUTO_HANDLE_REQUESTS: boolean;
  DISABLE_ASSIGNMENT_CASCADE: boolean;
  AUTO_HANDLE_REQUESTS_CONCURRENCY: number;
  AWS_ACCESS_AVAILABLE: boolean;
  AWS_ENDPOINT: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_LAMBDA_FUNCTION_NAME: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET_NAME: string;
  AWS_S3_KEY_PREFIX: string;
  BAD_BENS_DISABLE_HAS_UNASSIGNED_CONTACTS: boolean;
  BAD_WORD_TOKEN: string;
  BAD_WORD_URL: string;
  BASE_URL: string;
  BULK_SEND_CHUNK_SIZE: number;
  CACHE_PREFIX: string;
  CAMPAIGN_ID: number;
  CLIENT_NAME: string;
  CONTACT_REMOVAL_SECRET: string;
  DATABASE_URL: string;
  DATABASE_READER_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_MIN_POOL: number;
  DB_MAX_POOL: number;
  DB_IDLE_TIMEOUT_MS: number;
  DB_REAP_INTERVAL_MS: number;
  DB_USE_SSL: boolean;
  PGSSLMODE: string;
  DEBUG_INCOMING_MESSAGES: boolean;
  DEBUG_SCALING: boolean;
  DEFAULT_SERVICE: string;
  DEFAULT_ORG: number;
  AUTOJOIN_ORG_UUID: string;
  DD_AGENT_HOST: string;
  DD_DOGSTATSD_PORT: number;
  DD_TAGS: string;
  DELIVERABILITY_ALERT_ENDPOINT: string;
  DEV_APP_PORT: number;
  DST_REFERENCE_TIMEZONE: string;
  DISABLE_ASSIGNMENT_PAGE: boolean;
  ENABLE_TROLLBOT: boolean;
  TROLL_ALERT_PERIOD_MINUTES: number;
  ENABLE_SHORTLINK_DOMAINS: boolean;
  DISABLE_TEXTER_NOTIFICATIONS: boolean;
  DISABLED_TEXTER_NOTIFICATION_TYPES: string;
  DISABLE_CAMPAIGN_EDIT_TEXTERS: boolean;
  DISABLE_SIDEBAR_BADGES: boolean;
  EMAIL_FROM: string;
  EMAIL_REPLY_TO: string;
  EMAIL_HOST: string;
  EMAIL_HOST_PASSWORD: string;
  EMAIL_HOST_PORT: number;
  EMAIL_HOST_SECURE: boolean;
  EMAIL_HOST_USER: string;
  ENCRYPTION_ALGORITHM: string;
  ENCRYPTION_INPUT_ENCODING: string;
  ENCRYPTION_OUTPUT_ENCODING: string;
  EXPORT_DRIVER: string;
  FIX_ORGLESS: boolean;
  GOOGLE_APPLICATION_CREDENTIALS: string;
  GRAPHQL_URL: string;
  HIDE_CAMPAIGN_STATE_VARS_ON_ARCHIVED_CAMPAIGNS: boolean;
  CONTACT_FIELDS_TO_HIDE: string;
  JOBS_SAME_PROCESS: boolean;
  JOBS_SYNC: boolean;
  LAMBDA_DEBUG_LOG: boolean;
  LOGGING_MONGODB_URI: string;
  // npm log level choices: https://github.com/winstonjs/winston#logging-levels
  LOG_LEVEL: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_API_KEY: string;
  MAILGUN_SMTP_LOGIN: string;
  MAILGUN_SMTP_PASSWORD: string;
  MAILGUN_SMTP_PORT: number;
  MAILGUN_SMTP_SERVER: string;
  MAX_CONTACTS: number;
  MAX_CONTACTS_PER_TEXTER: number;
  MAX_MESSAGE_LENGTH: number;
  // Note: redis url likely doesnt pass envalid url validation
  MEMOREDIS_URL: string;
  MEMOREDIS_PREFIX: string;
  NEXMO_API_KEY: string;
  NEXMO_API_SECRET: string;
  NO_EXTERNAL_LINKS: boolean;
  NODE_ENV: string;
  NOT_IN_USA: boolean;
  OPT_OUT_MESSAGE: string;
  OPTOUTS_SHARE_ALL_ORGS: boolean;
  OUTPUT_DIR: string;
  PASSPORT_STRATEGY: string;
  PHONE_NUMBER_COUNTRY: string;
  PORT: number;
  PUBLIC_DIR: string;
  REDIS_FAKE: boolean;
  REDIS_URL: string;
  REVERE_SQS_URL: string;
  REVERE_LIST_ID: string;
  REVERE_NEW_SUBSCRIBER_MOBILE_FLOW: string;
  REVERE_MOBILE_API_KEY: string;
  REVERE_API_URL: string;
  ROLLBAR_CLIENT_TOKEN: string;
  ROLLBAR_ACCESS_TOKEN: string;
  ROLLBAR_ENDPOINT: string;
  SEND_DELAY: number;
  SESSION_SECRET: string;
  SHUTDOWN_GRACE_PERIOD: number;
  SLACK_TEAM_NAME: string;
  SLACK_TEAM_ID: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SCOPES: string;
  SLACK_CONVERT_EXISTING: boolean;
  SLACK_TOKEN: string;
  SLACK_NOTIFY_URL: string;
  SLACK_SYNC_CHANNELS: boolean;
  STATIC_BASE_URL: string;
  SUPERADMIN_LOGIN_SECRET: string;
  SUPPRESS_SELF_INVITE: boolean;
  TERMS_REQUIRE: boolean;
  TWILIO_API_KEY: string;
  TWILIO_APPLICATION_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_MESSAGE_SERVICE_SID: string;
  TWILIO_STATUS_CALLBACK_URL: string;
  TWILIO_SQS_QUEUE_URL: string;
  TWILIO_MESSAGE_VALIDITY_PERIOD: number;
  TWILIO_VALIDATION_HOST: string;
  TZ: string;
  SCRIPT_PREVIEW_AUTH: string;
  SKIP_TWILIO_VALIDATION: boolean;
  SPANISH_TEAM_ID: number;
  SPOKE_VERSION: string;
  SWITCHBOARD_BASE_URL: string;
  VAN_BASE_URL: string;
  VAN_EXPORT_TYPE: number;
  WAREHOUSE_DB_TYPE: string;
  WAREHOUSE_DB_HOST: string;
  WAREHOUSE_DB_PORT: number;
  WAREHOUSE_DB_NAME: string;
  WAREHOUSE_DB_USER: string;
  WAREHOUSE_DB_PASSWORD: string;
  WAREHOUSE_DB_LAMBDA_ITERATION: boolean;
  WEBHOOK_PAYLOAD_ALL_STRINGS: boolean;
  WORKER_CONCURRENCY: number;
  WORKER_MAX_POOL: number;
}

type SpokeEnvvarsCollection = { [envvar: string]: SpokeEnvvarSpec<any> };
const SPOKE_ENVVARS: SpokeEnvvarsCollection = {
  ACTION_HANDLERS: {
    validator: str,
    desc: "Comma-separated list of action handlers to enable.",
    example: "actionkit-rsvp,revere-signup",
    default: undefined
  },
  AK_BASEURL: {
    validator: url,
    desc: "Baseurl for ActionKit.",
    default: undefined
  },
  AK_SECRET: {
    validator: str,
    desc: "ActionKit API secret.",
    default: undefined
  },
  ALLOW_SEND_ALL: {
    validator: bool,
    desc:
      "Whether to allow sending all messages in a campaign at once. NOT LEGAL IN US.",
    default: false,
    isClient: true
  },
  ALTERNATE_LOGIN_URL: {
    validator: url,
    desc:
      'When set, the "Login" link on the home page will direct to this alternate URL',
    default: undefined,
    isClient: true
  },
  APOLLO_OPTICS_KEY: {
    validator: str,
    desc: "A key for Apollo tracer.",
    default: undefined
  },
  ASSETS_DIR: {
    validator: str,
    desc:
      "Directory path where front-end packaged JavaScript is saved and loaded.",
    default: "./build/client/assets"
  },
  ASSETS_MAP_FILE: {
    validator: str,
    desc:
      "File name of map file, within ASSETS_DIR, containing map of general file names to unique build-specific file names.",
    default: "assets.json"
  },
  ASSIGNMENT_USERNAME: {
    validator: str,
    desc: "Basic auth username to validate incoming requests to /autoassign.",
    default: undefined
  },
  ASSIGNMENT_PASSWORD: {
    validator: str,
    desc: "Basic auth password to validate incoming requests to /autoassign.",
    default: undefined
  },
  ASSIGNMENT_REQUESTED_URL: {
    validator: url,
    desc: "Webhook URL to notify when a texter assignment is requested.",
    default: undefined
  },
  ASSIGNMENT_REQUESTED_URL_REQUIRED: {
    validator: bool,
    desc:
      "Require successful assignment requested webhook to persist assignment request in Spoke.",
    default: false
  },
  ASSIGNMENT_REQUESTED_TOKEN: {
    validator: str,
    desc: "Bearer token to use as authorization with ASSIGNMENT_REQUESTED_URL.",
    default: undefined
  },
  ASSIGNMENT_COMPLETE_NOTIFICATION_URL: {
    validator: url,
    desc:
      "Webhook URL to notify when there are no more assignable campaign contacts.",
    default: undefined
  },
  ASSIGNMENT_COMPLETE_NOTIFICATION_TEAM_IDS: {
    validator: str,
    desc:
      "Comma separated list of team IDs to restrict 'assignment complete' notifications to.",
    default: ""
  },
  ASSIGNMENT_SHOW_REQUESTS_AVAILABLE: {
    validator: bool,
    desc:
      "If enabled, display icons on the home page organization selection list indicating availability of assignments.",
    default: false,
    isClient: true
  },
  ASSIGNMENT_MANAGER_DATABASE_URL: {
    validator: str,
    desc:
      "Database url of external assignent manager - used by 'update-sms-spanish-speakers' cron job",
    default: ""
  },
  AUTH0_DOMAIN: {
    validator: host,
    desc: "Domain name on Auth0 account",
    example: "example.auth0.com",
    default: undefined,
    isClient: true
  },
  AUTH0_CLIENT_ID: {
    validator: str,
    desc: "Client ID from Auth0 app.",
    default: undefined,
    isClient: true
  },
  AUTH0_CLIENT_SECRET: {
    validator: str,
    desc: "Client secret from Auth0 app.",
    default: undefined
  },
  AUTO_HANDLE_REQUESTS: {
    validator: bool,
    desc: "Whether to auto handle requests after submission",
    default: false
  },
  DISABLE_ASSIGNMENT_CASCADE: {
    validator: bool,
    desc:
      "Whether to just assign from 1 campaign rather than gathering from multiple to fulfill a request",
    default: false
  },
  AUTO_HANDLE_REQUESTS_CONCURRENCY: {
    validator: num,
    desc: "How many requests to handle at once",
    default: 1
  },
  AWS_ACCESS_AVAILABLE: {
    validator: bool,
    desc: "Enable or disable S3 campaign exports within Amazon Lambda.",
    default: false
  },
  AWS_ENDPOINT: {
    validator: url,
    desc:
      "An alternate endpoint to use with the AWS SDK. This allows uploading to S3-compatible services such as Wasabi and Google Cloud Storage.",
    default: undefined
  },
  AWS_ACCESS_KEY_ID: {
    validator: str,
    desc:
      "AWS access key ID with access to S3 bucket, required for campaign exports outside Amazon Lambda.",
    default: undefined
  },
  AWS_LAMBDA_FUNCTION_NAME: {
    validator: str,
    desc: "Function name to send to AWS Lambda.",
    default: undefined
  },
  AWS_SECRET_ACCESS_KEY: {
    validator: str,
    desc:
      "AWS access key secret with access to S3 bucket, required for campaign exports outside Amazon Lambda.",
    default: undefined
  },
  AWS_S3_BUCKET_NAME: {
    validator: str,
    desc: "Name of S3 bucket for saving campaign exports.",
    default: undefined
  },
  AWS_S3_KEY_PREFIX: {
    validator: str,
    desc: "Optional prefix to add to campaign export S3 keys.",
    example: "spoke/exports/",
    default: ""
  },
  BAD_BENS_DISABLE_HAS_UNASSIGNED_CONTACTS: {
    validator: bool,
    desc: "Disable use of has unassigned contacts variable",
    default: false
  },
  BAD_WORD_TOKEN: {
    validator: str,
    desc: "Bearer token used for authorization with BAD_WORD_URL.",
    default: undefined
  },
  BAD_WORD_URL: {
    validator: url,
    desc: "URL to notify with message text whenever a message is sent.",
    default: undefined
  },
  BASE_URL: {
    validator: url,
    desc:
      "The base URL of the website, without trailing slash, used to construct various URLs.",
    example: "https://example.org",
    isClient: true
  },
  BULK_SEND_CHUNK_SIZE: {
    validator: num,
    desc:
      "Chunk size to use when sending all texts at once with ALLOW_SEND_ALL",
    default: 100,
    isClient: true
  },
  CACHE_PREFIX: {
    validator: str,
    desc:
      "If REDISURL is set, then this will prefix keys CACHE_PREFIX, which might be useful if multiple applications use the same redis server.",
    default: undefined
  },
  CAMPAIGN_ID: {
    validator: num,
    desc:
      "Campaign ID used by dev-tools/export-query.js to identify which campaign should be exported.",
    default: -1
  },
  CLIENT_NAME: {
    validator: str,
    desc: "Name of client to pass to Datadog",
    default: undefined
  },
  CONTACT_REMOVAL_SECRET: {
    validator: str,
    desc:
      "Secret to authorize incoming requests to /remove-number-from-campaign",
    default: undefined
  },
  DATABASE_URL: {
    validator: url,
    desc: "Database connection URL",
    example: "postgres://username:password@127.0.0.1:5432/db_name",
    default: undefined
  },
  DATABASE_READER_URL: {
    validator: url,
    desc: "Database reader connection URL",
    example: "postgres://username:password@127.0.0.1:5432/db_name",
    default: undefined
  },
  DB_HOST: {
    validator: host,
    desc: "Domain or IP address of database host.",
    example: "pg-db.example.org",
    default: undefined
  },
  DB_PORT: {
    validator: num,
    desc: "Database port number.",
    default: 5432
  },
  DB_NAME: {
    validator: str,
    desc: "Database name.",
    example: "spoke_prod",
    default: undefined
  },
  DB_USER: {
    validator: str,
    desc: "Database username.",
    default: undefined
  },
  DB_PASSWORD: {
    validator: str,
    desc: "Database password.",
    default: undefined
  },
  DB_MIN_POOL: {
    validator: num,
    desc: "Database connection pool minumum size. ",
    default: 2
  },
  DB_MAX_POOL: {
    validator: num,
    desc: "Database connection pool maximum size. ",
    default: 10
  },
  DB_IDLE_TIMEOUT_MS: {
    validator: num,
    desc: "Free resouces are destroyed after this many milliseconds",
    default: 30000
  },
  DB_REAP_INTERVAL_MS: {
    validator: num,
    desc: "How often to check for idle resources to destroy",
    default: 1000
  },
  DB_USE_SSL: {
    validator: bool,
    desc:
      "Boolean value to determine whether database connections should use SSL.",
    default: false
  },
  PGSSLMODE: {
    validator: str,
    desc:
      "Postgres SSL mode. Due to a Knex bug, this environment variable must be used in order to specify the SSL mode directly in the driver. This must be set to PGSSLMODE=require to work with Heroku databases above the free tier.",
    choices: ["require"],
    default: undefined
  },
  DEBUG_INCOMING_MESSAGES: {
    validator: bool,
    desc: "Emit console.log on events related to handleIncomingMessages.",
    default: false
  },
  DEBUG_SCALING: {
    validator: bool,
    desc: "Emit console.log on events related to scaling issues.",
    default: false
  },
  DEFAULT_SERVICE: {
    validator: str,
    desc: "Default SMS service.",
    choices: ["assemble-numbers", "twilio", "nexmo", "fakeservice"],
    default: undefined
  },
  DEFAULT_ORG: {
    validator: num,
    desc:
      "Set only with FIX_ORGLESS. Set to integer organization.id corresponding to the organization you want orgless users to be assigned to.",
    default: -1
  },
  AUTOJOIN_ORG_UUID: {
    validator: str,
    desc: "UUID of organization to automatically insert users into upon signup",
    default: undefined
  },
  DD_AGENT_HOST: {
    validator: host,
    desc: "Datadog agent host",
    default: undefined
  },
  DD_DOGSTATSD_PORT: {
    validator: port,
    desc: "Datadog dogstatd port",
    default: undefined
  },
  DD_TAGS: {
    validator: str,
    desc: "Comma-separated list of DataDog tags to apply to metrics.",
    example: "app:spoke,client:rewired",
    default: "app:spoke"
  },
  DELIVERABILITY_ALERT_ENDPOINT: {
    validator: url,
    desc:
      "When present, notification payloads will be sent to this URL when deliverability for a domain becomes poor.",
    default: undefined
  },
  DEV_APP_PORT: {
    validator: num,
    desc: "Port for development Webpack server.",
    devDefault: 8090,
    default: undefined
  },
  DST_REFERENCE_TIMEZONE: {
    validator: str,
    desc:
      "Timezone to use to determine whether DST is in effect. If it's DST in this timezone, we assume it's DST everywhere. Note that DST is opposite in the northern and souther hemispheres.",
    example: "Australia/Sydney",
    default: "America/New_York",
    isClient: true
  },
  DISABLE_ASSIGNMENT_PAGE: {
    validator: bool,
    desc: "Whether to disable the Assignments admin page.",
    default: false,
    isClient: true
  },
  ENABLE_TROLLBOT: {
    validator: bool,
    desc: "Whether to enable trollbot",
    default: false,
    isClient: true
  },
  TROLL_ALERT_PERIOD_MINUTES: {
    validator: num,
    desc:
      "The interval length in minutes that each troll patrol sweep will examine messages within.",
    default: 6
  },
  ENABLE_SHORTLINK_DOMAINS: {
    validator: bool,
    desc: "Whether to enable shortlink domains",
    default: false,
    isClient: true
  },
  DISABLE_TEXTER_NOTIFICATIONS: {
    validator: bool,
    desc:
      "Whether to disable texter notifications – if true, should be implemented externally.",
    default: false
  },
  DISABLED_TEXTER_NOTIFICATION_TYPES: {
    validator: str,
    desc: "Comma-separated list of notification names to ignore.",
    example: "assignment.message.received,assignment.updated",
    default: ""
  },
  DISABLE_CAMPAIGN_EDIT_TEXTERS: {
    validator: bool,
    desc: "Whether to disable showing the texters panel on campaign edit.",
    default: false,
    isClient: true
  },
  DISABLE_SIDEBAR_BADGES: {
    validator: bool,
    desc: "Whether to disable showing the badge counts on the admin sidebar.",
    default: false,
    isClient: true
  },
  EMAIL_FROM: {
    validator: email,
    desc:
      "Email from address. Required to send email from either Mailgun or a custom SMTP server.",
    default: undefined
  },
  EMAIL_REPLY_TO: {
    validator: email,
    desc:
      "Reply-To address. If not supplied, an organization owner's email address will be used.",
    default: undefined
  },
  EMAIL_HOST: {
    validator: host,
    desc: "Email server host. Required for custom SMTP server usage.",
    default: undefined
  },
  EMAIL_HOST_PASSWORD: {
    validator: str,
    desc: "Email server password. Required for custom SMTP server usage.",
    default: undefined
  },
  EMAIL_HOST_PORT: {
    validator: port,
    desc: "Email server port. Required for custom SMTP server usage.",
    default: 465
  },
  EMAIL_HOST_SECURE: {
    validator: bool,
    desc: "Whether nodemailer should use TLS or not."
    // default: true
  },
  EMAIL_HOST_USER: {
    validator: str,
    desc: "Email server user. Required for custom SMTP server usage.",
    default: undefined
  },
  ENCRYPTION_ALGORITHM: {
    validator: str,
    desc: "Encryption algorithm to use with crypto package.",
    choices: ["aes256"],
    default: "aes256"
  },
  ENCRYPTION_INPUT_ENCODING: {
    validator: str,
    desc: "Input encoding to use with crypto package.",
    choices: ["utf8"],
    default: "utf8"
  },
  ENCRYPTION_OUTPUT_ENCODING: {
    validator: str,
    desc: "Output encoding to use with crypto package.",
    choices: ["hex"],
    default: "hex"
  },
  EXPORT_DRIVER: {
    validator: str,
    desc: "Which cloud storage driver to use for exports.",
    choices: ["s3", "gs-json"], // eventually add support for GCP w/ HMAC interoperability: ["gs"]
    default: "s3"
  },
  FIX_ORGLESS: {
    validator: bool,
    desc:
      "Set to true only if you want to run the job that automatically assigns the default org (see DEFAULT_ORG) to new users who have no assigned org.",
    default: false
  },
  GOOGLE_APPLICATION_CREDENTIALS: {
    validator: str,
    desc: "JSON token for service account",
    default: undefined
  },
  GRAPHQL_URL: {
    validator: str,
    desc: "Optional URL for pointing GraphQL API requests. ",
    example: "https://externalservice.org/graphql",
    default: "/graphql",
    isClient: true
  },
  HIDE_CAMPAIGN_STATE_VARS_ON_ARCHIVED_CAMPAIGNS: {
    validator: bool,
    desc:
      "If true, campaign state tags on the campaigns list page will be hidden for archived campaigns",
    default: false
  },
  CONTACT_FIELDS_TO_HIDE: {
    validator: str,
    desc:
      "A comma separated list of contact fields to not ship to the client. Can include 'external_id, cell, and lastName'",
    default: ""
  },
  JOBS_SAME_PROCESS: {
    validator: bool,
    desc:
      "Whether jobs should be executed in the same process in which they are created (vs. processing asyncronously via worker processes)."
    // default: true
  },
  JOBS_SYNC: {
    validator: bool,
    desc:
      "Whether jobs should be performed syncronously. Requires JOBS_SAME_PROCESS.",
    default: false
  },
  LAMBDA_DEBUG_LOG: {
    validator: bool,
    // desc: "When true, log each lambda event to the console.",
    default: false
  },
  LOGGING_MONGODB_URI: {
    validator: url,
    desc: "If present, requestLogger will send logs events to MongoDB.",
    default: undefined
  },
  // npm log level choices: https://github.com/winstonjs/winston#logging-levels
  LOG_LEVEL: {
    validator: str,
    desc: "The winston log level.",
    choices: ["silly", "debug", "verbose", "info", "warn", "error"],
    default: "warn",
    devDefault: "silly"
  },
  MAILGUN_DOMAIN: {
    validator: host,
    desc: "The domain you set up in Mailgun. Required for Mailgun usage.",
    example: "email.bartletforamerica.com",
    default: undefined
  },
  MAILGUN_API_KEY: {
    validator: str,
    desc:
      "Should be automatically set during Heroku auto-deploy. Do not modify.",
    default: undefined
  },
  MAILGUN_SMTP_LOGIN: {
    validator: str,
    desc: "'Default SMTP Login' in Mailgun. Required for Mailgun usage.",
    default: undefined
  },
  MAILGUN_SMTP_PASSWORD: {
    validator: str,
    desc: "'Default Password' in Mailgun. Required for Mailgun usage.",
    default: undefined
  },
  MAILGUN_SMTP_PORT: {
    validator: port,
    desc: "'Default Password' in Mailgun. Required for Mailgun usage.",
    default: 587
  },
  MAILGUN_SMTP_SERVER: {
    validator: host,
    desc: "Do not modify. Required for Mailgun usage.",
    default: "smtp.mailgun.org"
  },
  MAX_CONTACTS: {
    validator: num,
    desc:
      "If set each campaign can only have a maximum of the value (an integer). This is good for staging/QA/evaluation instances. Set to 0 for no maximum.",
    default: 0
  },
  MAX_CONTACTS_PER_TEXTER: {
    validator: num,
    desc:
      "Maximum contacts that a texter can receive. This is particularly useful for dynamic assignment. Set to 0 for no maximum.",
    default: 500
  },
  MAX_MESSAGE_LENGTH: {
    validator: num,
    desc:
      "The maximum size for a message that a texter can send. When you send a SMS message over 160 characters the message will be split, so you might want to set this as 160 or less if you have a high SMS-only target demographic.",
    default: 99999,
    isClient: true
  },
  // Note: redis url likely doesnt pass envalid url validation
  MEMOREDIS_URL: {
    validator: str,
    desc: "This enables caching using simple memoization",
    default: undefined
  },
  MEMOREDIS_PREFIX: {
    validator: str,
    desc: "The key prefix to use for memoredis memoization",
    default: undefined
  },
  NEXMO_API_KEY: {
    validator: str,
    desc: "Nexmo API key. Required if using Nexmo.",
    default: undefined
  },
  NEXMO_API_SECRET: {
    validator: str,
    desc: "Nexmo API secret. Required if using Nexmo.",
    default: undefined
  },
  NO_EXTERNAL_LINKS: {
    validator: bool,
    desc:
      "Removes google fonts and auth0 login script -- good for development offline when you already have an auth0 session.",
    default: false
  },
  NODE_ENV: {
    validator: str,
    desc: "Node environment",
    choices: ["production", "development", "test"],
    default: "development",
    isClient: true
  },
  NOT_IN_USA: {
    validator: bool,
    desc:
      "A flag to affirmatively indicate the ability to use features that are discouraged or not legally usable in the United States. Consult with an attorney about the implications for doing so. Default assumes a USA legal context.",
    default: false,
    isClient: true
  },
  OPT_OUT_MESSAGE: {
    validator: str,
    desc: "Spoke instance-wide default for opt out message.",
    default: undefined
  },
  OPTOUTS_SHARE_ALL_ORGS: {
    validator: bool,
    desc:
      "Can be set to true if opt outs should be respected per instance and across organizations.",
    default: false
  },
  OUTPUT_DIR: {
    validator: str,
    desc: "Directory path for packaged files should be saved to. Required.",
    default: "./build"
  },
  PASSPORT_STRATEGY: {
    validator: str,
    desc: "Which passport strategy to use for authentication.",
    choices: ["auth0", "slack", "local"],
    default: "auth0",
    isClient: true
  },
  PHONE_NUMBER_COUNTRY: {
    validator: str,
    desc: "Country code for phone number formatting.",
    default: "US",
    isClient: true
  },
  PORT: {
    validator: port,
    desc: "Port for Heroku servers.",
    default: 3000
  },
  PUBLIC_DIR: {
    validator: str,
    desc: "Directory path server should use to serve files. Required.",
    default: "./build/client"
  },
  REDIS_FAKE: {
    validator: bool,
    desc: "Use fakeredis package to back cache.",
    default: false
  },
  REDIS_URL: {
    validator: url,
    desc:
      "	This enables caching using the url option in redis library. This is an area of active development. More can be seen at server/models/cacheable-queries/README",
    default: undefined
  },
  REVERE_SQS_URL: {
    validator: url,
    desc: "SQS URL to process outgoing Revere SMS Messages.",
    default: undefined
  },
  REVERE_LIST_ID: {
    validator: str,
    desc: "Revere List to add user to.",
    default: undefined
  },
  REVERE_NEW_SUBSCRIBER_MOBILE_FLOW: {
    validator: str,
    desc: "Revere mobile flow to trigger upon recording action.",
    default: undefined
  },
  REVERE_MOBILE_API_KEY: {
    validator: str,
    desc: "Revere authentication api key to use to access Revere API.",
    default: undefined
  },
  REVERE_API_URL: {
    validator: url,
    desc: "Revere api endpoint to use for triggering a mobile flow.",
    default: undefined
  },
  ROLLBAR_CLIENT_TOKEN: {
    validator: str,
    desc: "Client token for Rollbar error tracking.",
    default: undefined,
    isClient: true
  },
  ROLLBAR_ACCESS_TOKEN: {
    validator: str,
    desc: "Access token for Rollbar error tracking.",
    default: undefined,
    isClient: true
  },
  ROLLBAR_ENDPOINT: {
    validator: url,
    desc: "Endpoint URL for Rollbar error tracking.",
    default: undefined
  },
  SEND_DELAY: {
    validator: num,
    desc: "Delay between successive sends in Spoke client",
    default: 100,
    isClient: true
  },
  SESSION_SECRET: {
    validator: str,
    desc: "Unique key used to encrypt sessions."
  },
  SHUTDOWN_GRACE_PERIOD: {
    validator: num,
    desc:
      "How long to wait after receiving kill signal before tearing down. Useful for waiting for readiness probe period.",
    default: 5000,
    devDefault: 10
  },
  SLACK_TEAM_NAME: {
    validator: str,
    desc: "The name of the Slack team to use for sign-in.",
    default: undefined
  },
  SLACK_TEAM_ID: {
    validator: str,
    desc: "The ID of the Slack team to use for sign-in.",
    default: undefined
  },
  SLACK_CLIENT_ID: {
    validator: str,
    desc: "The Slack client ID to use for sign-in.",
    default: undefined,
    isClient: true
  },
  SLACK_CLIENT_SECRET: {
    validator: str,
    desc: "The Slack client secret to use for sign-in.",
    default: undefined
  },
  SLACK_SCOPES: {
    validator: str,
    desc: "Comma separated list Slack scopes to request.",
    example: "groups:read",
    default: "identity.basic,identity.email,identity.team"
  },
  SLACK_CONVERT_EXISTING: {
    validator: bool,
    desc:
      "When true, Slack authentication will attempt to convert existing non-Slack accounts (with matching emails) to Slack accounts",
    default: true
  },
  SLACK_TOKEN: {
    validator: str,
    desc: "The Slack token to use for the slack-teams-update cron job",
    default: undefined
  },
  SLACK_NOTIFY_URL: {
    validator: url,
    desc:
      "If set, then on post-install (often from deploying) a message will be posted to a slack channel's #spoke channel",
    default: undefined
  },
  SLACK_SYNC_CHANNELS: {
    validator: bool,
    desc:
      "If true, Spoke team membership will be synced with matching Slack channel membership",
    default: false
  },
  STATIC_BASE_URL: {
    validator: str,
    desc: "Alternate static base url",
    example: "https://s3.us-east-1.amazonaws.com/my-spoke-bucket/spoke/static/",
    default: "/assets/"
  },
  SUPERADMIN_LOGIN_SECRET: {
    validator: str,
    desc:
      "A secret login code to allow a superadmin to assume the role of an organization owner.",
    default: undefined
  },
  SUPPRESS_SELF_INVITE: {
    validator: bool,
    desc:
      "Prevent self-invitations. Recommend setting before making sites available to public.",
    default: true,
    isClient: true
  },
  TERMS_REQUIRE: {
    validator: bool,
    desc:
      "Require texters to accept the Terms page before they can start texting.",
    default: false,
    isClient: true
  },
  TWILIO_API_KEY: {
    validator: str,
    desc: "Twilio API key. Required if using Twilio.",
    default: undefined
  },
  TWILIO_APPLICATION_SID: {
    validator: str,
    desc: "Twilio application ID. Required if using Twilio.",
    default: undefined
  },
  TWILIO_AUTH_TOKEN: {
    validator: str,
    desc: "Twilio auth token. Required if using Twilio.",
    default: undefined
  },
  TWILIO_MESSAGE_SERVICE_SID: {
    validator: str,
    desc: "Twilio message service ID. Required if using Twilio.",
    default: undefined
  },
  TWILIO_STATUS_CALLBACK_URL: {
    validator: url,
    desc: "URL for Twilio status callbacks. Required if using Twilio.",
    example: "https://example.org/twilio-message-report",
    default: undefined
  },
  TWILIO_SQS_QUEUE_URL: {
    validator: url,
    desc:
      "AWS SQS URL to handle incoming messages when app isn't connected to Twilio.",
    default: undefined
  },
  TWILIO_MESSAGE_VALIDITY_PERIOD: {
    validator: num,
    desc: "An optional maximum validity period for queued Twilio messages.",
    default: undefined
  },
  TWILIO_VALIDATION_HOST: {
    validator: host,
    desc:
      'Allow overriding the host Spoke validates Twilio headers against. This can be useful if you are running Spoke behind a proxy. If set to "", the host option will be undefined.',
    default: undefined
  },
  TZ: {
    validator: str,
    desc: "The timezone Spoke is operating in.",
    example: "Australia/Sydney",
    default: "America/New_York",
    isClient: true
  },
  SCRIPT_PREVIEW_AUTH: {
    validator: str,
    desc:
      "A JSON blob passed directly to express-basic-auth for locking campaign previews",
    default: undefined
  },
  SKIP_TWILIO_VALIDATION: {
    validator: bool,
    desc: "Whether to bypass Twilio header validation altogether.",
    default: false
  },
  SPANISH_TEAM_ID: {
    validator: num,
    desc:
      "ID of Spanish team for use in 'update-sms-spanish-speakers' cron job",
    default: undefined
  },
  SPOKE_VERSION: {
    validator: str,
    desc: "The version of Spoke running",
    default: "no-version",
    isClient: true
  },
  SWITCHBOARD_BASE_URL: {
    validator: url,
    desc: "Custom base URL for Switchboard client.",
    default: undefined
  },
  VAN_BASE_URL: {
    validator: url,
    desc:
      "The base url to use when interacting with VAN (may need to change for international use)",
    default: "https://api.securevan.com/v4"
  },
  VAN_EXPORT_TYPE: {
    validator: num,
    desc:
      "The numeric coding of the VAN list export type. The default is the Hustle format.",
    default: 8
  },
  WAREHOUSE_DB_TYPE: {
    validator: str,
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    choices: ["mysql", "pg", "sqlite3"],
    default: undefined
  },
  WAREHOUSE_DB_HOST: {
    validator: host,
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: "127.0.0.1"
  },
  WAREHOUSE_DB_PORT: {
    validator: port,
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: 5432
  },
  WAREHOUSE_DB_NAME: {
    validator: str,
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  },
  WAREHOUSE_DB_USER: {
    validator: str,
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  },
  WAREHOUSE_DB_PASSWORD: {
    validator: str,
    desc:
      "Enables ability to load contacts directly from a SQL query from a separate data-warehouse db -- only is_superadmin-marked users will see the interface",
    default: undefined
  },
  WAREHOUSE_DB_LAMBDA_ITERATION: {
    validator: bool,
    desc:
      "If the WAREHOUSE_DB connection/feature is enabled, then on AWS Lambda, queries that take longer than 5min can expire. This will enable incrementing through queries on new lambda invocations to avoid timeouts.",
    default: false
  },
  WEBHOOK_PAYLOAD_ALL_STRINGS: {
    validator: bool,
    // desc: "If true, all payload values will be converted to strings.",
    default: false
  },
  WORKER_CONCURRENCY: {
    validator: num,
    desc: "Worker concurrency. ",
    default: 2
  },
  WORKER_MAX_POOL: {
    validator: num,
    desc: "Worker database connection pool maximum size. ",
    default: 2
  }
};

const spokeEnv = (
  spokeEnvvarCollection: SpokeEnvvarsCollection
): { config: SpokeConfig; clientConfig: SpokeClientConfig } => {
  const validators = _(spokeEnvvarCollection)
    .entries()
    .map(([envvar, paramSpec]) => [
      envvar,
      paramSpec.validator({
        desc: paramSpec.desc,
        example: paramSpec.example,
        default: paramSpec.default
      })
    ])
    .fromPairs()
    .value() as { [envvar: string]: envalid.ValidatorSpec<any> };
  const envalidEnvvars = envalid.cleanEnv<SpokeEnvvarsCollection>(
    process.env,
    validators,
    {
      // strict: true
    }
  );
  const config = _(envalidEnvvars)
    .entries()
    .flatMap(([envvar, envvarVal]) =>
      envvar in spokeEnvvarCollection ? [[envvar, envvarVal]] : []
    )
    .fromPairs()
    .value() as SpokeConfig;

  const clientConfig = _(config)
    .entries()
    .flatMap(([envvar, envvarVal]) =>
      spokeEnvvarCollection[envvar].isClient ? [[envvar, envvarVal]] : []
    )
    .fromPairs()
    .value() as SpokeClientConfig;

  return {
    config,
    clientConfig
  };
};
export const { config, clientConfig } = spokeEnv(SPOKE_ENVVARS);
