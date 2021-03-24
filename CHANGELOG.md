# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.4.0](https://github.com/politics-rewired/spoke/compare/v4.3.0...v4.4.0) (2021-03-24)


### Features

* add campaign ID and contact name to troll alarm details ([#931](https://github.com/politics-rewired/spoke/issues/931)) ([d793226](https://github.com/politics-rewired/spoke/commit/d7932261741ec9b09e3cab7035bc5ac4df79203c))
* support even more branding options ([#923](https://github.com/politics-rewired/spoke/issues/923)) ([18acce0](https://github.com/politics-rewired/spoke/commit/18acce0c20565f19c0118d59b1e1b60f1fd6f1bf))


### Bug Fixes

* **canned-responses:** restore dialog to full width ([#932](https://github.com/politics-rewired/spoke/issues/932)) ([fe66b89](https://github.com/politics-rewired/spoke/commit/fe66b8929a77a410082d66272c096bd95f3911b1))
* **trollbot:** prevent adding invalid tokens ([#928](https://github.com/politics-rewired/spoke/issues/928)) ([6e4e093](https://github.com/politics-rewired/spoke/commit/6e4e093b9451ea2e1f21fe317503d27488c77bd5))

## [4.3.0](https://github.com/politics-rewired/spoke/compare/v4.2.4...v4.3.0) (2021-03-23)


### Features

* make slack team sync crontab configurable ([#927](https://github.com/politics-rewired/spoke/issues/927)) ([bcd4401](https://github.com/politics-rewired/spoke/commit/bcd4401cfb723dfef3aa2a9d2a07122fe7bf24fb))


### Bug Fixes

* serialize dates using ISO 8601 format ([#921](https://github.com/politics-rewired/spoke/issues/921)) ([9ac5376](https://github.com/politics-rewired/spoke/commit/9ac53767761e35364645047084e250ca3ba293d1))

### [4.2.4](https://github.com/politics-rewired/spoke/compare/v4.2.3...v4.2.4) (2021-03-17)


### Bug Fixes

* **manual-assignment:** remove unused expensive query ([#926](https://github.com/politics-rewired/spoke/issues/926)) ([f4dc58f](https://github.com/politics-rewired/spoke/commit/f4dc58f8311f6d4c8411d667f4ed38bf9ebda053))
* remove timeout fetching instance settings ([#925](https://github.com/politics-rewired/spoke/issues/925)) ([46e1979](https://github.com/politics-rewired/spoke/commit/46e1979916c39927738afa206672be726ad8b176))

### [4.2.3](https://github.com/politics-rewired/spoke/compare/v4.2.2...v4.2.3) (2021-03-16)


### Bug Fixes

* fix draft.js focus behavior ([#924](https://github.com/politics-rewired/spoke/issues/924)) ([a4489fa](https://github.com/politics-rewired/spoke/commit/a4489faf50e799309c5834da01f4662c2a86d202))

### [4.2.2](https://github.com/politics-rewired/spoke/compare/v4.2.1...v4.2.2) (2021-03-12)


### Bug Fixes

* disable unsupported copy/paste block rather than crashing ([#918](https://github.com/politics-rewired/spoke/issues/918)) ([480d24d](https://github.com/politics-rewired/spoke/commit/480d24dd1a1d12f25ba0d5c8e821b4fcd5b1caa8))
* fix crash editing interaction step ([#919](https://github.com/politics-rewired/spoke/issues/919)) ([6b41cd8](https://github.com/politics-rewired/spoke/commit/6b41cd87e37a314c5126fcfea7bd592cf29b378a))
* fix texter crash when clearing a survey response ([#920](https://github.com/politics-rewired/spoke/issues/920)) ([f5d3381](https://github.com/politics-rewired/spoke/commit/f5d3381150a8686ff5c0c929f37a4def2a111ec4))

### [4.2.1](https://github.com/politics-rewired/spoke/compare/v4.2.0...v4.2.1) (2021-03-11)


### Bug Fixes

* fix VAN sync modal ([#908](https://github.com/politics-rewired/spoke/issues/908)) ([53d0d56](https://github.com/politics-rewired/spoke/commit/53d0d563071d567105fe8e3c2cd46faba2151f2c))

## [4.2.0](https://github.com/politics-rewired/spoke/compare/v4.1.0...v4.2.0) (2021-03-04)


### Features

* add additional styling ([#905](https://github.com/politics-rewired/spoke/issues/905)) ([9093581](https://github.com/politics-rewired/spoke/commit/90935816c7657c0e3a8cf170da863775a19de5c3))
* support custom themes ([#902](https://github.com/politics-rewired/spoke/issues/902)) ([3fde0a2](https://github.com/politics-rewired/spoke/commit/3fde0a237147f878c21bd21fe2047ef8703cbaca))


### Bug Fixes

* set answer actions to correct value ([#906](https://github.com/politics-rewired/spoke/issues/906)) ([1c934b4](https://github.com/politics-rewired/spoke/commit/1c934b474e7e07dcc3981c67906a33fbc2bb5ade))
* update slack for header-based authentication ([#903](https://github.com/politics-rewired/spoke/issues/903)) ([28a61c3](https://github.com/politics-rewired/spoke/commit/28a61c3053366c403a3b0d17514128934c9cf447))

## [4.1.0](https://github.com/politics-rewired/spoke/compare/v4.0.2...v4.1.0) (2021-02-27)


### Features

* update react to v16 ([#894](https://github.com/politics-rewired/spoke/issues/894)) ([b3b804c](https://github.com/politics-rewired/spoke/commit/b3b804c0f3193e35ba5c7ccd3c0df7d6ca362fe9))


### Bug Fixes

* pass props directly when HOC contexts are not available ([#898](https://github.com/politics-rewired/spoke/issues/898)) ([82aba0e](https://github.com/politics-rewired/spoke/commit/82aba0e612575a281aa9092f116df5abfdd24408))
* update refs usage ([#897](https://github.com/politics-rewired/spoke/issues/897)) ([5e1db7a](https://github.com/politics-rewired/spoke/commit/5e1db7a4716ee870c2b593a2adeb5fc893aea58c))

### [4.0.2](https://github.com/politics-rewired/spoke/compare/v4.0.1...v4.0.2) (2021-02-23)


### Bug Fixes

* add missing window global type definition ([fee040f](https://github.com/politics-rewired/spoke/commit/fee040f793ba3170a5307624d742e725ea173699))
* fix role resolver ([#895](https://github.com/politics-rewired/spoke/issues/895)) ([6252976](https://github.com/politics-rewired/spoke/commit/62529761d9df19f4ca957fead132277dc61b69c1))

### [4.0.1](https://github.com/politics-rewired/spoke/compare/v4.0.0...v4.0.1) (2021-02-18)


### Bug Fixes

* force update of fs-capacitor to fix file upload ([54954e0](https://github.com/politics-rewired/spoke/commit/54954e03b3bbc85658853a625a5a37d9494b4191))

## [4.0.0](https://github.com/politics-rewired/spoke/compare/v3.15.5...v4.0.0) (2021-02-17)


### ⚠ BREAKING CHANGES

* Support has been dropped for Node v8, v10, and v12.
* Support for Mailgun has been dropped due to no suitable Node library.

### Bug Fixes

* **worker:** fix lock on semaphore and add early return ([#891](https://github.com/politics-rewired/spoke/issues/891)) ([0427634](https://github.com/politics-rewired/spoke/commit/042763467473a8a823c66247e44d88dd6f92c0b5))
* use structured logging for worker migrations ([#888](https://github.com/politics-rewired/spoke/issues/888)) ([2a12c01](https://github.com/politics-rewired/spoke/commit/2a12c013bc903fddfdc226843ea5e6ccf30997a4))


### build

* drop old proxy deps ([#889](https://github.com/politics-rewired/spoke/issues/889)) ([e5257b1](https://github.com/politics-rewired/spoke/commit/e5257b103369abad22d8b3903cc8124bc6550e3d))
* upgrade to node 14 LTS ([#817](https://github.com/politics-rewired/spoke/issues/817)) ([e6d16f2](https://github.com/politics-rewired/spoke/commit/e6d16f29a5d2ee6651afa8efa927fb995f550b18))

### [3.15.5](https://github.com/politics-rewired/spoke/compare/v3.15.4...v3.15.5) (2021-02-10)


### Bug Fixes

* **interaction-steps:** handle case of empty campaign ([#886](https://github.com/politics-rewired/spoke/issues/886)) ([d094b0f](https://github.com/politics-rewired/spoke/commit/d094b0f3e7f1141782c0bd811924b904a97260a2))

### [3.15.4](https://github.com/politics-rewired/spoke/compare/v3.15.3...v3.15.4) (2021-02-09)


### Bug Fixes

* **interaction-steps:** fix edit script ([#885](https://github.com/politics-rewired/spoke/issues/885)) ([87af85d](https://github.com/politics-rewired/spoke/commit/87af85dcb8b5f8c83c2eff333939dd230034a2f1))

### [3.15.3](https://github.com/politics-rewired/spoke/compare/v3.15.2...v3.15.3) (2021-02-03)


### Bug Fixes

* delete old interaction step tree on save of new tree ([#882](https://github.com/politics-rewired/spoke/issues/882)) ([620e5aa](https://github.com/politics-rewired/spoke/commit/620e5aa378722ec036c140beda2f5028a7b6a2f2))
* use single source of truth for interaction steps ([#878](https://github.com/politics-rewired/spoke/issues/878)) ([2c364f4](https://github.com/politics-rewired/spoke/commit/2c364f45913b9da82f3a66ea37bd5bc1c3f5de70))

### [3.15.2](https://github.com/politics-rewired/spoke/compare/v3.15.1...v3.15.2) (2021-01-29)


### Bug Fixes

* make makeTree() deterministic ([#880](https://github.com/politics-rewired/spoke/issues/880)) ([de26bf6](https://github.com/politics-rewired/spoke/commit/de26bf67fe7268e786ce731ffaf6feacb5c0f0d1))
* **datatables:** force latest material-ui to fix rows per page dropdown ([#876](https://github.com/politics-rewired/spoke/issues/876)) ([a6cc048](https://github.com/politics-rewired/spoke/commit/a6cc048348d3dfe17a1df4baa8d854ef94f70364))
* **deliverability-stats:** ensure consistent null return type ([#877](https://github.com/politics-rewired/spoke/issues/877)) ([18ffa4f](https://github.com/politics-rewired/spoke/commit/18ffa4f0effa1150a225688c9a88e0e87cd0b27b))

### [3.15.1](https://github.com/politics-rewired/spoke/compare/v3.15.0...v3.15.1) (2021-01-26)


### Bug Fixes

* fix email notifications on campaign start ([#875](https://github.com/politics-rewired/spoke/issues/875)) ([a56adcc](https://github.com/politics-rewired/spoke/commit/a56adcc85d27898a896320b73ad654f1bb1893f3))
* handle mixed argument types ([#870](https://github.com/politics-rewired/spoke/issues/870)) ([f29e78b](https://github.com/politics-rewired/spoke/commit/f29e78be4eafe2927139ce20b8a46980e255aa38))
* parse count as integer ([#872](https://github.com/politics-rewired/spoke/issues/872)) ([32c36c9](https://github.com/politics-rewired/spoke/commit/32c36c9476062f81a4d23a5c1d58ae97a9d35e5f))

## [3.15.0](https://github.com/politics-rewired/spoke/compare/v3.14.3...v3.15.0) (2021-01-25)


### Features

* display character/segment counts in texter view and message review ([#860](https://github.com/politics-rewired/spoke/issues/860)) ([2e6fe60](https://github.com/politics-rewired/spoke/commit/2e6fe60c6efd395084dc47786fd248dc023c0c3a))


### Bug Fixes

* **van:** fall back to 'canvassed' result code for 'messaged'  contacts ([#867](https://github.com/politics-rewired/spoke/issues/867)) ([4bd6d7e](https://github.com/politics-rewired/spoke/commit/4bd6d7e16d48b2c5a70c5bbc0f5c6b511f9372ea))
* **vanoperationmode:** remove operation mode key from external system mutations ([#868](https://github.com/politics-rewired/spoke/issues/868)) ([1cfef22](https://github.com/politics-rewired/spoke/commit/1cfef22eb8574a0e83e9cddf1ed92b711404fb22))

### [3.14.3](https://github.com/politics-rewired/spoke/compare/v3.14.2...v3.14.3) (2021-01-21)


### Bug Fixes

* add getSendBeforeUtc util to fix sendBefore ([#864](https://github.com/politics-rewired/spoke/issues/864)) ([f70c845](https://github.com/politics-rewired/spoke/commit/f70c8454c98ab58a550fa822b8eb2bc264ce0070))
* fix error count summation ([#863](https://github.com/politics-rewired/spoke/issues/863)) ([42cd11a](https://github.com/politics-rewired/spoke/commit/42cd11ad026fbffb94f0fe84a57ed4e717a7d314))
* pass membership id, not user id, to mutation ([#866](https://github.com/politics-rewired/spoke/issues/866)) ([bc04b78](https://github.com/politics-rewired/spoke/commit/bc04b78c906ccbebe3a80ed0e76f4cc5228c6415))
* **sendbuttonarrow:** pin the send arrow to the top of the message field ([#859](https://github.com/politics-rewired/spoke/issues/859)) ([2fc088b](https://github.com/politics-rewired/spoke/commit/2fc088bf9a473a3271dd104e6729ff3d70796177))

### [3.14.2](https://github.com/politics-rewired/spoke/compare/v3.14.1...v3.14.2) (2021-01-20)


### Bug Fixes

* fall back to provided zone name ([b9e1e79](https://github.com/politics-rewired/spoke/commit/b9e1e794881b6658b25f97ca8f59ca5cabeb3f33))

### [3.14.1](https://github.com/politics-rewired/spoke/compare/v3.14.0...v3.14.1) (2021-01-20)


### Bug Fixes

* add defensive fix for null/undefined zone name ([#861](https://github.com/politics-rewired/spoke/issues/861)) ([010341e](https://github.com/politics-rewired/spoke/commit/010341e7be2e314c1b6b5f3477bd54905a1196a5))

## [3.14.0](https://github.com/politics-rewired/spoke/compare/v3.13.1...v3.14.0) (2021-01-19)


### Features

* **users:** add superadmin option to role selection ([#850](https://github.com/politics-rewired/spoke/issues/850)) ([177350b](https://github.com/politics-rewired/spoke/commit/177350bf7fa36bd16810cf898d320994f63c9b05))
* per organization message limits ([#857](https://github.com/politics-rewired/spoke/issues/857)) ([8c61cf0](https://github.com/politics-rewired/spoke/commit/8c61cf0dd9296192c8cb920adc6ea134253ff009))
* **campaign-detail-page:** add message errors ([#824](https://github.com/politics-rewired/spoke/issues/824)) ([5b948b0](https://github.com/politics-rewired/spoke/commit/5b948b02b2df5d3de5e3986fbaecbab332443dfc))
* **van:** add operation mode select to integration config ([#813](https://github.com/politics-rewired/spoke/issues/813)) ([b4a1028](https://github.com/politics-rewired/spoke/commit/b4a1028e095ac3449eeb829edaace393eee9bdec))
* searchable people ([#819](https://github.com/politics-rewired/spoke/issues/819)) ([45a887d](https://github.com/politics-rewired/spoke/commit/45a887db1f4413959136e4e5f80d56a98e13e37f))


### Bug Fixes

* **admincampaignedit:** fix use of lodash/pick in checkSectionSaved ([#852](https://github.com/politics-rewired/spoke/issues/852)) ([976e099](https://github.com/politics-rewired/spoke/commit/976e09940ca850d2f76f920733c3695d589869e7)), closes [#851](https://github.com/politics-rewired/spoke/issues/851)
* **campaignteamsform:** remove mutation of props ([#825](https://github.com/politics-rewired/spoke/issues/825)) ([448d1e4](https://github.com/politics-rewired/spoke/commit/448d1e45e8e859542ca4d1ab6ecc79d010ea836b))
* **timezones:** map deprecated tzs to canonical tzs ([#855](https://github.com/politics-rewired/spoke/issues/855)) ([4fb2ac8](https://github.com/politics-rewired/spoke/commit/4fb2ac86f22967162d93ef11059145675f43941c)), closes [#853](https://github.com/politics-rewired/spoke/issues/853)
* **user:** unique email addresses with migration ([#821](https://github.com/politics-rewired/spoke/issues/821)) ([a9cd813](https://github.com/politics-rewired/spoke/commit/a9cd8130c566e89b9db9b34a4c9f3362b2cdc78c))

### [3.13.1](https://github.com/politics-rewired/spoke/compare/v3.13.0...v3.13.1) (2021-01-05)


### Bug Fixes

* restore tag functionality in assignment row ([#823](https://github.com/politics-rewired/spoke/issues/823)) ([1584247](https://github.com/politics-rewired/spoke/commit/15842476aa9ddd7611d3c9e66e3356395bc78237))

## [3.13.0](https://github.com/politics-rewired/spoke/compare/v3.12.0...v3.13.0) (2020-12-28)


### Features

* **van:** sync opt-outs ([#812](https://github.com/politics-rewired/spoke/issues/812)) ([45622fa](https://github.com/politics-rewired/spoke/commit/45622fa315955b0eadbcd5d0d198fe24385bb416))

## [3.12.0](https://github.com/politics-rewired/spoke/compare/v3.11.0...v3.12.0) (2020-12-21)


### Features

* password reset via email ([#805](https://github.com/politics-rewired/spoke/issues/805)) ([36acb24](https://github.com/politics-rewired/spoke/commit/36acb2450bdc6a3b66004954ba957f8de159a5e9))
* **dockerfile:** bump image ([763abd4](https://github.com/politics-rewired/spoke/commit/763abd4e7b1ca9f676ddfdfe485ccf81e2f21e55))


### Bug Fixes

* **dockerifle:** restore proper node version ([40916db](https://github.com/politics-rewired/spoke/commit/40916dbe6f2b334c322d859d3b013848a5dd7ac0))
* **dockerifle:** restore proper node version ([a8a295c](https://github.com/politics-rewired/spoke/commit/a8a295c7841e84375ab46e7742874077500f8791))

## [3.11.0](https://github.com/politics-rewired/spoke/compare/v3.10.1...v3.11.0) (2020-12-16)


### Features

* add integration detail page ([#811](https://github.com/politics-rewired/spoke/issues/811)) ([1ea0628](https://github.com/politics-rewired/spoke/commit/1ea062897aa5c3fe4d37083a16a464a1957c8c54)), closes [#773](https://github.com/politics-rewired/spoke/issues/773) [#797](https://github.com/politics-rewired/spoke/issues/797)


### Bug Fixes

* revert query argument to use gql query argument ([#810](https://github.com/politics-rewired/spoke/issues/810)) ([640f50c](https://github.com/politics-rewired/spoke/commit/640f50cb9e1401bbdaa257d20b678eac49b83f7c)), closes [#726](https://github.com/politics-rewired/spoke/issues/726)
* **integrations:** pass correct value to binding ([8c1eea4](https://github.com/politics-rewired/spoke/commit/8c1eea431335cc1f1a8e3e155e016bc416de2427))
* **switchboard:** update client lib to support sendBefore param ([9e0914d](https://github.com/politics-rewired/spoke/commit/9e0914d0e8559170ddd5080789cc42d83f7e0360)), closes [#774](https://github.com/politics-rewired/spoke/issues/774)

### [3.10.1](https://github.com/politics-rewired/spoke/compare/v3.10.0...v3.10.1) (2020-12-15)


### Bug Fixes

* **auth:** remove incorrect local login error ([#808](https://github.com/politics-rewired/spoke/issues/808)) ([ef1b8cd](https://github.com/politics-rewired/spoke/commit/ef1b8cd0b031e2463627e8f49468e1d87d38aa88))
* make disabled buttons unclickable ([#802](https://github.com/politics-rewired/spoke/issues/802)) ([946d82f](https://github.com/politics-rewired/spoke/commit/946d82f1fdca52561530d65def17bbddda4fb986))
* wrap long campaign descriptions ([#803](https://github.com/politics-rewired/spoke/issues/803)) ([05fc9a7](https://github.com/politics-rewired/spoke/commit/05fc9a715aca3c991e57cb5154a6463adc467492))
* **van:** sync messaged contacts without question responses ([#798](https://github.com/politics-rewired/spoke/issues/798)) ([8aff5d7](https://github.com/politics-rewired/spoke/commit/8aff5d7b7ac4b735c635c3617187eb21e7622da3))
* add contact name filter to bulk assignment action filter ([#799](https://github.com/politics-rewired/spoke/issues/799)) ([cb5cd3b](https://github.com/politics-rewired/spoke/commit/cb5cd3b6d355b52a0563af02bde8ae5247d4c383)), closes [#796](https://github.com/politics-rewired/spoke/issues/796)
* fix message review display in safari ([#800](https://github.com/politics-rewired/spoke/issues/800)) ([a1274ac](https://github.com/politics-rewired/spoke/commit/a1274ac9395f2f215e6e83301c0ae6b44484c47e))

## [3.10.0](https://github.com/politics-rewired/spoke/compare/v3.9.0...v3.10.0) (2020-12-11)


### Features

* add link warning to script field ([#795](https://github.com/politics-rewired/spoke/issues/795)) ([e8a0d10](https://github.com/politics-rewired/spoke/commit/e8a0d108b3ca45259f2444d49ca3e8a3e28a36ee))
* edit canned responses ([#793](https://github.com/politics-rewired/spoke/issues/793)) ([d7c2d19](https://github.com/politics-rewired/spoke/commit/d7c2d196ec1fd55fa894cf32db2afa0580394bf7))
* hide shortlink domains behind envvar ([#789](https://github.com/politics-rewired/spoke/issues/789)) ([7efb76e](https://github.com/politics-rewired/spoke/commit/7efb76e677b58606536256ea280059adb808ced4))
* host-based GraphQL context ([#560](https://github.com/politics-rewired/spoke/issues/560)) ([eacf822](https://github.com/politics-rewired/spoke/commit/eacf8224f66d1bc81b69b11674eced010afc1307))
* **campaign-edit:** add copy block on root ([#788](https://github.com/politics-rewired/spoke/issues/788)) ([3c4c19b](https://github.com/politics-rewired/spoke/commit/3c4c19bf9c6dfe34a5417228acb22c2c7fb7120b))
* **scripteditor:** add short link warning ([#765](https://github.com/politics-rewired/spoke/issues/765)) ([1e5195d](https://github.com/politics-rewired/spoke/commit/1e5195da81c3adbd0477d95cd96ba79f71247600))


### Bug Fixes

* add authz check to myCurrentAssignmentTargets resolver ([#792](https://github.com/politics-rewired/spoke/issues/792)) ([a2f13d7](https://github.com/politics-rewired/spoke/commit/a2f13d79df212d3435ae75f1713f520ba12479cb))
* add missing query properties ([204d9b1](https://github.com/politics-rewired/spoke/commit/204d9b15e267d826dd76ccc5bd292b8230f8735d))
* copy campaign deleted interactions ([#801](https://github.com/politics-rewired/spoke/issues/801)) ([60e57e2](https://github.com/politics-rewired/spoke/commit/60e57e27540ef104bf1da9e4b0ade7931cc8be66))
* fix campaign list pagination ([#794](https://github.com/politics-rewired/spoke/issues/794)) ([a9ea0c9](https://github.com/politics-rewired/spoke/commit/a9ea0c9732e1d2eb173d16b9c47d7acfa9627b46))
* fix issues introduced in eslint pr ([0d8765a](https://github.com/politics-rewired/spoke/commit/0d8765a7d64dbb08b924e36164e76c923fab28b2))
* **escalationtags:** check tags in assignment row chip input component ([#790](https://github.com/politics-rewired/spoke/issues/790)) ([7e2ce7c](https://github.com/politics-rewired/spoke/commit/7e2ce7c84b4afe219fd46147942da638ec623f20))

## [3.9.0](https://github.com/politics-rewired/spoke/compare/v3.8.1...v3.9.0) (2020-11-16)


### Features

* **tags:** add confirmation steps  ([#764](https://github.com/politics-rewired/spoke/issues/764)) ([c1fc977](https://github.com/politics-rewired/spoke/commit/c1fc97714107074ce9671ec1634c60fff9e223d8))
* configurable send delay ([#763](https://github.com/politics-rewired/spoke/issues/763)) ([8ed5779](https://github.com/politics-rewired/spoke/commit/8ed577939c21228120347f3502af3430fba7ae9b))


### Bug Fixes

* **canned responses:** remove ref from functional component ([#762](https://github.com/politics-rewired/spoke/issues/762)) ([e49a96a](https://github.com/politics-rewired/spoke/commit/e49a96ae8c56e91a09667a5ae26a6f626008cda9))
* **exports:** rm catches in helper fns ([#761](https://github.com/politics-rewired/spoke/issues/761)) ([2a85b74](https://github.com/politics-rewired/spoke/commit/2a85b74d2267a172c614f753421619c213e47a62))

### [3.8.1](https://github.com/politics-rewired/spoke/compare/v3.8.0...v3.8.1) (2020-11-02)


### Bug Fixes

* **edit-campaign:** revert extract canned responses section ([#751](https://github.com/politics-rewired/spoke/issues/751)) ([3adf21c](https://github.com/politics-rewired/spoke/commit/3adf21c390ddd2c0e860af3a46bd4df86bae51ea))

## [3.8.0](https://github.com/politics-rewired/spoke/compare/v3.7.0...v3.8.0) (2020-11-01)


### Features

* **tags:** display tag colors in tag selector ([#758](https://github.com/politics-rewired/spoke/issues/758)) ([9defafc](https://github.com/politics-rewired/spoke/commit/9defafc662de7ea4953b7ea2fb26867546f99b05))
* **tags:** restore soft delete ([#759](https://github.com/politics-rewired/spoke/issues/759)) ([f56f88d](https://github.com/politics-rewired/spoke/commit/f56f88d66d7ae02426ebc83eab4e5a9a6a1734f2))

## [3.7.0](https://github.com/politics-rewired/spoke/compare/v3.6.1...v3.7.0) (2020-10-27)


### Features

* **tags:** expose script, color and webhook url editing in tag editor ([#757](https://github.com/politics-rewired/spoke/issues/757)) ([2db5ff0](https://github.com/politics-rewired/spoke/commit/2db5ff011899b86e279a3eedc67da961cbff51b9))

### [3.6.1](https://github.com/politics-rewired/spoke/compare/v3.6.0...v3.6.1) (2020-10-24)


### Bug Fixes

* format sendBefore as string ([#756](https://github.com/politics-rewired/spoke/issues/756)) ([b09ef9b](https://github.com/politics-rewired/spoke/commit/b09ef9bc7d6dd4d618f2e535118d81cbe01f4c7e))

## [3.6.0](https://github.com/politics-rewired/spoke/compare/v3.5.1...v3.6.0) (2020-10-23)


### Features

* log express errors with winston logger ([#754](https://github.com/politics-rewired/spoke/issues/754)) ([dfced8e](https://github.com/politics-rewired/spoke/commit/dfced8e67efa20bb3f65c1d4a7e4ab5fb3439091))


### Bug Fixes

* fetch myAssignmentTargets only if logged in ([#753](https://github.com/politics-rewired/spoke/issues/753)) ([83aa1c1](https://github.com/politics-rewired/spoke/commit/83aa1c12b3253b3ea22df81a7217cac575856df9))

### [3.5.1](https://github.com/politics-rewired/spoke/compare/v3.5.0...v3.5.1) (2020-10-21)


### Bug Fixes

* **van-export:** fix canvassed date ([#750](https://github.com/politics-rewired/spoke/issues/750)) ([2352f48](https://github.com/politics-rewired/spoke/commit/2352f48905ef79eb2ef5befbd8e0b5b08cf24a65))

## [3.5.0](https://github.com/politics-rewired/spoke/compare/v3.4.0...v3.5.0) (2020-10-21)


### Features

* add troll alarm count to admin dashboard ([#749](https://github.com/politics-rewired/spoke/issues/749)) ([fe14d4b](https://github.com/politics-rewired/spoke/commit/fe14d4b718d84e4f594e2dfc48c02ca66abc8ace))
* populate tags in dropdown ([#746](https://github.com/politics-rewired/spoke/issues/746)) ([3ea96bc](https://github.com/politics-rewired/spoke/commit/3ea96bcb8575facfb61367c14130421905d0b9f3))


### Bug Fixes

* **assemble:sendmessage:** add sendBefore support for assemble ([#747](https://github.com/politics-rewired/spoke/issues/747)) ([57b5aa0](https://github.com/politics-rewired/spoke/commit/57b5aa0925dbc35765a26477369c1aa3d55f3049))

## [3.4.0](https://github.com/politics-rewired/spoke/compare/v3.3.0...v3.4.0) (2020-10-09)


### Features

* **trollbot:** support all-string payloads ([#744](https://github.com/politics-rewired/spoke/issues/744)) ([b44847a](https://github.com/politics-rewired/spoke/commit/b44847a7fa29124ddc6b29d39033c8c73a90eea9))


### Bug Fixes

* fix variable name ([6e30eb6](https://github.com/politics-rewired/spoke/commit/6e30eb6225a56eef45d5045bec746be589f8630e))

## [3.3.0](https://github.com/politics-rewired/spoke/compare/v3.2.0...v3.3.0) (2020-10-08)


### Features

* **trollbot:** support webhooks for trollbot alarms ([#742](https://github.com/politics-rewired/spoke/issues/742)) ([2ffb28a](https://github.com/politics-rewired/spoke/commit/2ffb28a98262102aacb96369b3d232e2b42ffeac))

## [3.2.0](https://github.com/politics-rewired/spoke/compare/v3.1.2...v3.2.0) (2020-10-08)


### Features

* **exports:** move export to graphile worker ([#738](https://github.com/politics-rewired/spoke/issues/738)) ([89bd9ac](https://github.com/politics-rewired/spoke/commit/89bd9acf379d439b945869b09fa44958fecd25b0))
* remove 'GraphQl Error:' from error messages ([#737](https://github.com/politics-rewired/spoke/issues/737)) ([33de981](https://github.com/politics-rewired/spoke/commit/33de981965f49a0f406d4b84ee085623668fbce0))


### Bug Fixes

* restore missing import ([6808317](https://github.com/politics-rewired/spoke/commit/6808317c023d7c64d8aaa25da2a9dd8ad3a053d5))
* **trollbot:** make primary key compound ([#741](https://github.com/politics-rewired/spoke/issues/741)) ([99ef5ec](https://github.com/politics-rewired/spoke/commit/99ef5ecf36df6213cc589803fe6d39ecb6632ba8))
* handle slack rate limits ([#740](https://github.com/politics-rewired/spoke/issues/740)) ([53c6d1c](https://github.com/politics-rewired/spoke/commit/53c6d1ceabc64a1f43b9de3ca13761b386c33e72))

### [3.1.2](https://github.com/politics-rewired/spoke/compare/v3.1.1...v3.1.2) (2020-10-03)


### Bug Fixes

* **slack:** decrease sync rate to fix rate limiting ([#739](https://github.com/politics-rewired/spoke/issues/739)) ([4a57309](https://github.com/politics-rewired/spoke/commit/4a57309a423c63d2a213051512d65bd75ecaf6c8))

### [3.1.1](https://github.com/politics-rewired/spoke/compare/v3.1.0...v3.1.1) (2020-10-02)


### Bug Fixes

* **edit-campaign:** compare to null rather than undefined ([b2843d0](https://github.com/politics-rewired/spoke/commit/b2843d067d4dfd467eaf651a1ca61e9945467767))

## [3.1.0](https://github.com/politics-rewired/spoke/compare/v3.0.0...v3.1.0) (2020-10-02)


### Features

* **van:** add integration tag to campaign list ([9697881](https://github.com/politics-rewired/spoke/commit/96978819c5ddd59b07d7dc710e7a0c70a6024511))


### Bug Fixes

* **van:** disable csv source when using integration ([c8b50a2](https://github.com/politics-rewired/spoke/commit/c8b50a2cba63e33f139d340f1f4f7eee4f556408))
* **van:** insert initial result message ([dc2b8f7](https://github.com/politics-rewired/spoke/commit/dc2b8f7f51324557412515b9128b6199aec27add))
* **van:** show question in add mapping modal ([db5ec23](https://github.com/politics-rewired/spoke/commit/db5ec2323deb09f691491f76b3abaa5f55f0eae4))

## [3.0.0](https://github.com/politics-rewired/spoke/compare/v2.11.1...v3.0.0) (2020-10-01)


### ⚠ BREAKING CHANGES

* **van:** VAN integration is a major feature release

### Features

* **van:** two-way van sync ([#722](https://github.com/politics-rewired/spoke/issues/722)) ([c213636](https://github.com/politics-rewired/spoke/commit/c21363685d432e03ddb3e5c62cfccc57037d5ddd)), closes [#477](https://github.com/politics-rewired/spoke/issues/477)

### [2.11.1](https://github.com/politics-rewired/spoke/compare/v2.11.0...v2.11.1) (2020-09-30)


### Bug Fixes

* fix index name ([c8a051c](https://github.com/politics-rewired/spoke/commit/c8a051c70825bb58f2b06962e337ff3423829373))

## [2.11.0](https://github.com/politics-rewired/spoke/compare/v2.10.2...v2.11.0) (2020-09-28)


### Features

* sync slack channels as graphile job ([#736](https://github.com/politics-rewired/spoke/issues/736)) ([2c019e7](https://github.com/politics-rewired/spoke/commit/2c019e74ac63d356fbede4fa563df1da9781db14))

### [2.10.2](https://github.com/politics-rewired/spoke/compare/v2.10.1...v2.10.2) (2020-09-25)


### Bug Fixes

* fix get_trollbot_matches function ([c6b83fd](https://github.com/politics-rewired/spoke/commit/c6b83fd9cf190172474687869244f38f43354fa0))

### [2.10.1](https://github.com/politics-rewired/spoke/compare/v2.10.0...v2.10.1) (2020-09-25)


### Bug Fixes

* add tag to contacts on save ([#733](https://github.com/politics-rewired/spoke/issues/733)) ([03fc124](https://github.com/politics-rewired/spoke/commit/03fc1241997a2c6b8f1bb12c47f62782bd0c5ebd))
* **assignment:** dont delete assignments, breaks opt out foreign keys ([#734](https://github.com/politics-rewired/spoke/issues/734)) ([999b404](https://github.com/politics-rewired/spoke/commit/999b40498ba3b0c73e32c363943c6f77bf0e6f86))
* fix up/down migrations ([#728](https://github.com/politics-rewired/spoke/issues/728)) ([c16aabf](https://github.com/politics-rewired/spoke/commit/c16aabfe8800c8b7e18f8a05fe6e46a93c2efa33))
* invoke scrollTo only if conversation has messages ([#732](https://github.com/politics-rewired/spoke/issues/732)) ([aea6597](https://github.com/politics-rewired/spoke/commit/aea659727e7f8d461b1039f05ec2001af1abbd7a))
* **trollbot:** do not escape the token ([f77c8a9](https://github.com/politics-rewired/spoke/commit/f77c8a999e3b0486cb8f8051e9786649260e01f9))

## [2.10.0](https://github.com/politics-rewired/spoke/compare/v2.9.3...v2.10.0) (2020-09-13)


### Features

* allow filtering campaign overlaps by archived state ([#727](https://github.com/politics-rewired/spoke/issues/727)) ([f0b32b9](https://github.com/politics-rewired/spoke/commit/f0b32b9273c9c90efe9a920e58be958d326a54c6))

### [2.9.3](https://github.com/politics-rewired/spoke/compare/v2.9.2...v2.9.3) (2020-09-08)


### Bug Fixes

* skip empty delivery report updates ([5a1cb59](https://github.com/politics-rewired/spoke/commit/5a1cb59fb9f131a59dd4cf8078ecd82dde492851))

### [2.9.2](https://github.com/politics-rewired/spoke/compare/v2.9.1...v2.9.2) (2020-09-07)


### Bug Fixes

* **assignable_campaigns:** add due_by clause ([#725](https://github.com/politics-rewired/spoke/issues/725)) ([2a97a00](https://github.com/politics-rewired/spoke/commit/2a97a0063449f3c0ca1e6e908bcd75032d609ed8))
* **copy-campaign:** await memoizer.invalidate ([50ead5b](https://github.com/politics-rewired/spoke/commit/50ead5ba67f63be09e5ca1134b347afa4f9830ae))
* **end-conversation:** auth error for non assigned admin ([#724](https://github.com/politics-rewired/spoke/issues/724)) ([3f95dfb](https://github.com/politics-rewired/spoke/commit/3f95dfbbc478379181babbd91502e646e7c61c61))
* **export-campaign:** reintroduced empty messages file w/ unmessaged ([aa24d83](https://github.com/politics-rewired/spoke/commit/aa24d83b2ab8350c4ec7245160175e57b1b9dbc6))
* **exports:** invoke S3 upload as promise ([017add4](https://github.com/politics-rewired/spoke/commit/017add49f23f05584de3cfe602eba5d76c344c22))
* **migrations:** remove function body ([a0c92bd](https://github.com/politics-rewired/spoke/commit/a0c92bd9576be3ab4bccd6662af51af177628c23))
* export for van pagination error ([#723](https://github.com/politics-rewired/spoke/issues/723)) ([39131ea](https://github.com/politics-rewired/spoke/commit/39131eaddc510a95ed5a3b2cbcb96bf44a2e57bf))

### [2.9.1](https://github.com/politics-rewired/spoke/compare/v2.9.0...v2.9.1) (2020-08-26)


### Bug Fixes

* **message-review:** exclude archived and opted-out from escalated count ([dc36b2c](https://github.com/politics-rewired/spoke/commit/dc36b2c45fb00d43019ebaee548b66ed12422b78))

## [2.9.0](https://github.com/politics-rewired/spoke/compare/v2.8.0...v2.9.0) (2020-08-26)


### Features

* **message-review:** add 'end conversation' button ([46958d9](https://github.com/politics-rewired/spoke/commit/46958d936882598d5b1d9b9bf0a2bbbe1b71e805))


### Bug Fixes

* **admin:** fix escalated conversation count ([3e022b2](https://github.com/politics-rewired/spoke/commit/3e022b2ea5ca985a9738e65abce6623eefdedb88))

## [2.8.0](https://github.com/politics-rewired/spoke/compare/v2.7.1...v2.8.0) (2020-08-25)


### Features

* allow hiding of campaign tags on archived campaigns via env var ([#713](https://github.com/politics-rewired/spoke/issues/713)) ([9de5caa](https://github.com/politics-rewired/spoke/commit/9de5caae55be19fbb47723886eb4d9e82462df93))


### Bug Fixes

* **message-review:** filter out empty messages ([#718](https://github.com/politics-rewired/spoke/issues/718)) ([0da7f0a](https://github.com/politics-rewired/spoke/commit/0da7f0a6dac71ab1655083a5c155d2f69891192a))
* **script-preview:** exclude soft-deleted interaction steps ([#719](https://github.com/politics-rewired/spoke/issues/719)) ([2314f0c](https://github.com/politics-rewired/spoke/commit/2314f0ce68c8fdae5d05584ac153927569259af4))
* export progress ([#712](https://github.com/politics-rewired/spoke/issues/712)) ([668b04f](https://github.com/politics-rewired/spoke/commit/668b04f437b9b21a7c21bd91084ec817b4d1e1c8))

### [2.7.1](https://github.com/politics-rewired/spoke/compare/v2.7.0...v2.7.1) (2020-08-18)


### Bug Fixes

* return inserted record ([7c20949](https://github.com/politics-rewired/spoke/commit/7c209499cef9e791aa6c685d23472a22a922d33e))

## [2.7.0](https://github.com/politics-rewired/spoke/compare/v2.6.3...v2.7.0) (2020-08-18)


### Features

* add option to send payload as all strings ([4e4fada](https://github.com/politics-rewired/spoke/commit/4e4fada3908cd446c2216321a9c58b32f7165af2))
* export all campaigns by argv query script ([05c06e3](https://github.com/politics-rewired/spoke/commit/05c06e363d80d8b8c15dc8afcda16e25cb590ae7))

### [2.6.3](https://github.com/politics-rewired/spoke/compare/v2.6.2...v2.6.3) (2020-08-14)

### [2.6.2](https://github.com/politics-rewired/spoke/compare/v2.6.1...v2.6.2) (2020-08-12)


### Bug Fixes

* fix campaign_id column ([253423e](https://github.com/politics-rewired/spoke/commit/253423ed636e1783282f9c55629ddef805b0cee6))

### [2.6.1](https://github.com/politics-rewired/spoke/compare/v2.6.0...v2.6.1) (2020-08-12)


### Bug Fixes

* fix pagination primary key naming ([81a88c6](https://github.com/politics-rewired/spoke/commit/81a88c65997bec94e3f9ba633ddb29c1d138e064))
* **load-van-list:** filter opt outs ([#703](https://github.com/politics-rewired/spoke/issues/703)) ([92ff6fe](https://github.com/politics-rewired/spoke/commit/92ff6fe3416c3cbe17336f8b94ee3465b0725f41))
* handle very large exports ([#704](https://github.com/politics-rewired/spoke/issues/704)) ([56065bb](https://github.com/politics-rewired/spoke/commit/56065bbce5ab23194a616a7900f18a159f8bfa93))

## [2.6.0](https://github.com/politics-rewired/spoke/compare/v2.5.0...v2.6.0) (2020-08-07)


### Features

* deprioritize handling delivery reports ([#702](https://github.com/politics-rewired/spoke/issues/702)) ([aab32c0](https://github.com/politics-rewired/spoke/commit/aab32c07c0dced9a0e9f182bdf879adf1ae6c283))


### Bug Fixes

* add default select statement ([#707](https://github.com/politics-rewired/spoke/issues/707)) ([40e8ed7](https://github.com/politics-rewired/spoke/commit/40e8ed73fc29ffb25693eb2bb1697050e56393a4))
* invalidate cached external lists ([#700](https://github.com/politics-rewired/spoke/issues/700)) ([67a307a](https://github.com/politics-rewired/spoke/commit/67a307a41d6b6b298fc74ff2dd266c550da4bdd5))
* use id as primary column ([#706](https://github.com/politics-rewired/spoke/issues/706)) ([cc186a7](https://github.com/politics-rewired/spoke/commit/cc186a7eff6fc069c44e44b77078f5a2ed24be8d))

## [2.5.0](https://github.com/politics-rewired/spoke/compare/v2.4.0...v2.5.0) (2020-08-01)


### Features

* better auto vacuum parameters ([#698](https://github.com/politics-rewired/spoke/issues/698)) ([f3bdd36](https://github.com/politics-rewired/spoke/commit/f3bdd366c87e23b6f9d57dc740540b0438b40e05))


### Bug Fixes

* skip setting empty authorization header ([428dd1f](https://github.com/politics-rewired/spoke/commit/428dd1f72a586a7cabb69de57f664031df54b9e0))

## [2.4.0](https://github.com/politics-rewired/spoke/compare/v2.3.1...v2.4.0) (2020-07-21)


### Features

* include organization name in assignment requested webhook payload ([8cb36c5](https://github.com/politics-rewired/spoke/commit/8cb36c514dfd8d43bbb639d4a760e310e2b5a381))

### [2.3.1](https://github.com/politics-rewired/spoke/compare/v2.3.0...v2.3.1) (2020-07-16)


### Bug Fixes

* exit with 0 on duplicate invite ([d6b6675](https://github.com/politics-rewired/spoke/commit/d6b6675e6e6db43142420931c4924f9924378cac))
* include external id on van fetch saved list ([#694](https://github.com/politics-rewired/spoke/issues/694)) ([9044136](https://github.com/politics-rewired/spoke/commit/9044136036c5ce2bd5c968a6bb1d2f2ae8e600a4))

## [2.3.0](https://github.com/politics-rewired/spoke/compare/v2.2.2...v2.3.0) (2020-07-08)


### Features

* van export button ([#692](https://github.com/politics-rewired/spoke/issues/692)) ([5bbb66f](https://github.com/politics-rewired/spoke/commit/5bbb66f8a366c40ba2c5245c1aae1c478c3bceec))


### Bug Fixes

* **van:** include additional fields ([9933d91](https://github.com/politics-rewired/spoke/commit/9933d9160c1510d50f2f040a6ab5bccd41a3abcc))
* **van:** perform ordering in node ([e469737](https://github.com/politics-rewired/spoke/commit/e4697372ad0f0fb6c3f7df4ef0e460e7853d131b))

### [2.2.2](https://github.com/politics-rewired/spoke/compare/v2.2.1...v2.2.2) (2020-07-07)


### Bug Fixes

* **integrations:** fix API key ref handling ([6cedb62](https://github.com/politics-rewired/spoke/commit/6cedb6233ea63e9e7064aff46d547be21d59b4c0))

### [2.2.1](https://github.com/politics-rewired/spoke/compare/v2.2.0...v2.2.1) (2020-07-04)


### Bug Fixes

* per-org graphile secret refs ([#689](https://github.com/politics-rewired/spoke/issues/689)) ([5f3bf5a](https://github.com/politics-rewired/spoke/commit/5f3bf5a0ccba98dbc0735d8836e936384f2604f0))

## [2.2.0](https://github.com/politics-rewired/spoke/compare/v2.1.1...v2.2.0) (2020-07-03)


### Features

* handle message metadata ([#688](https://github.com/politics-rewired/spoke/issues/688)) ([fd432d4](https://github.com/politics-rewired/spoke/commit/fd432d40bd6d98b029575d176913ecd5844383fa))


### Bug Fixes

* **twilio:** fix logic for delivery report handling ([cce4652](https://github.com/politics-rewired/spoke/commit/cce4652e0cdc83bd15da10a6ae4a8beedc042c7b))
* fix logic for delivery report handling ([a359120](https://github.com/politics-rewired/spoke/commit/a359120e52c480a151953d357e750d0770e88f00))
* **exports:** include fields in csv output ([eae3b3c](https://github.com/politics-rewired/spoke/commit/eae3b3c2ee402f270ae3ea735317139cc9c98a98))

### [2.1.1](https://github.com/politics-rewired/spoke/compare/v2.1.0...v2.1.1) (2020-06-29)


### Bug Fixes

* ignore delivery report if message is ERROR or DELIVERED ([313c67c](https://github.com/politics-rewired/spoke/commit/313c67c2f3351b0fae210e6009ece29e55eb59c1))

## [2.1.0](https://github.com/politics-rewired/spoke/compare/v2.0.1...v2.1.0) (2020-06-27)


### Features

* support configurable datadog tags ([4492b0b](https://github.com/politics-rewired/spoke/commit/4492b0bda903c2e7a11cb4c62d941edb1a622211))

### [2.0.1](https://github.com/politics-rewired/spoke/compare/v2.0.0...v2.0.1) (2020-06-27)


### Bug Fixes

* delivery report handling ([#686](https://github.com/politics-rewired/spoke/issues/686)) ([8c7abb9](https://github.com/politics-rewired/spoke/commit/8c7abb9b1bcdfae2f4fc13832dada95194f3ae5b))

## [2.0.0](https://github.com/politics-rewired/spoke/compare/v1.13.1...v2.0.0) (2020-06-26)


### ⚠ BREAKING CHANGES

* introduces pg-compose

### Features

* van list loading ([#657](https://github.com/politics-rewired/spoke/issues/657)) ([18c0853](https://github.com/politics-rewired/spoke/commit/18c0853c1aeac2b906d727cf49cd2dfbea9f3ebd))


### Bug Fixes

* check correct data warehouse envvar ([9794146](https://github.com/politics-rewired/spoke/commit/97941465e81f46d07a98ea9e8bc47e84c12d9e9c))
* check if returned record is an empty record ([#683](https://github.com/politics-rewired/spoke/issues/683)) ([d1a2036](https://github.com/politics-rewired/spoke/commit/d1a20363c9c82e6a2542a3f38331cb5363a3634a))
* copy campaign in transaction ([#685](https://github.com/politics-rewired/spoke/issues/685)) ([43e9025](https://github.com/politics-rewired/spoke/commit/43e9025df21abe8c3aab76ea27d44d18d6ca7e5b))
* set default text request type for General team ([#687](https://github.com/politics-rewired/spoke/issues/687)) ([be3c13d](https://github.com/politics-rewired/spoke/commit/be3c13d1343d54a93a473f25e79084f440b17917))
* use primary column rather than hardcoded 'id' ([24e886e](https://github.com/politics-rewired/spoke/commit/24e886eb23ed75d420c6d0a750f3561c24dc13e9))

### [1.13.1](https://github.com/politics-rewired/spoke/compare/v1.13.0...v1.13.1) (2020-06-07)


### Bug Fixes

* request Slack identity scopes ([406fa16](https://github.com/politics-rewired/spoke/commit/406fa16509437f943b63c5083a1b4611b23aef73))
* use Slack application token for non-identity scope requests ([746c551](https://github.com/politics-rewired/spoke/commit/746c55111c196bbd43d18877ba707ca5610d6cc3))

## [1.13.0](https://github.com/politics-rewired/spoke/compare/v1.12.1...v1.13.0) (2020-05-29)


### Features

* improve assignment request webhook ([#672](https://github.com/politics-rewired/spoke/issues/672)) ([7250e5e](https://github.com/politics-rewired/spoke/commit/7250e5e050da96c6723cf5c547c019e8ec6efa62))


### Bug Fixes

* prevent clearing campaign logo image url ([#676](https://github.com/politics-rewired/spoke/issues/676)) ([41f119c](https://github.com/politics-rewired/spoke/commit/41f119ca1aae0fdbdb3b77dd7c5c2223873bc1e3))
* prevent crash on bad script preview token ([#673](https://github.com/politics-rewired/spoke/issues/673)) ([459347d](https://github.com/politics-rewired/spoke/commit/459347db66669b6a294657e925f7abf927b819a7))

### [1.12.1](https://github.com/politics-rewired/spoke/compare/v1.12.0...v1.12.1) (2020-05-21)


### Bug Fixes

* log and exit on unhandled promise rejection ([#670](https://github.com/politics-rewired/spoke/issues/670)) ([4eea58c](https://github.com/politics-rewired/spoke/commit/4eea58cc1a2a071b3456c08727db861b887902ed)), closes [/github.com/nodejs/node/issues/9523#issuecomment-453505625](https://github.com/politics-rewired//github.com/nodejs/node/issues/9523/issues/issuecomment-453505625)
* pass expected error logging function to terminus ([#671](https://github.com/politics-rewired/spoke/issues/671)) ([5b8e7c6](https://github.com/politics-rewired/spoke/commit/5b8e7c6621076e98a4921b1b338d9d7da7e17aee))
* pass human-readable message to GraphQLError constructor ([22b7890](https://github.com/politics-rewired/spoke/commit/22b78907fc924ef1058deb6eede823a1168662fd))

## [1.12.0](https://github.com/politics-rewired/spoke/compare/v1.11.1...v1.12.0) (2020-05-20)


### Features

* display icon next to organizations with available assignments ([#669](https://github.com/politics-rewired/spoke/issues/669)) ([5ff6e02](https://github.com/politics-rewired/spoke/commit/5ff6e02e88fad5e668ea0d938b48391c2824905b))


### Bug Fixes

* handle case where campaign has no interaction steps ([#668](https://github.com/politics-rewired/spoke/issues/668)) ([4b482d6](https://github.com/politics-rewired/spoke/commit/4b482d6cde8bef44c2e539f6f06445a9e774ace8))
* prevent passing empty array to addPhoneNumbers ([#665](https://github.com/politics-rewired/spoke/issues/665)) ([2659d36](https://github.com/politics-rewired/spoke/commit/2659d364a2e1fa41c3b490ea81fd43c0ea3b1646))
* use fullscreen modal to fix overflow ([#667](https://github.com/politics-rewired/spoke/issues/667)) ([b30ec9a](https://github.com/politics-rewired/spoke/commit/b30ec9aaae7c9d19c7e91856e6a548aa88c48947))

### [1.11.1](https://github.com/politics-rewired/spoke/compare/v1.11.0...v1.11.1) (2020-05-13)


### Bug Fixes

* filter landlines ([#663](https://github.com/politics-rewired/spoke/issues/663)) ([c1e308b](https://github.com/politics-rewired/spoke/commit/c1e308b821bc71ad8fdfb1d21be07999f0b6bee0))

## [1.11.0](https://github.com/politics-rewired/spoke/compare/v1.10.0...v1.11.0) (2020-05-12)


### Features

* add contact display settings ([#661](https://github.com/politics-rewired/spoke/issues/661)) ([5aee74c](https://github.com/politics-rewired/spoke/commit/5aee74c329bd96600bff6a34e769c4e1c4e65eb8))
* add superadmins as owners to new organizations ([#660](https://github.com/politics-rewired/spoke/issues/660)) ([751e4e4](https://github.com/politics-rewired/spoke/commit/751e4e4ba57e19fd3bd8f8453bd8d0b376de1970))
* breakout landline filtration ([ac5d674](https://github.com/politics-rewired/spoke/commit/ac5d6748ba3d3f00af0503ad033ff291c8662fc4))


### Bug Fixes

* texter stuck loading ([#659](https://github.com/politics-rewired/spoke/issues/659)) ([f2b0ed5](https://github.com/politics-rewired/spoke/commit/f2b0ed550d4948e1320e2ea4853c18d8e98d0136))
* update client-side messages cache after sending ([#658](https://github.com/politics-rewired/spoke/issues/658)) ([e5652f9](https://github.com/politics-rewired/spoke/commit/e5652f9b85d3a4553635380da0da34209e62865b))

## [1.10.0](https://github.com/politics-rewired/spoke/compare/v1.9.7...v1.10.0) (2020-05-07)


### Features

* superadmin login ([#656](https://github.com/politics-rewired/spoke/issues/656)) ([9d4d6a2](https://github.com/politics-rewired/spoke/commit/9d4d6a2a35e094b2fe0a690b6a74c402d6f4f32c))

### [1.9.7](https://github.com/politics-rewired/spoke/compare/v1.9.6...v1.9.7) (2020-05-06)


### Bug Fixes

* use component comparison from react-hot-loader ([be9ac6b](https://github.com/politics-rewired/spoke/commit/be9ac6baa947b5c6aa86105844edd26f163d9040))

### [1.9.6](https://github.com/politics-rewired/spoke/compare/v1.9.5...v1.9.6) (2020-05-05)


### Bug Fixes

* admin ui button react element ([#652](https://github.com/politics-rewired/spoke/issues/652)) ([7c342d1](https://github.com/politics-rewired/spoke/commit/7c342d17aa0217a3c482d6c02eb27ccfcdb6d747))
* fix graphile-scheduler jobs ([#655](https://github.com/politics-rewired/spoke/issues/655)) ([06e53fb](https://github.com/politics-rewired/spoke/commit/06e53fb91ceac1fb70fbdf9523c644954add8b60))

### [1.9.5](https://github.com/politics-rewired/spoke/compare/v1.9.4...v1.9.5) (2020-04-29)

### [1.9.4](https://github.com/politics-rewired/spoke/compare/v1.9.3...v1.9.4) (2020-04-29)

### [1.9.3](https://github.com/politics-rewired/spoke/compare/v1.9.2...v1.9.3) (2020-04-29)

### [1.9.2](https://github.com/politics-rewired/spoke/compare/v1.9.1...v1.9.2) (2020-04-29)

### [1.9.1](https://github.com/politics-rewired/spoke/compare/v1.9.0...v1.9.1) (2020-04-29)


### Features

* release stale replies ([#635](https://github.com/politics-rewired/spoke/issues/635)) ([595eae3](https://github.com/politics-rewired/spoke/commit/595eae33a4f6eb5530857def59451148f4f0ad2e))


### Bug Fixes

* fix campaign creation error ([#647](https://github.com/politics-rewired/spoke/issues/647)) ([4a91132](https://github.com/politics-rewired/spoke/commit/4a9113212431d502858aa2a9c844a9b36fd97713))

## [1.9.0](https://github.com/politics-rewired/spoke/compare/v1.8.5...v1.9.0) (2020-04-23)


### Features

* allow selection of organization from home page ([#645](https://github.com/politics-rewired/spoke/issues/645)) ([4e78468](https://github.com/politics-rewired/spoke/commit/4e78468fc7681ab37bad74ad83fdc5229e15fc97))
* reply-to address ([#642](https://github.com/politics-rewired/spoke/issues/642)) ([5347418](https://github.com/politics-rewired/spoke/commit/534741847de386ffd141ba5b4b6b21f17da6e25d))


### Bug Fixes

* **settings:** fix capitalization of auto-approve type ([#643](https://github.com/politics-rewired/spoke/issues/643)) ([c18d71e](https://github.com/politics-rewired/spoke/commit/c18d71e6b55339485cf73be10bb22f96a390588f))
* remove afterCreate hook ([#638](https://github.com/politics-rewired/spoke/issues/638)) ([75c6744](https://github.com/politics-rewired/spoke/commit/75c67447bfa3466cf0a09c5398ad9f70074513ee))

### [1.8.5](https://github.com/politics-rewired/spoke/compare/v1.8.4...v1.8.5) (2020-04-15)


### Bug Fixes

* fix permission check ([#631](https://github.com/politics-rewired/spoke/issues/631)) ([b549f9d](https://github.com/politics-rewired/spoke/commit/b549f9d91d18c5b9d35e32c31df72077a567dd8c))
* remove auth query param from segments helpdesk url ([#637](https://github.com/politics-rewired/spoke/issues/637)) ([29512aa](https://github.com/politics-rewired/spoke/commit/29512aa94146c38321c050e983f82365e25963ed))
* require owner permissions to query settings ([#632](https://github.com/politics-rewired/spoke/issues/632)) ([03c9890](https://github.com/politics-rewired/spoke/commit/03c9890cc2580fcb0e917c36bf0093947ff62dc6))
* use the same knex client throughout query builder ([#640](https://github.com/politics-rewired/spoke/issues/640)) ([43aba59](https://github.com/politics-rewired/spoke/commit/43aba59f0b256b42009e7595942055df841d9d1a))

### [1.8.4](https://github.com/politics-rewired/spoke/compare/v1.8.3...v1.8.4) (2020-04-10)


### Bug Fixes

* prevent conversation overflow ([7098c25](https://github.com/politics-rewired/spoke/commit/7098c258d200bf6b8004d252980c41449571ccf7))

### [1.8.3](https://github.com/politics-rewired/spoke/compare/v1.8.2...v1.8.3) (2020-04-10)


### Bug Fixes

* fix flexbox height calculation in Safari ([#630](https://github.com/politics-rewired/spoke/issues/630)) ([83cf4a2](https://github.com/politics-rewired/spoke/commit/83cf4a2dd8cb53ebee97b2cd88c4295d0bba798b))

### [1.8.2](https://github.com/politics-rewired/spoke/compare/v1.8.1...v1.8.2) (2020-04-08)


### Bug Fixes

* **trollbot:** escape trigger tokens ([#627](https://github.com/politics-rewired/spoke/issues/627)) ([1f9ffc1](https://github.com/politics-rewired/spoke/commit/1f9ffc11e9de4fce335a47414498d833e87b6a0e))
* show all canned response text ([#623](https://github.com/politics-rewired/spoke/issues/623)) ([f347345](https://github.com/politics-rewired/spoke/commit/f3473454cf99f4ac576462702e5a2e6ddbafe66b))

### [1.8.1](https://github.com/politics-rewired/spoke/compare/v1.8.0...v1.8.1) (2020-04-07)

## [1.8.0](https://github.com/politics-rewired/spoke/compare/v1.7.1...v1.8.0) (2020-04-06)


### Features

* add organization to topnav ([#622](https://github.com/politics-rewired/spoke/issues/622)) ([e77a041](https://github.com/politics-rewired/spoke/commit/e77a041ffd8596f5b4c77b83b05c02fd5f23da26))


### Bug Fixes

* export config as commonjs module to support knex cli ([1edba6b](https://github.com/politics-rewired/spoke/commit/1edba6bcee207f11edf8fbd0369377b0445d43b0))
* **ux:** make pencil icon size dynamic (take 2) ([#583](https://github.com/politics-rewired/spoke/issues/583)) ([d85d648](https://github.com/politics-rewired/spoke/commit/d85d648ff8583569d1a2c02a2a73fb3982413648))

### [1.7.1](https://github.com/politics-rewired/spoke/compare/v1.7.0...v1.7.1) (2020-03-30)

## [1.7.0](https://github.com/politics-rewired/spoke/compare/v1.6.1...v1.7.0) (2020-03-30)


### Features

* add promote-on-assign button ([#611](https://github.com/politics-rewired/spoke/issues/611)) ([9cb2943](https://github.com/politics-rewired/spoke/commit/9cb29432f68bcfdabf88b5d585478af9a1d7b252))
* default texter approval status ([#614](https://github.com/politics-rewired/spoke/issues/614)) ([b12a35f](https://github.com/politics-rewired/spoke/commit/b12a35f3f8a31f07aedd345decf09aa32ecd23e5))
* expose texter auto-approval status ([#610](https://github.com/politics-rewired/spoke/issues/610)) ([f0a7e1c](https://github.com/politics-rewired/spoke/commit/f0a7e1c9c76faf3d2e5efaf901c049d00f2c175f))


### Bug Fixes

* message review action resolver errors ([#613](https://github.com/politics-rewired/spoke/issues/613)) ([649192d](https://github.com/politics-rewired/spoke/commit/649192dd84ad3de2e1ea41f54d1f89eb10f866d5))
* throw error only if ineligible for access check ([770336c](https://github.com/politics-rewired/spoke/commit/770336cac41bf69c1cabca80a16a21d26811ab1d))
* **ux:** avoid flashing background between texts ([#608](https://github.com/politics-rewired/spoke/issues/608)) ([0a605a2](https://github.com/politics-rewired/spoke/commit/0a605a2fcebbdd2b45c807b0c38dae202f38d273))

### [1.6.1](https://github.com/politics-rewired/spoke/compare/v1.6.0...v1.6.1) (2020-03-23)


### Bug Fixes

* fix index cleanup migration ([#607](https://github.com/politics-rewired/spoke/issues/607)) ([8c80cb2](https://github.com/politics-rewired/spoke/commit/8c80cb2997f8222572c0551c8998862d00687d35))
* fully escape raw column names ([db73f60](https://github.com/politics-rewired/spoke/commit/db73f609db6362dbb9a6b628d63f427cdba1300e))

## [1.6.0](https://github.com/politics-rewired/spoke/compare/v1.5.1...v1.6.0) (2020-03-21)


### Features

* add v1 trollbot functionality ([#591](https://github.com/politics-rewired/spoke/issues/591)) ([7f25c4c](https://github.com/politics-rewired/spoke/commit/7f25c4c0b114299fd7346dd19a400007a1805141))


### Bug Fixes

* **message-review:** prevent duplicate fetches of users ([#605](https://github.com/politics-rewired/spoke/issues/605)) ([a02295e](https://github.com/politics-rewired/spoke/commit/a02295ee5c57baa027a44164b063b7e64358dd5a))
* reset texter loading UI state on refetch ([#602](https://github.com/politics-rewired/spoke/issues/602)) ([cf07e59](https://github.com/politics-rewired/spoke/commit/cf07e59a3ef5d289109bc2fe2c8b0035c5ba0de3))

### [1.5.1](https://github.com/politics-rewired/spoke/compare/v1.5.0...v1.5.1) (2020-03-13)


### Bug Fixes

* expose validation stats to user ([#600](https://github.com/politics-rewired/spoke/issues/600)) ([9b147d7](https://github.com/politics-rewired/spoke/commit/9b147d79a53ddd35a959ac8592483772b236b2f9))
* **edit-campaign:** autodetect file encoding ([#599](https://github.com/politics-rewired/spoke/issues/599)) ([620609d](https://github.com/politics-rewired/spoke/commit/620609d56e3a4c99fdca03258b7ce23acd67d1d4))

## [1.5.0](https://github.com/politics-rewired/spoke/compare/v1.4.2...v1.5.0) (2020-03-12)


### Features

* 404 like page for bad campaign id ([6868efd](https://github.com/politics-rewired/spoke/commit/6868efdd5bc149a3be4abb37bb70d74e1233e4f4))
* accept firstname, first_name, lastname, last_name ([5038d07](https://github.com/politics-rewired/spoke/commit/5038d07fae556cdb4202aefcf3b0e9b9727fb01e))
* add apply tags helper text ([b1373be](https://github.com/politics-rewired/spoke/commit/b1373be7cd254992d4e846eb5fce28626647f8b1))
* add auto assign toggle to operations dialog ([8d3c66b](https://github.com/politics-rewired/spoke/commit/8d3c66b1ca6d013e8156cfe7ee90366b73953d19))
* add delete selected button to campaign overlap module ([d0066a1](https://github.com/politics-rewired/spoke/commit/d0066a1e9b8ba860e2c3d78c0db8296b40e55a56))
* add error handling ([639b8c5](https://github.com/politics-rewired/spoke/commit/639b8c583597121f38c651241f5927874b49ac0f))
* add progress and new campaign id to copy campaign ([9ab3241](https://github.com/politics-rewired/spoke/commit/9ab3241fb18daf04269fd81badc84b59ce0d3731))
* add reply count on release ([251ef14](https://github.com/politics-rewired/spoke/commit/251ef1442d505adea81d58b7f7c00ad973c86e4c))
* add segment counter ([2e0618d](https://github.com/politics-rewired/spoke/commit/2e0618d32e458000189325d9fa2abd99d40c203b))
* add symmetric decrypt script ([1cc1a99](https://github.com/politics-rewired/spoke/commit/1cc1a99d6fe3b65324677f5651f7bcf7ecb3cf6b))
* add withOperations HOC ([6e3fb47](https://github.com/politics-rewired/spoke/commit/6e3fb4787986957d0fdf404aa770b876723bf883))
* allow disabling the badge counts ([5043a44](https://github.com/politics-rewired/spoke/commit/5043a445eab2e3bd54ce3d653c56033ad588d8b8))
* allow disabling the Texters section of campaign edit ([7078a91](https://github.com/politics-rewired/spoke/commit/7078a913ba2cb8e844f5fa9ade59ca4839925c8f))
* allow inserting Switchboard LRN API key ([809b357](https://github.com/politics-rewired/spoke/commit/809b35714c6875983434754bbdab4b2a3bd2ed49))
* auto approve / reject basics ([8478ad2](https://github.com/politics-rewired/spoke/commit/8478ad26e83552036f06431cccdb9a590ac7b17c))
* cache and invalidate campaigns list ([4b3bdf4](https://github.com/politics-rewired/spoke/commit/4b3bdf4a4cd2fde380bfe5373216f5b610e91b4f))
* cache assignment.campaign ([f6c7383](https://github.com/politics-rewired/spoke/commit/f6c73832079b8b8146fd0b8c7dcb59b9c6b99c31))
* cache get users for 5 minutes ([dd24beb](https://github.com/politics-rewired/spoke/commit/dd24beb066e50f66698b9ed16d5f56cd160a677f))
* cache information for get contacts ([77fc0a8](https://github.com/politics-rewired/spoke/commit/77fc0a8d762ef3221d99910c05ae60d211cb5795))
* cache my current assignment targets for one minute ([b2b5f0d](https://github.com/politics-rewired/spoke/commit/b2b5f0dd88c72d71f95bfe166f163617d096df6f))
* campaign html preview ([6d190d0](https://github.com/politics-rewired/spoke/commit/6d190d065b90347e79afadcfe3a6e3b41a69b1d0))
* communicate texters loading ([dee43d5](https://github.com/politics-rewired/spoke/commit/dee43d5c46e9d44879cbde962aa89b3eb03e78bd))
* copy blocks ([5e67451](https://github.com/politics-rewired/spoke/commit/5e67451bf4c049863039cda64eec9cbd54eb807f))
* disable dynamic assignment ([2e0a405](https://github.com/politics-rewired/spoke/commit/2e0a405cf5dc92020bd0f24405be6f710d9a13fe))
* env var for auto handle request concurrency ([ed2b10d](https://github.com/politics-rewired/spoke/commit/ed2b10da6dd4a6a6082965ee2ac0a13872fadd5d))
* execute easy unicode -> gsm replacements ([7a54d66](https://github.com/politics-rewired/spoke/commit/7a54d668f5515a74d6330f041462643c85611d5f))
* flag to hide contact info ([2f96e41](https://github.com/politics-rewired/spoke/commit/2f96e414f774de004493afaa230e7cc76f41657a))
* handle shutdown gracefully ([a8ca156](https://github.com/politics-rewired/spoke/commit/a8ca156a69d177ac5c6854a5d7253ddf91e44a48))
* hide auto handle behind yaev ([3d8f810](https://github.com/politics-rewired/spoke/commit/3d8f810066aa97b72b6098b30181ded7793723f8))
* improve release all unnhandled replies ([0bccfb8](https://github.com/politics-rewired/spoke/commit/0bccfb878d7ede6edc808522c5a7b03563396580))
* include campaign in tag webhook payload ([6bb94b5](https://github.com/politics-rewired/spoke/commit/6bb94b5459279e24a05899fa3db55de6547d1c88))
* limit notifications to once per 30 seconds per team ([8645017](https://github.com/politics-rewired/spoke/commit/8645017e37758b0f14e059b4fd36b076f9d6b73a))
* make exclude recently contacted contacts have a default of true on mark for second pass ([bc49230](https://github.com/politics-rewired/spoke/commit/bc49230efcc7c82ebdf029462802329ec552f3c9))
* make search for texters fast ([802f184](https://github.com/politics-rewired/spoke/commit/802f184ccf9b5889b099253d43ae574bac25fcbe))
* more cautious second passes ([b961069](https://github.com/politics-rewired/spoke/commit/b9610690c57f5f7ff9713de6f46b350af49f6550))
* optimize get assignment contacts ([d745488](https://github.com/politics-rewired/spoke/commit/d745488a47470c4d370f379e3d6c204d30b5fc93))
* optimize get todos ([9e319b9](https://github.com/politics-rewired/spoke/commit/9e319b9349be48bfa2552e60e444207f05cb8838))
* optimize getContactMessagingService ([cf5cf12](https://github.com/politics-rewired/spoke/commit/cf5cf12735b076fb304155eef656fb2937c5f16c))
* optimize overlap deletion - no reason to materialize distinct cell ([d9cce3a](https://github.com/politics-rewired/spoke/commit/d9cce3aaef3251e06438f9d8f2bb18a4517a5bd5))
* page size changes in contact overlap deletion ([866d1b7](https://github.com/politics-rewired/spoke/commit/866d1b7a17420fd95d515e7062fe7a1e43ae52c2))
* perform encryption of auth token in script ([e6c282a](https://github.com/politics-rewired/spoke/commit/e6c282ade75999515f011136393c4af4eb94c75a))
* process contact csvs server-side ([1e6eb99](https://github.com/politics-rewired/spoke/commit/1e6eb990631ddb40439c229e3f8bf0a54aae217f))
* reassign my replies button ([6cfad65](https://github.com/politics-rewired/spoke/commit/6cfad653b27ed54a491bad91e359dd8ce496305f))
* release all unhandled replies ([e868dcb](https://github.com/politics-rewired/spoke/commit/e868dcb3cb62fc8766b0e3ba43fe640a76cd67ee))
* release replies on textable contacts only ([ba37ba4](https://github.com/politics-rewired/spoke/commit/ba37ba4cab6c72da00d26a4fe2a140448781438d))
* remove unnecessary polling ([6ae129a](https://github.com/politics-rewired/spoke/commit/6ae129a8277d80aeeaa498e76b8f5d42c6e3f24b))
* seach in overlap deletion ([f2ac6a8](https://github.com/politics-rewired/spoke/commit/f2ac6a832fb2a6f1e2f9771a4aa37b683e350a2b))
* shorten texter poll interval ([2a9301c](https://github.com/politics-rewired/spoke/commit/2a9301c65e52567d57a674265e6211c8c895106b))
* show hidden contact fields if super volunteer ([9a2a066](https://github.com/politics-rewired/spoke/commit/9a2a066e01760febd4aafe22466ce955f4650c8a))
* speed up overlap deletion ([6faed80](https://github.com/politics-rewired/spoke/commit/6faed803c28b0a3d128fdeab7dd008e05590fd92))
* switch to file drop ([e5ec8d7](https://github.com/politics-rewired/spoke/commit/e5ec8d72c7d51af46be7856efba6760e57e031a3))
* tear down kue on shutdown ([ee29ce4](https://github.com/politics-rewired/spoke/commit/ee29ce4d340fa6a011e30f2a79935fa53e6d4027))
* treat 4 digit zips as 0 padded ([61715b7](https://github.com/politics-rewired/spoke/commit/61715b75c403595739f69882c6a904089e75a7ec))
* update texter name in external assignment manager db cron job ([ce09838](https://github.com/politics-rewired/spoke/commit/ce098389f0a252d327ae1354f7a6368a03b7a83c))
* upgrade memoredis ([4c4a97b](https://github.com/politics-rewired/spoke/commit/4c4a97bdd3cceb36e5fad63b580b83c46a2ee46e))
* use empty mode if env var not present to bypass caching ([b458879](https://github.com/politics-rewired/spoke/commit/b458879918ba8e55caaecbd24cd6479c57a5f1db))
* use function to cache plans ([b265213](https://github.com/politics-rewired/spoke/commit/b265213ddbcd371748381b1d1b0487f9947a4f74))
* use group by instead of many queries ([08fdb71](https://github.com/politics-rewired/spoke/commit/08fdb71a8cf347f5bde075397719a437df3648ad))
* use sped up memoredis ([924de74](https://github.com/politics-rewired/spoke/commit/924de74318613d8f167aa39e732bf1b04a699e13))


### Bug Fixes

* validate phone number in the correct place ([c616dd9](https://github.com/politics-rewired/spoke/commit/c616dd9af0a8f46c07d4a33e6af37d4cbd25cc4c))
* **ci:** install npm dependencies ([b2a0b0a](https://github.com/politics-rewired/spoke/commit/b2a0b0aaf0f429f29a077c4f431fe3ce4f6dec75))
* >= texting hours start ([32d7daa](https://github.com/politics-rewired/spoke/commit/32d7daa8cca5635b9f7b4bfe68bcaae425d29e46))
* add an upload button to the file drop ([a513cc1](https://github.com/politics-rewired/spoke/commit/a513cc1e2a793af9d325c157379d1646416f807c))
* add back express basic auth ([35cff82](https://github.com/politics-rewired/spoke/commit/35cff82adb1733d79cc0b83fe50caec842bd8c26))
* add missing ownProps to signature ([d9fa177](https://github.com/politics-rewired/spoke/commit/d9fa1778bbd8c303385c43fb49ff91caa50c903f))
* add missing resolvers ([704c650](https://github.com/politics-rewired/spoke/commit/704c6508a518ff357be545ecc7a137eb553c80d1))
* await invalidation on campaign list modifications ([9f81a55](https://github.com/politics-rewired/spoke/commit/9f81a55202abfe20388bf375c625b9a5b93848cb))
* break props/callbacks cycles ([c937488](https://github.com/politics-rewired/spoke/commit/c937488cc7ae882fcccc463403e770ce54c23407)), closes [/github.com/apollographql/apollo-feature-requests/issues/40#issuecomment-489487888](https://github.com/politics-rewired//github.com/apollographql/apollo-feature-requests/issues/40/issues/issuecomment-489487888)
* clean up state, add docs link ([f22adc7](https://github.com/politics-rewired/spoke/commit/f22adc78ac61b9c8e0098ec8e88a832ee5959bf1))
* current assignment targets returning multiple pairings per team ([7708250](https://github.com/politics-rewired/spoke/commit/77082508e5ada7f6aaee4ee3e4191ef7f4843a73))
* fix mutation signature ([d26cb93](https://github.com/politics-rewired/spoke/commit/d26cb933dec7488fbe5db0b441bf169840150b3a))
* fix nextUrl and submit button type ([cdb3feb](https://github.com/politics-rewired/spoke/commit/cdb3feba3c6e24b5eebdc8d2e2073c70cdc1720a))
* fix UserEdit ([a80aa9d](https://github.com/politics-rewired/spoke/commit/a80aa9dfdd6d33fb99b8dac3390b421bd79b1a8c))
* handle custom fields properly ([1b4b4e9](https://github.com/politics-rewired/spoke/commit/1b4b4e933d890e8023bf4a74aabbd3ca41b03582))
* hide postgres error details in production ([15f0127](https://github.com/politics-rewired/spoke/commit/15f0127e391f2549be2b9d256f4a73e1babd3f1c))
* just check if the record exists ([546da49](https://github.com/politics-rewired/spoke/commit/546da49433a4db9df8ad2768a08bd7314f86eb66))
* limit request to current assignment max_request_count ([cf87d07](https://github.com/politics-rewired/spoke/commit/cf87d07b2a8de91512158dfc5b1b02e35e11889a))
* make insert-invite idempotent ([05b4375](https://github.com/politics-rewired/spoke/commit/05b4375eeb154a9956d4764d5706fc6833da986f))
* only add SP prefix once ([85fb2a8](https://github.com/politics-rewired/spoke/commit/85fb2a81788f9ccffb1ea58931a831b08fae9969))
* order by system tags on top ([02ec36a](https://github.com/politics-rewired/spoke/commit/02ec36ab397e0f7d194956f4a9fb954178241b61))
* page size back to 1000 ([b3fde43](https://github.com/politics-rewired/spoke/commit/b3fde43956e01f63595fb722fb459e0cff5ba7d6))
* pass preferred team id on manual approval ([73d2279](https://github.com/politics-rewired/spoke/commit/73d2279ba68a0e4e337e813c80ecde09e0373236))
* pr requests ([af2a5e6](https://github.com/politics-rewired/spoke/commit/af2a5e69b96bf0aa3e3aad065a535d76deadf6b9))
* pr review requests ([9c7a914](https://github.com/politics-rewired/spoke/commit/9c7a9142c3f7bafc402bec0ea8fb8d2699209361))
* prevent circular network requests ([838780f](https://github.com/politics-rewired/spoke/commit/838780f80abdcb4dce471abe83edf7ddd200efb4))
* remove extraneous line ([7501f74](https://github.com/politics-rewired/spoke/commit/7501f74f8d2932c533d105fd64f5da50d50011f3))
* remove pending job polling ([6e013a0](https://github.com/politics-rewired/spoke/commit/6e013a05d011528f8b2fbfb87161a0f743ac3260))
* render component correctly ([2b950a2](https://github.com/politics-rewired/spoke/commit/2b950a22bd100eaf38aee6b3b4e8404afaa3a902))
* requested changes ([8e6a022](https://github.com/politics-rewired/spoke/commit/8e6a0225bb20abbc590072678d6ab63ecc517845))
* restrict numbers to 10 digit US numbers ([fbeb836](https://github.com/politics-rewired/spoke/commit/fbeb836e365380de529a0a4f3a77dadff28a5674))
* return promise rejection ([52afe21](https://github.com/politics-rewired/spoke/commit/52afe211b8786f19277cb3a8c3e6c397061fe9bc))
* say type to search tags and require typing before displaying tags ([6a8c51f](https://github.com/politics-rewired/spoke/commit/6a8c51f140cf2f5ec5ab0f2b9fbad0150dfee93b))
* select auth_user.first_name ([4d20906](https://github.com/politics-rewired/spoke/commit/4d20906e30d7e6c8ada9c88650064ef809dbafe6))
* shorten script invalidation ([d8ec6de](https://github.com/politics-rewired/spoke/commit/d8ec6debfa769803cbd4ddbb8b6c2d6bbd5067c3))
* strip __typename property from mutation payloads ([09cbffa](https://github.com/politics-rewired/spoke/commit/09cbffa875150ad71135473c42379602a8c05b35))
* unpack router props correctly ([3308877](https://github.com/politics-rewired/spoke/commit/330887789eac4f291fc5a13c5ae4fa0a9e2d80f9))
* update conversation total count on component mount ([8ccf90f](https://github.com/politics-rewired/spoke/commit/8ccf90ff64747ab3b4b9dad75716e66fc27672cf))
* update network policy ([e0e9ed9](https://github.com/politics-rewired/spoke/commit/e0e9ed9ada5d6191bda4e82b24ba2c861393fb3f)), closes [/github.com/apollographql/apollo-client/issues/3633#issuecomment-406483894](https://github.com/politics-rewired//github.com/apollographql/apollo-client/issues/3633/issues/issuecomment-406483894)
* **ux:** make pencil icon size dynamic ([ef81d23](https://github.com/politics-rewired/spoke/commit/ef81d238b42364fa697811ac3810425798a3483b))
* actually add the counts ([81fa352](https://github.com/politics-rewired/spoke/commit/81fa352ad9c58b35af1b7c3bbc0d459b5f0686b9))
* add upgrade in yarn.lock ([11ae676](https://github.com/politics-rewired/spoke/commit/11ae676abb1455114588bb72c018de783183b2a0))
* await invalidation ([343e512](https://github.com/politics-rewired/spoke/commit/343e5122a933f0ad81e2f142d79ca8a8dd19fa85))
* change to comment style ([bfb0a9a](https://github.com/politics-rewired/spoke/commit/bfb0a9a79f17260c4a451dc3a3c696ba89cffbf7))
* correct params access ([48f56d0](https://github.com/politics-rewired/spoke/commit/48f56d0033e1b6b5baf21151576cbc7da4015884))
* exit the process when script has completed ([7088000](https://github.com/politics-rewired/spoke/commit/70880006fffd1eeae5cef41379d5756996d89ca9))
* fetch contact cell from database ([7725dca](https://github.com/politics-rewired/spoke/commit/7725dca55559475ec10046b78ea25a5eb5c10f34))
* find the top parent by checking for a null parent ID ([2cf80ee](https://github.com/politics-rewired/spoke/commit/2cf80ee92edd00a8e9fbb87f8b07b34d6f5deaea))
* fix join link behavior ([ab38858](https://github.com/politics-rewired/spoke/commit/ab388585c793fae709e159ff9deff4876b732aaa))
* fix STATIC_BASE_URL support ([c5b46b6](https://github.com/politics-rewired/spoke/commit/c5b46b6e6d40a4b81025bc3587e39e00ae26d65f))
* get react-hot-loader working ([1288ef5](https://github.com/politics-rewired/spoke/commit/1288ef5f16c2eb8d564587c24a1a4959f491b3fc))
* include all escalation tags in escalated convos ([6295c2a](https://github.com/politics-rewired/spoke/commit/6295c2a8cad37109e5e3fa370a27152139e6b23c))
* invalidate campaigns list on copy campaign ([d8922ae](https://github.com/politics-rewired/spoke/commit/d8922ae6aeaa85aa867efc0bb3ccd6f5879be522))
* invalidate organization on save teams ([96ead5c](https://github.com/politics-rewired/spoke/commit/96ead5c0745ef5b82f759a65450ead31193133e5))
* MEMOREDIS_URL is str, not url ([74a284d](https://github.com/politics-rewired/spoke/commit/74a284dca002eba2cca989caca413b9ad3db2f1c))
* merge conflicts ([915dc28](https://github.com/politics-rewired/spoke/commit/915dc2852b90fcc83656dd0e9d24a13754f86e07))
* pass correct key to invalidate ([05ab6ee](https://github.com/politics-rewired/spoke/commit/05ab6eefaff7f93d9be9dbfebaf9af8e109eb5a1))
* pass deduped assignment ids ([5277295](https://github.com/politics-rewired/spoke/commit/5277295fca61e64d19cc325f9db518efba8b2adc))
* pass error object to winston correctly ([c1922bd](https://github.com/politics-rewired/spoke/commit/c1922bd3a655e8b38b11af3cff5bc726a91e22c7))
* pr requests ([f39d667](https://github.com/politics-rewired/spoke/commit/f39d6671d6802d6e083a8cda7e8bf2cceb1733e1))
* pr review ([adcaafe](https://github.com/politics-rewired/spoke/commit/adcaafe2be487c862669669c82a99250cbd2ce17))
* prefer const ([db1c7ea](https://github.com/politics-rewired/spoke/commit/db1c7ea52b9dbe2bfabb30558f359abee67498b8))
* proper config import ([d21b47f](https://github.com/politics-rewired/spoke/commit/d21b47f4a0a9d3a72b04313838249b844919bb35))
* refetch the current people page ([5cd2c94](https://github.com/politics-rewired/spoke/commit/5cd2c94798fa1f90ac42e416511b6fd11d900668))
* remove accidental paste ([8ce1a4d](https://github.com/politics-rewired/spoke/commit/8ce1a4d3c68cd36fa7e8591dcec8c158bdb9eeb2))
* restrict access to currentAssignmentTargets query ([12b4bb7](https://github.com/politics-rewired/spoke/commit/12b4bb7388a349596b8774c885ad7ea3b6f0fc11))
* return array to match expected signature ([098af3e](https://github.com/politics-rewired/spoke/commit/098af3e60de5d76f90eb137f0067153c3b75deaf))
* return null rather than undefined ([6a3a6f3](https://github.com/politics-rewired/spoke/commit/6a3a6f3d53cf20678763b66c6c62e0488d308e32))
* return null rather than undefined ([b24f07f](https://github.com/politics-rewired/spoke/commit/b24f07f22132570456d2931d423abdea726ac79f))
* return updated user record ([f92bb54](https://github.com/politics-rewired/spoke/commit/f92bb54e3ff30139926766bc4898fc74a201fcf0))
* select from correct table ([14d974d](https://github.com/politics-rewired/spoke/commit/14d974d843779782ce82020847b696bc3b3d0f4a))
* shorten interaction step ttl ([5e57965](https://github.com/politics-rewired/spoke/commit/5e5796564391f8608a41aa7fceaadc9dba9778d4))
* tweak todos queries ([36a21d9](https://github.com/politics-rewired/spoke/commit/36a21d903addfd648462fde54efc0d4829c962a7))
* update docker build context ([255af04](https://github.com/politics-rewired/spoke/commit/255af04656aa1fc440158d6bda97c858ace7fdc5))
* upgrade memoredis to fix scan all bug ([826b3ec](https://github.com/politics-rewired/spoke/commit/826b3ec968964df6a3018c6cdc1a4f2e4ba4212b))
* upgrade memoredis to support json date deserialization ([529eed2](https://github.com/politics-rewired/spoke/commit/529eed20128c740d31394d41d423a58ba74e1ba8))
* upgrade numbers client to support mms ([449a67f](https://github.com/politics-rewired/spoke/commit/449a67f090728e426354248cf28d849427362c3d))
* use dedicated password reset component ([4354512](https://github.com/politics-rewired/spoke/commit/4354512e842627a82aa03615b026a4e9370201fc))
* use h1 with slight text modifications ([67efcfe](https://github.com/politics-rewired/spoke/commit/67efcfec4880c2154db09ab89699efdeb444673c))
* use redis lock to prevent possibility of double assignment ([7d55822](https://github.com/politics-rewired/spoke/commit/7d5582247caf57342c8bc82f9c9034f645206cb8))
* validate invite correctly ([6b7967d](https://github.com/politics-rewired/spoke/commit/6b7967d7810ae997ac9093e97b671f792b1c3ebd))

## [1.4.2](https://github.com/politics-rewired/spoke/compare/v1.4.1...v1.4.2) (2020-01-20)


### Bug Fixes

* add missing preferredTeamId argument ([63fe02c](https://github.com/politics-rewired/spoke/commit/63fe02cca71197174932de9a96de1abb01b113bf))
* avoid archived as bidning ([a2e086a](https://github.com/politics-rewired/spoke/commit/a2e086ad16af0a6d0c2c1e2cf4c55593b5ee197c))
* avoid union with for update skip locked ([ff1b88c](https://github.com/politics-rewired/spoke/commit/ff1b88c431248755f481b971634b3757a4703e08))
* bail on submit if already submitting ([b569c20](https://github.com/politics-rewired/spoke/commit/b569c20b09d6005312b585fc653126b4080501b5))
* bypass overly complex timezone evaluation ([4acc8e7](https://github.com/politics-rewired/spoke/commit/4acc8e79c21db3c11e48c6f7f98fb9c69505a2ee))
* clarify that arg is unused ([c28b2ea](https://github.com/politics-rewired/spoke/commit/c28b2ea10fde5ae65b0dcc5d3844a39b2bce23a2))
* comment, simplify queryArgs ([88f89af](https://github.com/politics-rewired/spoke/commit/88f89af7ef8821ebc33cf1b5f0548923fe7b1cc2))
* dont aggregate messaging services at send time ([f724913](https://github.com/politics-rewired/spoke/commit/f7249131db8b1d4c8bc393aff035180aea5eeb4b))
* dont change message status when escalating ([c087da3](https://github.com/politics-rewired/spoke/commit/c087da32186d3c499e0b7d7ecf8cffeca4070ca8))
* dont fetch count of messaging services ([424c0c7](https://github.com/politics-rewired/spoke/commit/424c0c793115a99c92e31d4f72f016192780e912))
* extend HTTP request timeout and log errors ([ea2f593](https://github.com/politics-rewired/spoke/commit/ea2f593e335f3d2ea25e44097087082a8b3cd064))
* fix dataloader implementation ([b996bff](https://github.com/politics-rewired/spoke/commit/b996bffe1a5486af7985a080ee52b50b5f7f8b1c))
* fix error when changing password ([cd90ccc](https://github.com/politics-rewired/spoke/commit/cd90ccc026cd29a874e433222664a9d88642205e))
* fix return type for returning("id") ([8044e25](https://github.com/politics-rewired/spoke/commit/8044e2585e821816fc8e3b1683a8fbddcf5cbdaa))
* fix service selection behavior ([fa49557](https://github.com/politics-rewired/spoke/commit/fa4955785a02dd80713da6a1cf171a429d70d431))
* ignore the mocked ID added to CannedResponseInput ([d473624](https://github.com/politics-rewired/spoke/commit/d47362479fcca556c8aa926256cf177ce522bc6d))
* include required numberAssigned property ([b40f3c4](https://github.com/politics-rewired/spoke/commit/b40f3c4f87d7abd2d9a490563f4a8a9b65968b96))
* index and query change necessary for search by tag ([39ab3b3](https://github.com/politics-rewired/spoke/commit/39ab3b3ba9117181ce56353d4e0b992b58a4d91e))
* let delivered override error ([fdbaa8a](https://github.com/politics-rewired/spoke/commit/fdbaa8aefdc61d088390374344d91ca5d332f814))
* messages export blank ([13fd5f2](https://github.com/politics-rewired/spoke/commit/13fd5f2b2c0d533392a68a36ae6d021cb46477a6))
* only update if not delivered ([f0068a8](https://github.com/politics-rewired/spoke/commit/f0068a8ee4dfc5d2e56ee0e62a5e7cdf0a9dae43))
* order by messaged first ([e9da7f7](https://github.com/politics-rewired/spoke/commit/e9da7f7552569a145af28fd41427798fa2cfcd07))
* perform notify in separate delayed transaction ([7c943d5](https://github.com/politics-rewired/spoke/commit/7c943d5bce1a1f2d8c15cd83c519571aff550666))
* pick json response property based on status ([f768df4](https://github.com/politics-rewired/spoke/commit/f768df431390cdbfe42a3dd38d3c023479b16841))
* pr changes ([fd064d8](https://github.com/politics-rewired/spoke/commit/fd064d8b86c544f7e5b0439dbcd6fbbea917379c))
* pr review cleanup ([f630d99](https://github.com/politics-rewired/spoke/commit/f630d9915d3608dd60061f766a590e975dfb8d38))
* proper index use archived = false ([365c50c](https://github.com/politics-rewired/spoke/commit/365c50c5ba8b13673276554b150100cd3487caf0))
* remove campaign team requirement for custom escalation tags assignment pathway ([9d26fe7](https://github.com/politics-rewired/spoke/commit/9d26fe71058298be670ed9ca6c25686db9230640))
* rename to last updated at ([bdf5f20](https://github.com/politics-rewired/spoke/commit/bdf5f20c4203fb03db53c562f62d96e4ee9e22e5))
* replace final .save() calls ([7d05190](https://github.com/politics-rewired/spoke/commit/7d051904c1414c9d55abf54879506d282ed0a8ac))
* report anticipated autoassignment errors as successes ([1593cd5](https://github.com/politics-rewired/spoke/commit/1593cd5f47a340a2a4cc0d1f68f05beb32505c6a))
* return updated campaign from resolver ([e279aee](https://github.com/politics-rewired/spoke/commit/e279aeecf6f996b07973b5b10ae6cf06fb87344a))
* return values where appropriate ([85e0d6c](https://github.com/politics-rewired/spoke/commit/85e0d6cbe1647b03eb33447e9aac6266f02b018e))
* review requests ([a6cc75f](https://github.com/politics-rewired/spoke/commit/a6cc75fab6049ed03fee20766d02a1c5d141e568))
* review requests ([f1aa8bb](https://github.com/politics-rewired/spoke/commit/f1aa8bbe1631a0774650a22bf692cd74e74648f1))
* scope opt-out check correctly ([18c1c8e](https://github.com/politics-rewired/spoke/commit/18c1c8ef313ab61546cd4154523d60ac7096d239))
* send message opt out query should respect global opt out env var toggle ([9e8df70](https://github.com/politics-rewired/spoke/commit/9e8df70f40111ca1d3c63ce286169d21c7ecb822))
* send null instead of empty string for contact zip code ([4edb5a7](https://github.com/politics-rewired/spoke/commit/4edb5a759a5e315fd69a8bdb0d766ef6ee4d60a0))
* setting assignment controls for first time ([1fef9f2](https://github.com/politics-rewired/spoke/commit/1fef9f2045a9a5a745cda4a7b3efee73ceffaba7))
* skip locked on link domain subquery ([72a9498](https://github.com/politics-rewired/spoke/commit/72a949877d857b6a9f049909b6effad87f452dbe))
* supply aws credentials explicitly ([c430720](https://github.com/politics-rewired/spoke/commit/c430720a99edc1a9809924cef050d0f91e27b271))
* syntax error on mark for second pass ([9331b36](https://github.com/politics-rewired/spoke/commit/9331b362ccf866936138b810c077510549014da4))
* use correct date comparison ([8d36f45](https://github.com/politics-rewired/spoke/commit/8d36f454320b2464063716fe96f58401bc795c98))
* use correct table name for zip_code ([4f454af](https://github.com/politics-rewired/spoke/commit/4f454af8ce18700c0e2491bc8f8be1f59348fc27))
* use modal dialog ([a8e5224](https://github.com/politics-rewired/spoke/commit/a8e5224e1a80fad5dcb3d0847483919c2a0d26ad))
* use subshell ([8b16415](https://github.com/politics-rewired/spoke/commit/8b16415cc714e9c58c2e2ed734368422faa87956))
* **exports:** handle error from stream creation ([a78f73c](https://github.com/politics-rewired/spoke/commit/a78f73cbc932e8e9760d31a89580d65c4546b999))
* **external-assignment-request:** dont hold transaction ([de49e36](https://github.com/politics-rewired/spoke/commit/de49e36a62e542000096fc9897e5e7532bada6c1))
* **message-review:** remove contact name filter when text is empty ([a37893c](https://github.com/politics-rewired/spoke/commit/a37893c82f367adca5ae6a56829a0385d9dc3c21))
* **s3:** use async method to support role-based auth ([c32a400](https://github.com/politics-rewired/spoke/commit/c32a4003310231661f69fe21b4c038a4aa1e8763)), closes [aws/aws-sdk-js#2166](https://github.com/aws/aws-sdk-js/issues/2166)
* add count_left back to allCurrentAssignmentTargets ([dba9580](https://github.com/politics-rewired/spoke/commit/dba9580875696418095b2f69f5e2655819e7024b))
* add escalate tag without confirmation steps ([8654101](https://github.com/politics-rewired/spoke/commit/86541010485021fb0305ea3fbc488548faa877ca))
* add option to disable has unassigned contacts query ([92a0223](https://github.com/politics-rewired/spoke/commit/92a0223ca6315b764d9de687d875b2eb22c6e11d))
* assemble numbers inbound message handling ([b56e2b3](https://github.com/politics-rewired/spoke/commit/b56e2b3253e7a9a6d2e656b93bb441dc1bf4f477))
* at time zone unknown; docs: add conservative comment ([19ff9fb](https://github.com/politics-rewired/spoke/commit/19ff9fbaa038ce1e3ede00a3efd791c30a6ef167))
* check for null values not empty object ([072495f](https://github.com/politics-rewired/spoke/commit/072495f236d6a78789e3ebbdc3effd313ea3a6d6))
* contact is textable function ([3848c0b](https://github.com/politics-rewired/spoke/commit/3848c0b32e5781dee591c82fce4c88820f1f6c7c))
* contact_is_textable function ([14c96fa](https://github.com/politics-rewired/spoke/commit/14c96faa0382cf3e1f183f4a9981ed0d5f841666))
* contact_is_textable_now can return null ([9546ab1](https://github.com/politics-rewired/spoke/commit/9546ab19f75361b6c9d735b8a2d594e04fb0dd97))
* correct sign direction on assignable_needs_message and reply ([0eb28c7](https://github.com/politics-rewired/spoke/commit/0eb28c76cd87ff7bdb9dd52043560a52b30b3ae1))
* correct variable name ([80064f3](https://github.com/politics-rewired/spoke/commit/80064f39a6036c9ca36607495d66cdd66d450822))
* dont set max contacts in auto assign loop; default MAX_CONTACTS_PER_TEXTER of 500 ([8415d02](https://github.com/politics-rewired/spoke/commit/8415d021a49161d736c5275a51fbf015fe435a36))
* dont set sent after other message ([0fc2bde](https://github.com/politics-rewired/spoke/commit/0fc2bdeb4879ce45e642f7225842ea858b81d363))
* drop count_left subqueries ([42e96ca](https://github.com/politics-rewired/spoke/commit/42e96caec6daf7b29790a0eafc770e197df57728))
* enable assignment request by supervolunteer ([ff80750](https://github.com/politics-rewired/spoke/commit/ff807504ba6c195c60212e695bf55915466477b7))
* filter by organization correctly ([1f15608](https://github.com/politics-rewired/spoke/commit/1f15608713192225c97d03d1cedbde4bf190c979))
* fix syntax error ([ab3eafc](https://github.com/politics-rewired/spoke/commit/ab3eafc4fc172b7e5b339cdf0dd9f51188fa6907))
* fix typo in opt-out query ([ad913ef](https://github.com/politics-rewired/spoke/commit/ad913ef81a3b7599c9b501f4e63e02348bfe5e6f))
* handle case where responsesString is undefined ([68dadda](https://github.com/politics-rewired/spoke/commit/68dadda56b684854123d3cb27e21f8841da8372d))
* include insert invite in dockerfile ([49cd0ce](https://github.com/politics-rewired/spoke/commit/49cd0ceaac90c78c4c6add82282e716c7907f018))
* include unmessaged contacts in message review queries ([fe02fd4](https://github.com/politics-rewired/spoke/commit/fe02fd485130d6ef9addc6598418a18f9adb1ca1))
* index campaign contact id ([0e72b6e](https://github.com/politics-rewired/spoke/commit/0e72b6e74a332200680908d84abf3eec47324fa1))
* limit on update ([effa5d0](https://github.com/politics-rewired/spoke/commit/effa5d08cc821b7c6d74b5eb7ad53f1840ee200a))
* make dynamic assignment toggle truly controlled ([b94dd46](https://github.com/politics-rewired/spoke/commit/b94dd46156159814ef5913deaafeee0319549ae0))
* make requested changes for review ([618cc77](https://github.com/politics-rewired/spoke/commit/618cc77525c3aa73ad36e0f3f84face7a5d69058))
* make test more robust to future DDL ([48578c3](https://github.com/politics-rewired/spoke/commit/48578c31e425c2ec20c13612c2729a53ea120329))
* order by coalesce ([01ae8fa](https://github.com/politics-rewired/spoke/commit/01ae8fa1a75e7795a66c3df00c8f8548e3cf39d3))
* properly conservatively handle contacts with missing time zones ([aa172b4](https://github.com/politics-rewired/spoke/commit/aa172b4d0f38c221adc5957868072c380ab5caa5))
* return location ([17ae3f6](https://github.com/politics-rewired/spoke/commit/17ae3f67d72235c3fadfaaa67e9ea9b9327a0086))
* tweaks to backfill script and migrations non index option ([c97fa09](https://github.com/politics-rewired/spoke/commit/c97fa0983819bddaa0c526f6228e7f9fea53f741))
* use is (not) distinct from ([fce87da](https://github.com/politics-rewired/spoke/commit/fce87da92ae537236a4ed11559ffb99bec5aae94))
* **pg:** catch missing knex<>reader swaps ([58ff0ff](https://github.com/politics-rewired/spoke/commit/58ff0ffe0fc34f4b6f8d48e4f3607bfedf5b3973))
* fix ordering of view drops ([23b8836](https://github.com/politics-rewired/spoke/commit/23b8836329328a5250eeb822b86c89c870d2d976))
* get title of overlapping campaign ([4ec68f6](https://github.com/politics-rewired/spoke/commit/4ec68f694b39b2773cebd9f3c1ff0634d1a31bee))
* message locking from assignment queries ([67a0c13](https://github.com/politics-rewired/spoke/commit/67a0c13b933d9dd0e06a54f9da48a6e96a4bb13c))
* move where clauses to join conditions ([88f3dc7](https://github.com/politics-rewired/spoke/commit/88f3dc75d4ea8267a083e73f35c276b9e019c12f))
* order by last messaged at rather than updated_at ([3a65d70](https://github.com/politics-rewired/spoke/commit/3a65d70c5315769ffc635df4a948407a325eb333))
* prevent empty tagConversation mutations ([28c5956](https://github.com/politics-rewired/spoke/commit/28c59563da2f78c34d0e3cdc1006b14a3286d489))
* restrict contact upload to 75% of db pool size ([9a1db5e](https://github.com/politics-rewired/spoke/commit/9a1db5ec56bd573161ed201d01b30c58beb58675))
* scope bulkScriptUpdate to organization ([bf6f0cb](https://github.com/politics-rewired/spoke/commit/bf6f0cbd2381b4e4c028d41cb872a305946c314c))
* simple less than for texting hour end ([3089c50](https://github.com/politics-rewired/spoke/commit/3089c50056e10b492633e4a2ab45a68b6fa3ab08))
* standardize conversion from timezone name to UTC offset ([6acbbc5](https://github.com/politics-rewired/spoke/commit/6acbbc57c974d22e03ce70a478fee6daf1ce2b8d))
* use assignable contact views for assignLoop ([168c85b](https://github.com/politics-rewired/spoke/commit/168c85b13f2796ee29a0f5594174f34b1443f00d))
* **knex:** return count as number ([8a24126](https://github.com/politics-rewired/spoke/commit/8a24126c12bc94629929cf2da8d4c440ff587c19))
* **local-login:** expect user object not array of users ([01b900b](https://github.com/politics-rewired/spoke/commit/01b900b42ebd88541a3f99c3e57487d160a48b8c))
* **message-review:** move key prop to correct location ([5a5bbfa](https://github.com/politics-rewired/spoke/commit/5a5bbfa6eeaefd90c91c454a9b864e3247cdd49d))
* **session:** use passport for non-Auth0 logout ([1f3c076](https://github.com/politics-rewired/spoke/commit/1f3c07653e3863edb594b9cf464fa2e5ff2ad587))
* **switchboard:** fix switchboard response handling ([b7d607c](https://github.com/politics-rewired/spoke/commit/b7d607c76ea0bf4cf3e90f3205439e6de98faa48))
* **tags:** allow admins to bypass assignment requirement for tag management ([e20df00](https://github.com/politics-rewired/spoke/commit/e20df009811b2f077a99ec858a3f5683a3495562))
* **tags:** reset tags each time dialog is opened ([c5f9041](https://github.com/politics-rewired/spoke/commit/c5f904153953254dad51d83f09a70e6d04c380a0))
* **tags:** update method name ([0a41d79](https://github.com/politics-rewired/spoke/commit/0a41d795c427da7552915e64718c1543d4ff7b39))
* **teams:** fix campaign team comparison ([553696e](https://github.com/politics-rewired/spoke/commit/553696e53a1f33e12003a0e69475f2f6d58a9013))
* **teams:** remove unnecessary authRequired check ([a4f1608](https://github.com/politics-rewired/spoke/commit/a4f160835754a8a02b4cbe55b8faf8b486018655))
* **teams:** simplify team update logic ([f9ffe30](https://github.com/politics-rewired/spoke/commit/f9ffe30ffb7c0517b743e026dfa81b8529a62d7f))
* 0 index into null ([9a97cfd](https://github.com/politics-rewired/spoke/commit/9a97cfd118d50d09e14f04a3b6a5a6bdd7226e51))
* account for fake organization team ([2e926f2](https://github.com/politics-rewired/spoke/commit/2e926f29c540bfe83f689217c0e2d06490a3281c))
* **forms:** prevent submit button from being full-width ([1f1ba37](https://github.com/politics-rewired/spoke/commit/1f1ba3747aa05296fc081d3efeeec613d7c47b9c))
* add default background color ([58451ca](https://github.com/politics-rewired/spoke/commit/58451caef898c2af1b99eb8be969af36ec94fe6c))
* add message, sensible defaults for updated_at ([99c0162](https://github.com/politics-rewired/spoke/commit/99c01622e9a9ea16adc6c10d3f17a5e1c4d3cdd9))
* allCurrentAssignmentTargets should show everyone else with first campaign without limit contraint ([c7ee88c](https://github.com/politics-rewired/spoke/commit/c7ee88c26ccd8eb4bcc89163d18d45dc431eeedd))
* assignment queries organization scope ([9adbfcf](https://github.com/politics-rewired/spoke/commit/9adbfcf7f5077e858babc91eddd6bb19c2fa3441))
* default now for migration ([763b688](https://github.com/politics-rewired/spoke/commit/763b6887410dfe8fcee7d066534e524f85bfa4ce))
* dont allow non team members to get campaigns as a result of default ([d6b99f7](https://github.com/politics-rewired/spoke/commit/d6b99f7f025aa3188a62163ffaa4a1b4b83cd564))
* find a campaign that is potentially lower id for limited assignment ([05c7510](https://github.com/politics-rewired/spoke/commit/05c7510634130828e9e01777117d10b927088387))
* fix column names in down migration ([03c0770](https://github.com/politics-rewired/spoke/commit/03c077015571011f0594b77d39f4879894585529))
* fix the production path ([e168bfa](https://github.com/politics-rewired/spoke/commit/e168bfa9c26da9446fb3e5a41ec28216d01eb77e))
* flexible return from myCurrentAssignmentTarget ([4628f5e](https://github.com/politics-rewired/spoke/commit/4628f5ee3aa5d5e390e10c63c406445258bc410c))
* general assignment returning multiple results and final ordering not by id ([4dd5b04](https://github.com/politics-rewired/spoke/commit/4dd5b04ca3c4e52fc9422e9f4c7a78b71ee24230))
* global regex replace ([bb1847a](https://github.com/politics-rewired/spoke/commit/bb1847acd3ad808e081f176151929bf7359df859))
* more to controlled component, allow setting null ([0189cdf](https://github.com/politics-rewired/spoke/commit/0189cdfbcec7831490bb5377bbc282537bcfdd05))
* move to static imports instead of dynamic require ([9c1aa8b](https://github.com/politics-rewired/spoke/commit/9c1aa8b5816c2ecebe42f1cfa8cb23cb1391ac72))
* my current assignment target selection - create priority column ([e7e591e](https://github.com/politics-rewired/spoke/commit/e7e591e818aa6d9bdac1c63c4b18e83777183e45))
* nulling and editing numbersApiKey ([e262820](https://github.com/politics-rewired/spoke/commit/e26282033ebbb2b31ed3fcc1108b3e48a8e3d14d))
* organization scoped opt outs ([f1348e1](https://github.com/politics-rewired/spoke/commit/f1348e11180052d8998682a7958889be7e50e8f2))
* proper .then calls ([b31a0b9](https://github.com/politics-rewired/spoke/commit/b31a0b98a2ddd8908742287fae3cb4ff2d579d95))
* rejecting assignment requests when general is disabled ([e065e01](https://github.com/politics-rewired/spoke/commit/e065e015b3d5b7892515fdb272ebd09a9490a4a2))
* requested permission changes ([db24bb3](https://github.com/politics-rewired/spoke/commit/db24bb3234aaee3cb09a771e12a6a7c54d4a35e8))
* return array from myCurrentAssignmentTargets ([065bbfc](https://github.com/politics-rewired/spoke/commit/065bbfc55a7f2707e592988eebd56c037ebaecf5))
* return empty array rather than null ([11bb011](https://github.com/politics-rewired/spoke/commit/11bb0111afcf65f806dadea91e3064cfc1322a0a))
* return full messaging service correctly ([d9d4692](https://github.com/politics-rewired/spoke/commit/d9d4692cd9e2fe3922383a487acffb8e463d476b))
* return values from saveTeams ([4f3dd7a](https://github.com/politics-rewired/spoke/commit/4f3dd7ad52aeab4025eda94e4b9f16c10f252427))
* slack team update - fully paginate slack channels ([8afe903](https://github.com/politics-rewired/spoke/commit/8afe90387d872a0957d8cd11f4d7252bda2e67b6))
* tag application blocking message sending ([0e0188b](https://github.com/politics-rewired/spoke/commit/0e0188b87bdd05a81291e11a785023e6437e712b))
* tag editing ([fd03409](https://github.com/politics-rewired/spoke/commit/fd03409f4d1ca8924ca7ccddcea56a4547f5cf2d))
* timezone issues ([f9b8786](https://github.com/politics-rewired/spoke/commit/f9b8786a934513c57710c08da24182079fc7db01))
* unassigned contacts respects opt outs and escalation tag ([5d0af87](https://github.com/politics-rewired/spoke/commit/5d0af87cd7cb1c583687d26475b62c1527d22122))
* update cache with new values ([bfc01d7](https://github.com/politics-rewired/spoke/commit/bfc01d76be48f6730cac636e4c662577d80a3fa1))
* use campaign texting hours instead of hardcoded 12 and 21 ([a2bd049](https://github.com/politics-rewired/spoke/commit/a2bd049e397de347128dd11c92bcff8a51dd17c4))
* use idiomatic approach to state update ([afe8287](https://github.com/politics-rewired/spoke/commit/afe8287c5dbadc7d8fc3755940edbb1cd20d3b21))
* use null instead of unknown - at time zone null is null ([fde17eb](https://github.com/politics-rewired/spoke/commit/fde17ebd3740e60b8a277f8247425dadce72a7d8))
* use raw archived = instead of knex binding ([dcd40bb](https://github.com/politics-rewired/spoke/commit/dcd40bbe1a47323c27f60c618ced401a3608e601))
* use SpokeSendStatus.Delivered ([287f37d](https://github.com/politics-rewired/spoke/commit/287f37d23a36993a865ac320c91f5c5f037487e8))
* wrong number of vars for unsent assignments ([3243bef](https://github.com/politics-rewired/spoke/commit/3243bef0295d99757eb485b3ea13fba73f5bef94))
* **apollo:** remove buggy custom dataIdFromObject function ([39e9504](https://github.com/politics-rewired/spoke/commit/39e95048b81bf0c019dc598fbdbfb07927892d90))
* **assignment:** fix createdAt resolver ([bdabaca](https://github.com/politics-rewired/spoke/commit/bdabaca71e97d3bb27ef62929e3ae408200c57dd))
* **assignment-requests:** scope results to organization ([ab7f156](https://github.com/politics-rewired/spoke/commit/ab7f156868395c6c6d5c485a263778e37059194b))
* **campaigns-list:** add early return for All results case ([666f5e4](https://github.com/politics-rewired/spoke/commit/666f5e448201333347a949790c8a596900af8574))
* **campaigns-list:** skip limit/offset application for 'All' pageSize ([fdbac58](https://github.com/politics-rewired/spoke/commit/fdbac58472708070a78ead34d3ace315c817acc4))
* **config:** add ASSIGNMENT_COMPLETE_NOTIFICATION_URL ([b946c75](https://github.com/politics-rewired/spoke/commit/b946c75e75b54a5b47e2f4e7369006c75b028ed7))
* **config:** change STATIC_BASE_URL to str type ([e245ce7](https://github.com/politics-rewired/spoke/commit/e245ce7bc6285c2b2201eb3e851bc16e05c279e4))
* **config:** create missing reference ([76d473a](https://github.com/politics-rewired/spoke/commit/76d473a7cbd2d29dd562ae05b7837dcd097c1000))
* **config:** fix envalid options ([a54f2e2](https://github.com/politics-rewired/spoke/commit/a54f2e278f2e68e7a87afc8dcca8100a4c86efc1))
* **config:** remove trailing dot in IP address ([e6818a4](https://github.com/politics-rewired/spoke/commit/e6818a46a34969becebec754791265f95508b3d7))
* **config:** switch config to process.env ([25ecf33](https://github.com/politics-rewired/spoke/commit/25ecf33296d67ce94ceb5baf2420943bfaa5de48))
* **exports:** order cte ([a1dd25f](https://github.com/politics-rewired/spoke/commit/a1dd25f57fa27b32fbf56e46c50e75a62e2baa7b))
* **lambda:** load config file from correct location ([9715086](https://github.com/politics-rewired/spoke/commit/9715086e06c5b7e6506b6decb29be8bf2c10dc58))
* **logging:** fix config import ([6d5c97d](https://github.com/politics-rewired/spoke/commit/6d5c97dc5bb7ddd317603abae8370a0f3e150cca))
* **logging:** fix rollbar setup ([f9db668](https://github.com/politics-rewired/spoke/commit/f9db668d4f7db326d461f499257af5680efeb416))
* **logging:** remove errorCatcher ([14b388c](https://github.com/politics-rewired/spoke/commit/14b388c903d04e11c71a187eb73f007effaa47a4))
* **logging:** remove log object complexity ([655700a](https://github.com/politics-rewired/spoke/commit/655700ac29ea4a122f023abaa72ccd0f13159361))
* **logging:** remove unused client-side reference to server function ([5ee63c3](https://github.com/politics-rewired/spoke/commit/5ee63c3137a524462743b396921798625a67c59e))
* **logging:** use console for remaining client-side logs ([e24f173](https://github.com/politics-rewired/spoke/commit/e24f1730d7db057f2dd3c5263ca2848d4597b960))
* **metrics:** pass custom StatsD to connect-datadog ([5909678](https://github.com/politics-rewired/spoke/commit/5909678dcd51f39426e97dac01b688ff65c49527))
* **metrics:** use standard connect-datadog library ([fca59df](https://github.com/politics-rewired/spoke/commit/fca59df153f3b695f8c568519f9c04c3e18fb0c6))
* **teams:** add column default ([4c1f0ca](https://github.com/politics-rewired/spoke/commit/4c1f0cac596d35f0859cd388784b80e328dfc7db))
* **teams:** fetch organization's teams ([2e00584](https://github.com/politics-rewired/spoke/commit/2e00584e3d304816097d030091a742ed2c3a15c2))
* **teams:** fix assignment_priority column name ([9858387](https://github.com/politics-rewired/spoke/commit/98583879b6470f3477ea05c7efd6cefdd0f7788a))
* **teams:** manage teams and toggle independently ([c87e1b0](https://github.com/politics-rewired/spoke/commit/c87e1b0337a252312f8dd10d7f9c1cd7511d691b))
* **twilio:** pass emtpy array rather than undefined to twilio ([c9dde44](https://github.com/politics-rewired/spoke/commit/c9dde4499fe0d5243c02169fec6cc8b5472bcf61))
* **util:** return copy rather than mutating ([5aed874](https://github.com/politics-rewired/spoke/commit/5aed874d6a99db1f65795e9742fad07bc0c9452b))
* **utils:** return offset ([7574cf7](https://github.com/politics-rewired/spoke/commit/7574cf704e15b66554cac5ca53e3bfd645df50bc))
* add missing PasswordResetLink import ([fdc3a0a](https://github.com/politics-rewired/spoke/commit/fdc3a0a4a8990b440d5030a01367c8f2445c443f))
* apollo client singletown window reference ([134655f](https://github.com/politics-rewired/spoke/commit/134655f6602e298bfcf10269b646c19e7a8112c5))
* assignment query ([708fe7a](https://github.com/politics-rewired/spoke/commit/708fe7a8da93b7ea34aeb6a628c6b23b06197d3d))
* assignment query subquery instead of left join ([30660d0](https://github.com/politics-rewired/spoke/commit/30660d06bfc77a470206744eb27500048ec67007))
* campaign contact tag.id ([a98ff06](https://github.com/politics-rewired/spoke/commit/a98ff069afd2a2cd10de79950d7867bc755446dd))
* construct and use RegEx correctly ([794db0e](https://github.com/politics-rewired/spoke/commit/794db0eb3d21af032aa4855a35a93a2cb79429ef))
* invert incorrect boolean logic ([426e6e0](https://github.com/politics-rewired/spoke/commit/426e6e02c240c349e875408be7e04cf0887aabe8))
* invite to organization creation ([1205497](https://github.com/politics-rewired/spoke/commit/1205497efd850f17ca6bbf36a1e76ae09ba74670))
* order by old style ([64ccf71](https://github.com/politics-rewired/spoke/commit/64ccf711a6bd6cc44e1937c1c14f93c1bde80d2d))
* question response in export ([9c36f3a](https://github.com/politics-rewired/spoke/commit/9c36f3a46ea82f6c2624dc4f92bf84f46059ba11))
* reduce scope of regex to specific domain ([4e03e92](https://github.com/politics-rewired/spoke/commit/4e03e92dbf61c827075a2c35d2422bc4eb0c35ff))
* reference knex correctly ([630815d](https://github.com/politics-rewired/spoke/commit/630815d30d1b3b29af0b9c41c0fa022051e43c15))
* remove all config imports from client ([6812062](https://github.com/politics-rewired/spoke/commit/68120621749cb198819c12278f9e8579fe04ad97))
* remove all config imports from client ([843dc72](https://github.com/politics-rewired/spoke/commit/843dc72de226df85a4dbaba5e66cca133dde9fde))
* remove apollo singleton from server ([9cb939c](https://github.com/politics-rewired/spoke/commit/9cb939ce9415c60a0f9b94cdc45f5173cccecfa3))
* remove order by ([9cdb1d8](https://github.com/politics-rewired/spoke/commit/9cdb1d8f96032d137fd34a2cb80ecc7957d7a72f))
* requested pr changes ([6b0719c](https://github.com/politics-rewired/spoke/commit/6b0719cdced640ba7712f96733eab0517793f741))
* return id field from insert and correct variable name. ([95e75f1](https://github.com/politics-rewired/spoke/commit/95e75f11a4737c5451e4bafcf3320cc2298f8a26))
* serve public dir if envvar is defined ([07d9a0b](https://github.com/politics-rewired/spoke/commit/07d9a0be31a249f0f058223a2352c50eabb02287))
* set default of empty array for service_response ([89dd361](https://github.com/politics-rewired/spoke/commit/89dd36165c5721044cb614d1d855364d02b15f7a))
* signing up with invite, button placement ([41c6654](https://github.com/politics-rewired/spoke/commit/41c66544ca7b03f4d880b9b20718792265cd70c2))
* signup ([2f94693](https://github.com/politics-rewired/spoke/commit/2f9469372e24fd6421420a2561931a0bcbce8288))
* simplify renderIndex ([2c1469c](https://github.com/politics-rewired/spoke/commit/2c1469ce755a5e900f4afed2c5685699d2a7629d))
* slack user team cron job ([c776ce8](https://github.com/politics-rewired/spoke/commit/c776ce878dfb2632b83beb19dc6b758209cce4ed))
* standardize service_response ([3909b0e](https://github.com/politics-rewired/spoke/commit/3909b0eb6582846df1cbc57453e3cc1559c93e13))
* test client correctly ([ef86631](https://github.com/politics-rewired/spoke/commit/ef86631cfa29bedde77d32ad0cb83b7e1469c408))
* tz.zone().utcOffset ([077bbeb](https://github.com/politics-rewired/spoke/commit/077bbeb04da3429a44d2912a081b8ba3efd808f8))
* **logging:** use console everywhere ([6f2348a](https://github.com/politics-rewired/spoke/commit/6f2348a345a877623de5177fcf5288e9f3dc8cc9))
* unassign on escalate ([7b49403](https://github.com/politics-rewired/spoke/commit/7b49403d878bc65fbe90453e444cf6e134abfe2e))
* use console instead of undefined log ([6d45fb6](https://github.com/politics-rewired/spoke/commit/6d45fb626c62bbd7ae679a988158d975415a19b0))
* use independent webpack envalid config file ([745a5ae](https://github.com/politics-rewired/spoke/commit/745a5ae947ec34e939bcac1694a9fd81656da523))
* **message-review:** request userId when sending admin message ([fb5d036](https://github.com/politics-rewired/spoke/commit/fb5d036e1c303481d1d9566003eff37ef560bc0f))
* **tags:** create new tagsFilter object ([57efc8f](https://github.com/politics-rewired/spoke/commit/57efc8f192d3f516dfe2564fe8e6190bb6c3f0ab))
* update fakeservice sendMessage signature ([6494627](https://github.com/politics-rewired/spoke/commit/6494627bc30ef374394f1df56c430cee50974849))
* update numbers client usage ([84815c2](https://github.com/politics-rewired/spoke/commit/84815c2a978bf781eeada42d3d30264233b63b1e))
* use reject within AuthHasher callbacks ([5534a8a](https://github.com/politics-rewired/spoke/commit/5534a8a4cbbac9811fd7ce152c00758d104c840c))
* view definition (migrations already run in production) ([d804570](https://github.com/politics-rewired/spoke/commit/d804570bbb367d6631e1a29a63d13138dbdb5e83))
* **tags:** reset tags every time the selection dialog is opened ([e62a584](https://github.com/politics-rewired/spoke/commit/e62a5841869c94964d9ba309d7a12ee824a4a770))
* **tags:** wrap PG lower function in knex.raw ([d7ece37](https://github.com/politics-rewired/spoke/commit/d7ece3740094207248dfc269152986c97c55b379))
* **teams:** add onDelete statements ([76e3e0d](https://github.com/politics-rewired/spoke/commit/76e3e0d8961dc2c97511fd2d66b6380c9e7713c7))
* **teams:** apply code review suggestions ([04faf4a](https://github.com/politics-rewired/spoke/commit/04faf4ae326fef3f1c5cba10cfbefc476ab5bd9c))
* **user:** fix UserEdit required fields ([7dad66e](https://github.com/politics-rewired/spoke/commit/7dad66ed6784e2527f5da1a563fae33a01663a79))
* **user:** prevent password change for non-local login ([2eda21f](https://github.com/politics-rewired/spoke/commit/2eda21fa9c8e1fe490fa49ed35b74a032e117cfb))
* switch ordering of moment.diff arguments ([e313914](https://github.com/politics-rewired/spoke/commit/e313914c0f69fc53a70fb31494df34e6c6932c7e))
* trim leading/trailing spaces in custom fields. ([1d7fd94](https://github.com/politics-rewired/spoke/commit/1d7fd948342884dc82271121553f8c969c3834bb))
* use timezone-aware logic everywhere ([5d55156](https://github.com/politics-rewired/spoke/commit/5d55156e51c47fe8a9009cddd1c07ac9e0326805))


### Features

* add additional logging for assemble numbers ([4fe865b](https://github.com/politics-rewired/spoke/commit/4fe865b0271828850654fb87e939eaf961dedd91))
* add archived=false to assignment views ([67818bc](https://github.com/politics-rewired/spoke/commit/67818bc196679ea82898a9e3d7f87e804ac6461f))
* add campaign title to texter todo ([132a433](https://github.com/politics-rewired/spoke/commit/132a4331ddcd02fcc6b216b5f2c404ab47660b59)), closes [#355](https://github.com/politics-rewired/spoke/issues/355)
* add client-side authentication check ([3630383](https://github.com/politics-rewired/spoke/commit/36303835bed42f10bbcb759029f22814722cce19))
* add early return if there are no cells to assign ([06ba3d1](https://github.com/politics-rewired/spoke/commit/06ba3d147729bf1ff843c40a07bc61e0e7b54923))
* add error handling for editCampaign ([303ff8a](https://github.com/politics-rewired/spoke/commit/303ff8a4440782a331836ad9111e183014c0ad7f))
* add fine-grained control of notifications ([b040b85](https://github.com/politics-rewired/spoke/commit/b040b85747b3160ca92c04f1c9d3e51b99e35ea7))
* add script to sync all active and recent campaigns ([c6fada4](https://github.com/politics-rewired/spoke/commit/c6fada46981d3f4009024643e19a465dd998fb4c))
* add support for invite payloads ([9d2aa57](https://github.com/politics-rewired/spoke/commit/9d2aa579bbc8172691728e10ca11871c75dfc7a2))
* add team columns ([ea9c177](https://github.com/politics-rewired/spoke/commit/ea9c1775f840e6e1e46a1cfe8b9431cc8d91c76a))
* add timeouts to outbound http requests ([4bdd699](https://github.com/politics-rewired/spoke/commit/4bdd699651daa61f827d21e3ced46e538a322256))
* allow texters to choose assignment ([de61f0b](https://github.com/politics-rewired/spoke/commit/de61f0b467cbeedaaddc391c5d6978478d294192))
* apply tags on skip reply ([1180e95](https://github.com/politics-rewired/spoke/commit/1180e95e89ff3fea59a1637c5fea210a8e647d1f))
* assign messaging service in sendMessage resolver ([ce1a8bb](https://github.com/politics-rewired/spoke/commit/ce1a8bb9379996431b96acf1205a4d50155c55be))
* cache authorization and some campaign fetches ([3debbb3](https://github.com/politics-rewired/spoke/commit/3debbb3459c384ecc01f64419c70964a90c33e29))
* change team assignment column name; add AssignmentTarget.enabled ([bb04b09](https://github.com/politics-rewired/spoke/commit/bb04b09190ad96b8ced0d9798c9ef42ccfe8a3df))
* contact level time zone assignment ([17fe36c](https://github.com/politics-rewired/spoke/commit/17fe36cbe882d5773d17379b33ae6a005d4f0501))
* custom escalation tags gui ([2bf21cf](https://github.com/politics-rewired/spoke/commit/2bf21cf7b96e4e81b8dcb1a29c976f77511c4b54))
* display authentication errors ([a276099](https://github.com/politics-rewired/spoke/commit/a276099ae535a8516c0d1a25085a425dcaecdcdd))
* display authentication errors ([8fcd440](https://github.com/politics-rewired/spoke/commit/8fcd440b6165ca0b94bedb63a56798684deafb4d))
* drop column should be same as up column; new team based assignment queries ([12b62c9](https://github.com/politics-rewired/spoke/commit/12b62c9156eec46bbfbc12ca29ea441d8b8d24ae))
* expose new team properties ([dc45103](https://github.com/politics-rewired/spoke/commit/dc45103513d36b884765797cf40576421cbff0ca))
* filter by tags in incoming message review ([2338794](https://github.com/politics-rewired/spoke/commit/23387942699038732d3170ad0496df84558ea44e))
* formalize enforced texting hours ([fc4b90d](https://github.com/politics-rewired/spoke/commit/fc4b90dab41fcf803b5a4f0bc90b91ee263f19d7))
* generalize all message service assignment functionality ([278d2a6](https://github.com/politics-rewired/spoke/commit/278d2a65138e22ffbbb33ee531de0ec52abc6c84))
* implement unmarkforsecondpass and deleteneedsmessage ([e08453c](https://github.com/politics-rewired/spoke/commit/e08453c56a2c0a20d9cbb761c29f027cdcde17b0))
* improve assignment request error handling ([31c2fcf](https://github.com/politics-rewired/spoke/commit/31c2fcf3c1acd97e55e8712c313bcf9a2e0cae2e))
* include archived condition on incoming message review query ([6475be1](https://github.com/politics-rewired/spoke/commit/6475be11f4275dd378ffa336503c7dce48d9681a))
* include texter email address in search UI/params ([d0584ea](https://github.com/politics-rewired/spoke/commit/d0584ea2973d6a7e2df589f274f28e08a100ea3f))
* include timezone among campaign fields copied ([9d1c48f](https://github.com/politics-rewired/spoke/commit/9d1c48f76c9ac1201a22532f326a4097b9e9ffc0))
* increase password reset period to 1 day ([5ab7912](https://github.com/politics-rewired/spoke/commit/5ab791213bbd9b6b049d4d347bac926cf07cb667))
* move assignment control flow to its own admin page ([c7366d2](https://github.com/politics-rewired/spoke/commit/c7366d2996d39696a72216fc1d63c68249b91656))
* move texting hours section to just after basics ([95c7752](https://github.com/politics-rewired/spoke/commit/95c77521e315302b633324df9b484e4aff5250d4))
* notify client when Spoke is out of date ([2811beb](https://github.com/politics-rewired/spoke/commit/2811beb70e7209ff69a0b325396db9ba929869a6))
* optimize search by texter ([494b891](https://github.com/politics-rewired/spoke/commit/494b89186e914fef0ed96c4bf58bb04c5e0d8a15))
* order by campaign id, not due date ([e41390a](https://github.com/politics-rewired/spoke/commit/e41390a3135a69d051ff0b15fe3468f823a6a330))
* partial todos index ([1a08628](https://github.com/politics-rewired/spoke/commit/1a08628b44d7b72107e8747d816f2b5c01ba1ba0))
* per contact messaging service types ([39baad1](https://github.com/politics-rewired/spoke/commit/39baad1e516723e780d6ff6ebab42b8177b113fc))
* refactor assignment queries to respect team_escalation_tags ([9dad5f0](https://github.com/politics-rewired/spoke/commit/9dad5f0e3bdb6b16a7678d7767ffff6f4de4808b))
* search by unassigned (null texter) ([3b15869](https://github.com/politics-rewired/spoke/commit/3b15869137c6ba7f75c2617871c9e0501eef9ec1))
* show message.created_at if exists above campaign_contact.updated_at ([741a2da](https://github.com/politics-rewired/spoke/commit/741a2da81c925e7d52e9a6b4f0a088b3315d3b73))
* show teams on campaign list ([f95c1c4](https://github.com/politics-rewired/spoke/commit/f95c1c4f849e668985cf1f3871c17323af7b103a))
* silence expected errors ([f991105](https://github.com/politics-rewired/spoke/commit/f991105e6b2645d06ede365bfca014938568efdd))
* store md5 hash of script before variable substitution ([aad419b](https://github.com/politics-rewired/spoke/commit/aad419b22cb45ef6f56001e623d446f1bfd0edf6))
* support passing knex session ([6f5df84](https://github.com/politics-rewired/spoke/commit/6f5df84d8b0d5abac3a961b5f75b7444368f3779))
* support read replicas for a few key queries ([6ea8a89](https://github.com/politics-rewired/spoke/commit/6ea8a89a6367bd873c0719df2e4b78dc58c3e626))
* support soft delete of tags view trigger and view ([105419a](https://github.com/politics-rewired/spoke/commit/105419ab9bc7ece345baea37f9c776a6c403c825))
* support team-scoped assignment complete notifications ([99ca099](https://github.com/politics-rewired/spoke/commit/99ca099ec3821d7619e61da46c96acaf93122550))
* update knex migration signatures ([cca0015](https://github.com/politics-rewired/spoke/commit/cca00156fea0a234ecca59d70ddb8911fd4bea0d))
* update mutation to take multiple teams ([6890f25](https://github.com/politics-rewired/spoke/commit/6890f25c56c53fed9ef0cb50ca9a8fe943a78b7d))
* update password reset text ([a31f400](https://github.com/politics-rewired/spoke/commit/a31f4008b561ae8e41653b3aeaf83ef51f61adba))
* update UI for new fields ([bea031f](https://github.com/politics-rewired/spoke/commit/bea031ff48255c4519119183355b6f258c118cf8))
* use case insensitive search ([f619144](https://github.com/politics-rewired/spoke/commit/f619144baabfa35ea6bde9a455738a410786de9a))
* use cte style query chains for custom escalation tags assignment path ([4ab83d6](https://github.com/politics-rewired/spoke/commit/4ab83d68827511394a4a664eab2521d758590f9c))
* **assemble-numbers:** add assemble-numbers sending service ([62b5ccd](https://github.com/politics-rewired/spoke/commit/62b5ccdc54cadf4fb8657ba61c5cb2fd1512157d))
* **auth:** limit password reset to local login ([1abd2d4](https://github.com/politics-rewired/spoke/commit/1abd2d4a9787538c5d81638f435510ff7bae6bf1))
* **export:** create export drivers for AWS and GCS ([409049c](https://github.com/politics-rewired/spoke/commit/409049c1399aae42caba6a3f3ffdabd2bcdc56b7))
* **exports:** create export driver for GCS w/ HMAC auth ([3ba3b0c](https://github.com/politics-rewired/spoke/commit/3ba3b0c6663fa588dfe71a5defadfd78d38ea2d1))
* **exports:** disable GCS with HMAC ([4c5ea89](https://github.com/politics-rewired/spoke/commit/4c5ea89365b4faf6529848bf25e5a09d5f455a02))
* **exports:** export texter information ([510df6b](https://github.com/politics-rewired/spoke/commit/510df6b789b8efd2206bcf2aec11793e79d7072b))
* **exports:** flesh out hmac signing for GCS ([fd434bf](https://github.com/politics-rewired/spoke/commit/fd434bf85f1c5b09b93f7e72f62cd303a157edb8))
* **exports:** support mulitple export drivers ([5e49d0d](https://github.com/politics-rewired/spoke/commit/5e49d0d5e31902ff22ddd6209ce58508af571ce8))
* **graphql:** add mocks only in non-production environments ([c34e8fb](https://github.com/politics-rewired/spoke/commit/c34e8fb213128e5d4fb18f251cbd740ad7c3bb8b))
* **graphql:** disable batched graphql requests ([b537608](https://github.com/politics-rewired/spoke/commit/b5376088bdfccbbd5a0d7ad024d3b1e01de40c52))
* **graphql:** restrict graphiql to non-production env ([3808a21](https://github.com/politics-rewired/spoke/commit/3808a21af322066181aab60fe22cac183ebfa921))
* **immutable-question-response:** migration ([b889d82](https://github.com/politics-rewired/spoke/commit/b889d82d664f4b44734816224cc42cea3048418a))
* **local-login:** capture login modes in enum ([27714ea](https://github.com/politics-rewired/spoke/commit/27714eaa1ae475d4a2698bf5870487f734ea842b))
* **logging:** add timestamps to log format ([6d8b8b8](https://github.com/politics-rewired/spoke/commit/6d8b8b8fe6fa8e010d491632ee0f1c6a8ee0aff9))
* **logging:** enable Rollbar the right way ([0e33448](https://github.com/politics-rewired/spoke/commit/0e3344883553b90759062a4a3ab5fad4db034844))
* **logging:** switch to connect-datadog-graphql ([4bc517d](https://github.com/politics-rewired/spoke/commit/4bc517d495f86df235038c4486e2a7ceec457615))
* **logging:** use console for client-side logging ([ef091df](https://github.com/politics-rewired/spoke/commit/ef091dfe33fc8cb830d5e091f206f2f33acc2d80))
* **logging:** use most verbose logging level in development ([5597462](https://github.com/politics-rewired/spoke/commit/5597462a97c04efe8b9c1e8c146a43f87c7e4d28))
* **logging:** use winston for server-side logging ([042bf09](https://github.com/politics-rewired/spoke/commit/042bf0937430f52d9746b67f4a068d22e035e619))
* **message-review:** allow admin sending to unassigned contact ([0431022](https://github.com/politics-rewired/spoke/commit/0431022e47d73fe3c083fb6cf14c8ab160c3d892))
* **message-sending:** add service_type column to messaging_service table ([9ab6953](https://github.com/politics-rewired/spoke/commit/9ab695380f6d5957ee98feba7ea3e15ba5f75a8b))
* **monitoring:** add healthcheck endpoint ([aa91aa5](https://github.com/politics-rewired/spoke/commit/aa91aa566efb93e8ae524ddcd3d62d0e313d32ad))
* **pg:** use reader for conversations query ([5925c0a](https://github.com/politics-rewired/spoke/commit/5925c0a695f06b4ff1c0dc6f7f7e0c5fdc84e5d2))
* **pg:** use reader pool everywhere ([f32d056](https://github.com/politics-rewired/spoke/commit/f32d056278fd8b66240663bce66a3db9bdbc0375))
* **pg:** use trx over .transacting ([ec726e6](https://github.com/politics-rewired/spoke/commit/ec726e6446ebc53e1daf26a4eade61e41360485b))
* **teams:** add Assignment Request Controls component ([d1275bf](https://github.com/politics-rewired/spoke/commit/d1275bf4d3c51541500adcf1d7c0c121af1365c6))
* **teams:** add campaign<->team association ([3be2c8e](https://github.com/politics-rewired/spoke/commit/3be2c8ea9bf9bb7e9592f7acb520e5041ea0f6dd))
* **teams:** add CrUD mutations for teams ([09908e5](https://github.com/politics-rewired/spoke/commit/09908e5058e8774431a7177d446bf7e705843de7))
* **teams:** add organization<->team association ([ac4f814](https://github.com/politics-rewired/spoke/commit/ac4f81444f99627d1ecb0a2f046210027788c23e))
* **teams:** add team resolver ([688ad29](https://github.com/politics-rewired/spoke/commit/688ad295f7f44c34626a65954f139ecb737fb628))
* **teams:** add team selection to campaign edit page ([4e35ad0](https://github.com/politics-rewired/spoke/commit/4e35ad0e5acf127181896bfe0bca5d4224718464))
* **teams:** add teams migration ([8002862](https://github.com/politics-rewired/spoke/commit/8002862c5bddf887c955b53ee3b104fdc307d146))
* **teams:** add UI for managing teams ([72e0b6e](https://github.com/politics-rewired/spoke/commit/72e0b6e0fe8afd489ea251f8f7e271c3257c78f1))
* **teams:** allow specifying teams to campaign ([ffdfb32](https://github.com/politics-rewired/spoke/commit/ffdfb3211e2b6f6271372842087f40c859fdd237))
* **teams:** clarify wording of instructions ([26b9712](https://github.com/politics-rewired/spoke/commit/26b9712a2b1e539c52e03ac79cb732c621cb4c10))
* **teams:** include type in current assignment HUD ([fc81eb3](https://github.com/politics-rewired/spoke/commit/fc81eb378ec2045de83e7f272c97fa838c174358))
* **ux:** add overdue tag to overdue campaigns ([2f07de9](https://github.com/politics-rewired/spoke/commit/2f07de92c92fcf6d3cc0cb02425dd2adcce4ff16))
* **ux:** add overdue warning to campaign edit page ([970caa4](https://github.com/politics-rewired/spoke/commit/970caa4a0de9ddadfa9c6cdec934e1f0e2ede9aa))
* **ux:** show overdue warning on stats page ([cb7261f](https://github.com/politics-rewired/spoke/commit/cb7261f54a61c3284f7dc356545988edd79c5462))
* add currentAssignmentTargets and update campaign list ui ([c2a6bdc](https://github.com/politics-rewired/spoke/commit/c2a6bdc0c379e54f7ccbc2531f24bcf91d93f004))
* allow opt-out without assignment ID ([4d83c60](https://github.com/politics-rewired/spoke/commit/4d83c605fef90bd958e8b6d767fe185c2d9de0a2))
* cron job to sync teams with slack channel memberships ([9701d1e](https://github.com/politics-rewired/spoke/commit/9701d1ebc30287c96f74eb404106adde95c20b21))
* option to apply tags without sending message ([5a93d84](https://github.com/politics-rewired/spoke/commit/5a93d8432680390f37912c3d72ac74ccfd633d27))
* upgrade assemble-numbers-client ([300b931](https://github.com/politics-rewired/spoke/commit/300b9319597fe4160d818ae3e4a68210ab57c6a3))
* use DISABLE_TEXTER_NOTIFICATIONS to disable texter notifications ([77e8f15](https://github.com/politics-rewired/spoke/commit/77e8f15c60de4d3640217d815e2c690849358a90))
* use LocalAuthError type ([2d7e0a3](https://github.com/politics-rewired/spoke/commit/2d7e0a38c818db0b8c068cc1238f67ab475d5ce9))
* **sweeping:** add previous/next conversation navigation ([def7c34](https://github.com/politics-rewired/spoke/commit/def7c3468a61371fefde07a0200065f7283dd5e9))
* **tag:** add tag management to sweeper view ([22838b9](https://github.com/politics-rewired/spoke/commit/22838b9170fde6700fd5fa3eff2b5002fce4b868))
* **tags:** add reusable TagSelector component ([ab798c0](https://github.com/politics-rewired/spoke/commit/ab798c0e45d47f967d4db4cd59112c2e516ca781))
* **tags:** handle tagConversation error ([c3b3253](https://github.com/politics-rewired/spoke/commit/c3b325316caf604ec5c362b2d789329f0a6b1b5c))
* **teams:** add member management page ([e09e43d](https://github.com/politics-rewired/spoke/commit/e09e43d968ea835283d90363ccfea7fb3ba23a1c))
* **teams:** add team member management mutations ([a5bdf82](https://github.com/politics-rewired/spoke/commit/a5bdf82a9c8a11a6b24d38ea8562bf5a02e8f46d))
* **teams:** add team root query ([c926d1a](https://github.com/politics-rewired/spoke/commit/c926d1af0725cee857631dd6b220a2e26b7a8bb0))
* **twilio:** add defensive fix for null characters in database ([2cefe70](https://github.com/politics-rewired/spoke/commit/2cefe701163f18a469d60458e322168590b716d0))
* **ux:** add overflow menu to mobile texter view ([997ee98](https://github.com/politics-rewired/spoke/commit/997ee985ad46235e73e182d9c0f0887b659cf756))
* remove text form block from settings ([8d96db6](https://github.com/politics-rewired/spoke/commit/8d96db6d38699b59340942744805d7d7a56d33f2))
* remove updated_at calls from code ([02f5e6b](https://github.com/politics-rewired/spoke/commit/02f5e6baa98d607f884d5c1ba0bd82ab34a1f2ce))
* universal trigger based updated_at ([6d4563a](https://github.com/politics-rewired/spoke/commit/6d4563add4984c6c6ab33ac553176a9023d6699f))
* use LocalAuthError type ([45f7752](https://github.com/politics-rewired/spoke/commit/45f7752d98bf0d5fd58190bf788a8d6f903e61d5))
* use myCurrentAssignmentTarget for form controls ([b33ca1f](https://github.com/politics-rewired/spoke/commit/b33ca1f711bda5e1e466e136f735832ce9240e63))
* write and use myAssignmentTarget for giveUserMoreTexts and form display decisions ([d6ac7e2](https://github.com/politics-rewired/spoke/commit/d6ac7e28b51eec565af2a36a0f7c5bc92bef5937))
* **teams:** add user<->team association ([63c7e76](https://github.com/politics-rewired/spoke/commit/63c7e76a81ee8482dd2a1dfd0cf0fe395a451012))
* **teams:** use live campaign values ([1a2c145](https://github.com/politics-rewired/spoke/commit/1a2c145b2d94f08d9f3bdf68a4b4257a0010215a))
* default assignment priority of 500 ([19e1810](https://github.com/politics-rewired/spoke/commit/19e1810ec251ad892ed67d855aa567699d1ffa27))
* open tags selector on focus ([58065b3](https://github.com/politics-rewired/spoke/commit/58065b38656f39ca5a15c27e1a2540078a9a27ea))
* persist tag state between dialog opens ([93d7f49](https://github.com/politics-rewired/spoke/commit/93d7f49590f83fa369e8c5d7769c14f1aab50ff0))
* separate out escalate tag ([6f23b78](https://github.com/politics-rewired/spoke/commit/6f23b78afa8ca3963596dc320993688db193268a))
* **config:** add config file ([3f4233a](https://github.com/politics-rewired/spoke/commit/3f4233a0a8335798c8e562178363484496087bff))
* **config:** export separate client and server config objects ([773d9b8](https://github.com/politics-rewired/spoke/commit/773d9b8a7c78fffd07b78fcd84de0ee7d3ae45c4))
* **config:** migrate knex config ([5e64d2a](https://github.com/politics-rewired/spoke/commit/5e64d2afcf85daae50dbb863d8bac024f3d3a86e))
* **config:** use envalid config everywhere ([cff9e2a](https://github.com/politics-rewired/spoke/commit/cff9e2a3b546d0adc9a384b5c20a1565e430992a))
* **config:** use envalid config for webpack ([145899f](https://github.com/politics-rewired/spoke/commit/145899f06dc49e2699a48b79c59b86ceb006c8b7))
* **exports:** allow alternate AWS endpoint ([df7b305](https://github.com/politics-rewired/spoke/commit/df7b3051d2cc456a3c0d30081b556d40aff0c426))
* **tags:** add ability to support tag colors in the future ([5f0bfd3](https://github.com/politics-rewired/spoke/commit/5f0bfd336ea405f701fc5938feb501fc094db732))
* **tags:** add additional fields ([08e7514](https://github.com/politics-rewired/spoke/commit/08e7514c8826573d587b5ebeb02c35e1579f1459))
* **tags:** add admin UI for editing tags ([eb40bef](https://github.com/politics-rewired/spoke/commit/eb40bef1ddddeedb98709f4d79179f1968bca47a))
* **tags:** add columns ([be1d1b5](https://github.com/politics-rewired/spoke/commit/be1d1b55a50f8d8da2df75572f7f8e152be1dfb0))
* **tags:** add error dialog for saveTag ([0d15163](https://github.com/politics-rewired/spoke/commit/0d151635ccc9b3a937bdab830c4bdc8cf450f824))
* **tags:** add tag management UI ([d11978f](https://github.com/politics-rewired/spoke/commit/d11978f1fe35ecad4f26b184d8a810361662b857))
* **tags:** remove separate message editing field for tags ([d61b3f3](https://github.com/politics-rewired/spoke/commit/d61b3f35f92be827353c51af34105cfcc53ed8ac))
* **tags:** switch to tagConversation mutation ([81d5c88](https://github.com/politics-rewired/spoke/commit/81d5c888ac842ae25a3f4d1f50e898911511f06c))
* **tags:** update sendMessage payload for tags ([db448f1](https://github.com/politics-rewired/spoke/commit/db448f1567f3bf1f125e3953a830cd336b6f7166))
* add ability to set organization.features.numbersApiKey via organization settings ([10594b1](https://github.com/politics-rewired/spoke/commit/10594b1f3bc926ee134eb24b1ee109ffc5c1c26a))
* add datadog support via dogstatsd ([df0c7df](https://github.com/politics-rewired/spoke/commit/df0c7dfc1fabeca41b70c5f1a6a776bde7c03dae))
* add release stage to Heroku Procfile ([bbf004e](https://github.com/politics-rewired/spoke/commit/bbf004e770ace8fe6dd457ff91c40d6f36f042ff))
* cosmetic changes for local login. ([9d44d65](https://github.com/politics-rewired/spoke/commit/9d44d650a5a6160633e722986d92315bae8129f4)), closes [MoveOnOrg/Spoke#1059](https://github.com/MoveOnOrg/Spoke/issues/1059)
* filter landlines on upload if numbersApiKey defined ([5fcb6df](https://github.com/politics-rewired/spoke/commit/5fcb6df6bf68ae37cb749a51e62aa68f0d5793f9))
* if percent is more than 100 on upload, we are filtering ([f044515](https://github.com/politics-rewired/spoke/commit/f044515c29a4d4a276152b0992fa78186a4d2876))
* implement local login ([80ba1b5](https://github.com/politics-rewired/spoke/commit/80ba1b53b8e85d0964778d214bc3d59b46a9d94e)), closes [MoveOnOrg/Spoke#658](https://github.com/MoveOnOrg/Spoke/issues/658)
* include tags as list of titles in export ([70ef3a1](https://github.com/politics-rewired/spoke/commit/70ef3a1327afc9e060db8c65981dc70080ce617f))
* lock contacts tagged with tags.is_assignable = f out of assignment ([46a54f5](https://github.com/politics-rewired/spoke/commit/46a54f5055625e4772bb0d0b20b74710ba1ac5c3))
* make incoming message review and esclated conversations review use tags ([a50721e](https://github.com/politics-rewired/spoke/commit/a50721e8582c7e213fa888005cf8a55597fd516b))
* migration script ([87d0160](https://github.com/politics-rewired/spoke/commit/87d0160149d359c5d1592939351da8aa1ff411a9))
* remove escalationUserId from resolvers ([e793bd3](https://github.com/politics-rewired/spoke/commit/e793bd33e7cb70716132396c4749be8392c2719c))
* **tags:** add GraphQL queries and mutations for tags ([ca6d0e2](https://github.com/politics-rewired/spoke/commit/ca6d0e262362b9c2b839ffcd6af63cfb5196a339))
* **tags:** add migration for tags ([ede1fba](https://github.com/politics-rewired/spoke/commit/ede1fba57b0009c3bdf6b7808b28ba0b2592b3ec))
* **tags:** create default tags during organization creation ([8e90fc8](https://github.com/politics-rewired/spoke/commit/8e90fc8aa6403da43ff5b7342156fa536d14c6ba))
* **tags:** resolve naming collision for tags properties ([1e88ef7](https://github.com/politics-rewired/spoke/commit/1e88ef7df5ecdd3f30ddbd9a1c569d5004834857))
* reject numbers api keys with * ([4cdd30a](https://github.com/politics-rewired/spoke/commit/4cdd30adea39aff7f38a779fa216e22eeb5f2a64))
* remove migration management ([d2d0659](https://github.com/politics-rewired/spoke/commit/d2d06594a22e844c14ff4628f4924bfea1dd2f62))
* support running knex from the command line ([4a3149b](https://github.com/politics-rewired/spoke/commit/4a3149b4e48fdd236fa589e666d8ac340ef3acd1))
* use knex-style database seeding ([8e15dd2](https://github.com/politics-rewired/spoke/commit/8e15dd25de0181a5f2093069b05f32b9871a6536))


### Reverts

* Revert "fix: truthy check on array" ([fb8f52a](https://github.com/politics-rewired/spoke/commit/fb8f52a5ba779533400085c138777118664df4b4))
* revert pull request [#265](https://github.com/politics-rewired/spoke/issues/265) - feat/no-mocks-in-prod ([c5ec88e](https://github.com/politics-rewired/spoke/commit/c5ec88e2fccfd6d9644c7214dc1ca9362d3aad15))
* Revert "feat: add rollbar version" ([e0420e6](https://github.com/politics-rewired/spoke/commit/e0420e668a5a22dbbd711975f3d0c73f6234b8ae))
* Revert "build(docker): include git in Docker image" ([a089447](https://github.com/politics-rewired/spoke/commit/a089447db7071b4a250e3850bb15f5debe08645a))
* Revert "fix(docker): account for git potentially being unavailable" ([ad8f516](https://github.com/politics-rewired/spoke/commit/ad8f51619ed9942ab665bb9bdf6a87ce881d2a33))
* Revert "Update Twilio TwiML usage." ([1df8e51](https://github.com/politics-rewired/spoke/commit/1df8e51a0f3ad076c4429ee905e073ed83a5dcd7))
* Revert "Sort messaging service SIDs, not the env var keys." ([241a0f7](https://github.com/politics-rewired/spoke/commit/241a0f7ca4953bb0e594b9569356012d7c03ee2d))
* Revert "Add field for specifying reply age." ([6673cf8](https://github.com/politics-rewired/spoke/commit/6673cf8c83af5db2d7d6e5736810e0ef3f363799))
* Revert "just return true for now" ([73bd991](https://github.com/politics-rewired/spoke/commit/73bd99111a8343ecddd42f4ff2219a427ef2bba4))
* Revert "Revert "Moveon main plus reassign all plus message review optout plus set message validity"" ([01f7e2e](https://github.com/politics-rewired/spoke/commit/01f7e2e9b869a79ce14fccee0cef62bb08da69fe))
* Revert "Ability to return roles from campaign.texters" ([c7713cf](https://github.com/politics-rewired/spoke/commit/c7713cf17811e87914199df65cad2e4b9895107e))
* Revert "Avoid error if no campaign is found" ([8a7aa7c](https://github.com/politics-rewired/spoke/commit/8a7aa7c4484fa10a3da95d61b334182a55114f89))
* Revert "Revert "Upgrade webpack and related deps to latest."" ([d78c9d2](https://github.com/politics-rewired/spoke/commit/d78c9d2c288869a6c67a08510bba1bd1a43c2958))
* Revert "Upgrade webpack and related deps to latest." ([7befef7](https://github.com/politics-rewired/spoke/commit/7befef7450047af6bc0080d73f1bba780f0270c4))
* Revert "Removes fixed height for message fields for smaller screens" ([2c887e5](https://github.com/politics-rewired/spoke/commit/2c887e5e3cdd81d0480d3713b4b17e39d2956a12))
* Revert "Revert "adds sqs message processing function"" ([492e89c](https://github.com/politics-rewired/spoke/commit/492e89c51747713843ab3d5933978c865b2abca9))
* Revert "dependencies" ([cefc3c9](https://github.com/politics-rewired/spoke/commit/cefc3c98125047b25d823630407d6922aae5c528))
* Revert "some ideas for how to mitigate campaign-contact QuestionResponses resolver" ([72e5be6](https://github.com/politics-rewired/spoke/commit/72e5be62ee79a7cc21e3ae7788864648345ecc86))
* Revert "A few fixes for not finding organization settings. Revert after mig." ([b2fd454](https://github.com/politics-rewired/spoke/commit/b2fd454f13517f869c2daf085af53d0d12484c46))
* Revert "One more commit to revert" ([efb2b8a](https://github.com/politics-rewired/spoke/commit/efb2b8a9cf82776e7a6ed57ae89d4a175b8ffdf6))
* Revert "Hide sections and don't use unmigrated fields yet. Revert after migration." ([07976c3](https://github.com/politics-rewired/spoke/commit/07976c3f24d98180c383eddf2c57a2fbd34fd9c9))
* Revert "Comment out making fields required. Revert after migration" ([2e8b012](https://github.com/politics-rewired/spoke/commit/2e8b0120f8f32b5aa5f9720a87169d4cbb1cd8ee))
* Revert "Commit #2 to revert post-migration" ([7020f0e](https://github.com/politics-rewired/spoke/commit/7020f0efe4cdf34927b0e61836b886f33eb7d7a4)), closes [#2](https://github.com/politics-rewired/spoke/issues/2)
* Revert "Commit for deploy - revert after migration" ([be9a62e](https://github.com/politics-rewired/spoke/commit/be9a62ea6ec4acc6a2f3b28467e5227dd8af91e2))
* Revert "Temporarily allow admin access instead of owner access -- revert after migration" ([07edbfc](https://github.com/politics-rewired/spoke/commit/07edbfca7b6560913ece057bd2d73b39ddae7da2))

## v1.4.1

_August 2018:_ Version 1.4.1

- This version fixes bugs found in 1.4 including a deployment bug.

## v1.4

This release includes many optimizations, new features and more tests! We've fixed outstanding bugs, added more administrative functionality and worked on the texter experience. We've also introduced a new testing suite and redis caching capabilities. Over the next couple months, we intend to add more testing and continue to work on scaling.

Note - we will have a new release in the next few weeks and switch to a shorter release cycle in the next few months. Please upgrade your instance and let us know if you find any bugs or have questions!

_July 2018:_ Version 1.4

- A 'Skipped Messages' section for texters to allow access to previously skipped conversations. Skipped conversations can be 'reopened' and filter back into the 'replies' view.
- A 'Message Review' board for administrators to allow message reassignment to different texters. Administrators also have the ability to see more incoming messages than previous.
- The ability to mark contacts as opted out without sending a message.
- Selenium end to end testing with Sauce Labs integration.
- Redis caching capabilities including caching user's authentication status.
- Updates to documentation for AK integration, popular queries, and email and data exporting integration.
- Bug fixes around owner, admin and superadmin permissions when attempting to text, timezone handling, permission issues on admin dashboard.
- Update to our community guidelines.

Thanks go to all our contributors for this release including:
[azuzunaga](https://github.com/azuzunaga),
[bchrobot](https://github.com/bchrobot),
[bdatkins](https://github.com/bdatkins),
[cp4r3z](https://github.com/cp4r3z),
[codygordon](https://github.com/codygordon),
[eXrump](https://github.com/eXrump),
[harpojaeger](https://github.com/harpojaeger),
[joemcl](https://github.com/joemcl),
[lperson](https://github.com/lperson),
[mathemagica](https://github.com/mathemagica),
[shakalee14](https://github.com/shakalee14),

## v1.3

Two major themes that we are focusing on this year are improving
integrations and scaling. This release begins that work with support
for MailGun notifications and Revere subscriptions. In order to scale
work-flows, we have added a new SuperVolunteer position and now allow
texters to update their own information.

Over the next couple months, we intend to integrate with more outside
systems and we will also be adding significant work
around scaling the system to support much larger volumes and participants.
We will also be continuing to add more automated tests to scale participation.
All of that is to make sure that the growing community can keep adding
enhancements yourself -- please jump in on our issues page to either
implement something or file an issue on something you want Spoke to do!

Please upgrade your instance and let us know if you encounter any issues!

_April 2018:_ Version 1.3

- A 'Past Messages' section for Texters to allow access to previous conversations before a reply comes back.
  This feature helps cases where someone accidentally clicked a button or wants to follow-up with requested information.
- Texters can update their name, email and other information from the menu.
  Admins can update texter info from the console
- A new SuperVolunteer role, which allows a non-admin to update assignments, and [some other tasks](https://github.com/MoveOnOrg/Spoke/issues/455)
- Added [MailGun support](HOWTO_HEROKU_DEPLOY.md#setting-up-mailgun)
- Frontend React tests!
- Added an action handler to automatically subscribe to a [Revere](https://reverehq.com/)
  SMS list -- see [Revere integration instructions](HOWTO_INTEGRATE_WITH_REVERE.md)
- Fixed some bugs:
  - The texter menu now has a home button
  - The zipcode table was too big to fit in a free Heroku database
  - Some login issues were fixed and documentation was improved
  - Improved contact load times for texter screen

Thanks go to all our contributors for this release including:
[ben-pr-p](https://github.com/ben-pr-p),
[harpojaeger](https://github.com/harpojaeger),
[lperson](https://github.com/lperson),
[shakalee14](https://github.com/shakalee14),
[schuyler1d](https://github.com/schuyler1d),
[zluo16](https://github.com/zluo16),
[jparkrr](https://github.com/jparkrr),
[JeremyParker](https://github.com/JeremyParker),
[hiemanshu](https://github.com/hiemanshu),
[Dayologic](https://github.com/Dayologic),
[hi0ctane](https://github.com/hi0ctane),
[sandramchung](https://github.com/sandramchung),
[sreynen](https://github.com/sreynen),
[mathemagica](https://github.com/mathemagica)

## v1.2

_January 2018:_ Version 1.2 is our second release since MoveOn has adopted Spoke. We are committed to fixing bugs, adding new features and making this project as nimble as possible. For this release, we've included changes from [GetUp](https://www.getup.org.au/), updated certain dependencies, updated Auth0 integration, added user editing capabilities for texters and admins and continued to add outside integration points with outside CRMs. Please continue to add and work on our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues). We have also switched from `master` => `main` as a new naming convention for the most stable/default branch.

We've worked on a lot, but some critical developments to highlight include:

- Adds dynamic assignment functionality for texters
- Adds user editing capabilities for texters and administrators
- Adds support for customized styling for campaigns
- Adds ActionKit integration for event sign up and documentation
- Adds support for multi-media images in outgoing texts (mms)
- Adds support for campaign script editing on live campaigns
- Moved to Prop-Types library, upgraded Webpack and other development dependencies
- Adds Code Climate test integration to monitor test coverage
- Adds opt out count for a campaign to admin dashboard stats
- Adds free Heroku deployment setup
- Adds more automated tests

Thanks go to to all our contributors for this release including: [jmcarp](https://github.com/jmcarp), [hiemanshu](https://github.com/hiemanshu), [lperson](https://github.com/lperson), [jparkrr](https://github.com/jparkrr), [jamesr2323](https://github.com/jamesr2323), [benmort](https://github.com/benmort), [ben-pr-p](https://github.com/ben-pr-p), [lady3bean](https://github.com/lady3bean), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen), [mathemagica](https://github.com/mathemagica)

## v1.1

_October 2017:_ Version 1.1 is our first release since MoveOn has been using Spoke successfully in production. We are committed to
making this an open-source project used and developed by the wider progressive tech community to advance our
political goals. Part of our work has been to make that transparent. Besides this public repository, please help
with our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues), including those marked `easy`.

But of course, we've also done some actual development work! We've fixed a ton of bugs, but here are some
highlights for this release:

- Adds a passing test framework
- Resolves many bugs related to saving and updating a Campaign for admins
- Improves the Texter interface (better reply visibility, especially on mobile) along with sending on `<Enter>`
- Adds a [Deploy to Heroku](https://github.com/MoveOnOrg/Spoke#deploy-to-heroku) button for easier first-time deployments
- Documented [how to deploy on Amazon AWS Lambda](DEPLOYING_AWS_LAMBDA.md)
- Migrated from a RethinkDB backend to a Knex.js backend (we recommend use with postgresql database)
- Improved Spoke's security

Thanks go to to all our contributors including: [anasauce](https://github.com/anasauce), [hiemanshu](https://github.com/hiemanshu), [mathemagica](https://github.com/mathemagica), [sandramchung](https://github.com/sandramchung), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen)
