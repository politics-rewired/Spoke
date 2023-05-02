![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/politics-rewired/Spoke) ![CircleCI](https://img.shields.io/circleci/build/github/politics-rewired/Spoke)

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org at https://github.com/MoveOnOrg/Spoke.

This repository is a branch of MoveOn/Spoke created by Politics Rewired, a small campaign tech consultancy created in 2019.

Due to a desire to develop more quickly, we did not maintain compatibility with MoveOn/Spoke, which means although this repository will be
a useful source of ideas, it may more work than is worth it to merge it back into MoveOn/Spoke, although we welcome any efforts towards
that goal. See [`HOWTO_migrate-from-moveon-main.md`](./docs/HOWTO_migrate-from-moveon-main.md).

## Getting Started

Prerequisites:

- Node (^16.14) -- See [How to Install Node](https://nodejs.dev/learn/how-to-install-nodejs)
- Yarn (>= 1.19.1) -- See [Installing Yarn](https://classic.yarnpkg.com/en/docs/install)
- Postgres (>= 11) -- See [install](https://postgresql.org/download) and [start](https://www.postgresql.org/docs/current/server-start.html) documentation

Clone the repo:

```sh
git clone git@github.com:politics-rewired/Spoke.git
cd Spoke
git config --local blame.ignoreRevsFile .git-blame-ignore-revs
```

Install Node dependencies:

```sh
yarn install
```

Copy the example environment. The only change you may need to make is updating the database connection string.

```sh
cp .env.example .env
vi .env
```

Create the `spokedev` database (if it doesn't yet exist)

```sh
psql -c "create database spokedev;"
```

Run the migrations:

```sh
yarn migrate:worker
yarn knex migrate:latest
```

Run codegen:

```sh
yarn codegen
```

Run in development mode:

```sh
yarn dev
```

If you plan to build container images locally for use in production you may want to set the default architecture by adding the following to your shell config (e.g. `~/.bash_profile`):

```sh
export DOCKER_DEFAULT_PLATFORM=linux/amd64
```

or pass `--platform=linux/amd64` to all `docker buildx` commands.

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Assemble Switchboard or Twilio) and insert the message directly into the database. This is set by default in `.env`.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary.

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

### Next Steps

All configuration environment variables are documented in [config.js](./src/config.js).

You can also find developer documentation and guides in the [docs](./docs) directory.

## Contributing

### Commit Messages

This project adheres to the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/). You can use `yarn commit` instead of `git commit`.

### Merging PRs

Pull Request merges should use the "Squash and merge" strategy. The final commit message should include relevant information from the component commits and its heading should reflect the purpose of the PR itself; if the PR adds a feature, it should be a `feat: add feature x` even if it includes a necessary bug fix (ideally unrelated bug fixes are submitted as separate PRs in the first place).

## Releases

Releases are managed using [`release-please`](https://github.com/googleapis/release-please/).

We run `release-please` using the [`release-please-action` GitHub
action](https://github.com/google-github-actions/release-please-action) in ["manifest releaser
mode"](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md). The GitHub action will create
and maintain a Release PR automatically when commits are merged to main.

### Pre-releases and custom versions

`release-please` automatically derives the next version number from previous Release PR commits
and the `.release-please-manifest.json`.

To set the version number of the next release manually (e.g. to release an rc version), edit
`release-please-config.json` and set the `release-as` config variable to the desired version number.

> **Warning** If you set a custom `release-as` version number, `release-please` will stop automatically deriving version
> numbers and will use that version number until it is unset or changed. You should change or remove `release-as` ASAP
> once the custom version release is published.

To mark the next release as a "prerelease" (so merging the PR creates a
"prerelease" published GitHub release), edit `release-please-config.json` and
set the `prerelease` config variable to true.

To mark the next release as a "draft" release (so merging the PR creates a "draft" GitHub release rather than a
"published" release), edit `release-please-config.json` and set the `draft` config variable to true.

## Deploying

Spoke can be deployed in a variety of different ways. We use Kubernetes internally and are only currently maintaining the Docker image. See the [developer documentation](./docs) for more information about other deployment methods.

# License

See [LICENSE](./LICENSE).
