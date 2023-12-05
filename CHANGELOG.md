# Changelog

## [6.1.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v6.0.1...v6.1.0) (2023-11-22)


### Features

* **actor-agent-sheet:** changes to the size of the card image and layout of the biography ([cc836b5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/cc836b55f76c97b707c9876a3a0572269500ab3e))
* **actor-sheet > skills:** added style and classes to the skills layout of the agent sheet ([6ff88e2](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6ff88e2399aea5584bf00fb557b68f33034f2a0c))
* **actor-sheet:** change the size of actor-sheet (height: 849 -&gt; 820) ([e74d2dc](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/e74d2dcfca2b8a7c04d34f23a1e1d372cc5f5977))
* **agent data:** added `goals` and `spaces` for weight system and changes biography standard data ([491886b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/491886be19cc512293c0060980836bf44a95b088))
* **item-armament-sheet:** added fieldset and legend in types and roll formula fields ([7586e71](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/7586e7159f05b576484452e736326381494bc777))
* **localization:** added translate variables of attributes abbreviations ([a745d3b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/a745d3b98c7760ce61ff0f5ed841e87b62dd7340))
* **style css/sass:** added style for skills and new util classes ([f47d69f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f47d69f2427dbf7c585f7529ed952b75207132c4))
* transparent border now is a variable ([62eca88](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/62eca88aca4ce45dfeba72b0172c2217f89935af))
* **weight system:** added weight system and style changes ([0c930b2](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/0c930b2b10f7b1a20b31abd08ee303e102be6f8e))

## [6.0.1](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v6.0.0...v6.0.1) (2023-11-14)


### Bug Fixes

* **update notes:** added 6.0.1 update notes ([d445317](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/d445317870b992affaef5c7deab532d7f4fb4d6d))

## [6.0.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v5.0.1...v6.0.0) (2023-11-14)


### ⚠ BREAKING CHANGES

* **open source acessibility:** Changing the name of the variables related to the agent form results in data loss and thus a loss of compatibility with previous forms, it will be necessary to create another one with the same data as before.

### Features

* **actor:** adaptation to English of variables ([aac017b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/aac017b51d4e4497517f96f7134c0b753f5fd7e3))
* **actor:** added skills roll variables for actually local language of system ([614016b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/614016b8db0b1e8b7424a3e4b00bd54a18f36896))
* added and deleted console logs ([02b7fa7](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/02b7fa725490bedf93c6c121f1eba9ab7591d28a))
* **agent sheet inventory:** the armaments group now has rollable hover animation on img ([804f0df](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/804f0dfddd98d53dffdc5a61e48a7b1800064856))
* **chat-message:** the document that manages the chat message log was created ([a6a2200](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/a6a2200228209997892d9ecb3783dca760b8f553))
* **config variables:** for open-source acessibility, the variables are translated for english. Added attack skills dropdown. ([f98d400](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f98d4001f5bdaa4f090e74ccc2209ba79745f4e2))
* **config:** added categories data and jsdoc descriptions (but still pending) ([2d2b0ff](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/2d2b0ffaa73922ebd0d9343e0ecd89f522f6b889))
* created the system of item macro drop inspired in DND5e System ([4ddfeaf](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4ddfeaf1870022caadca353dba7d5697655f31c5))
* **css/sass:** added styles for dialog (dialog-buttons) and buttons and spans for item card ([ae79630](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ae796309dff44216d309a71965dc8f6e33341378))
* **css/sass:** adjusts of border style and was created an hover animation for rollable items ([0477f7b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/0477f7b72ae46609a43b63573158c879fc6650e5))
* **css/sass:** styling the combat tab and weapon item specifications ([07b5ff0](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/07b5ff0b5e9ccd1a8acc8601e35f02bf89e4bb5a))
* document calling through the creation of a module inspired by the DND5e system ([a72b1b3](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/a72b1b3e0c0561692f0e2f307f97c1f770d0638b))
* **item armament sheet:** added some fields and stylizations for especifications and combat tabs ([d910248](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/d910248aee82a96b3bf7a130690b81dc64d0b856))
* **item armament sheet:** refactoring the fields and creating the specifications and combat tab ([9c9fe5e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9c9fe5eee4ce5a1465ab9bf894ab1c86fe8faba2))
* **item-card template:** the item card template for chat items was created ([baa1aa4](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/baa1aa454ddaf133b3cd8bbfced6f585dbec0c6d))
* **item-sheet:** added categories on the context variable ([f4c5caa](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f4c5caad46f591ce4a19c3e05864c9b233456a8f))
* **item-sheet:** added the `attributes` and `attackSkills` dropdown ([f3693e0](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f3693e0b697d8c5e9853095da1b42dfad1020400))
* **item:** added an chatListener, an chatCardAction Handler and gets the item information ([6b200ba](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6b200ba0f5b8e6b4399bc10cb11268bc641e0eed))
* **item:** called the respective card in chat of respective item ([f47b528](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f47b52844bb167bcd3d92bb342ea832123e8177b))
* **localization:** added translates for new specifications and combat tab for armament item type ([4ae9fd7](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4ae9fd782abeb9767d2af9ebd8a08dc1b63e4010))
* **localization:** added translates for warnings and errors of Macro System, overmore tab translate ([6c18c78](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6c18c7864df31994f781f8ed66705b0d2b0ca5a9))
* **localization:** added translations for armament conditions ([ddb68d9](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ddb68d9de5b13d6a9cf340a091b8df0699e8ca14))
* **macro.mjs:** call the method use() for usages of item ([8902603](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/89026032640a08f1e1908339744a5eeb3895e0fe))
* **message-system.mjs:** the previous updates now are viewable ([78aeb31](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/78aeb317b06fc73598febd2d2f6bd7d2be21a79b))
* **open source acessibility:** several variables were changed. To improve code accessibility ([3ad79fc](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3ad79fc6cf7525a335f33afe20e36bdfced4373f))
* **system core:** macro codes have been moved. Now module are used for documents (_partial_module) ([c5e833e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/c5e833e5668e3198a9ff4639fd2d94c64675cd46))
* **system core:** the turn lasts 6 seconds. The Order's logo is displayed. Hooks added ([b3a67e5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b3a67e56219599abd5ab35fc4ac5433c705bebf3))
* **system.json:** the minimum version changed from v10 to v11 ([5d99800](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5d99800d2196006bc5d531fc8906fdcd100b2bd3))
* **template data:** now the the standard value of critical is null string ([aa532e8](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/aa532e81f5ac2f9c26e12912c4522c31efadb4b3))
* **template.json:** added base description and biography, refactoring the formulas data ([039db29](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/039db298eb435773cc9ceef3b86192ed2846c5c6))


### Bug Fixes

* **dialog style:** the css class .adverts was a reserved word and was changed to .announcement ([0a226d6](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/0a226d6f3f924f015c135cfa5e01b48f79d588ef))
* **font awesome icon:** changed the icon for damage action ([9134ee8](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9134ee876ae377a10a64a93f32344450d963169b))
* **localization:** an inappropriate character was removed from the translation of the science skill ([b0742e4](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b0742e45dbb4d444c1191eba13828ab85065b74c))
* **update notes:** corrected version of release notes ([8c653ba](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/8c653ba751e37dfb45367773f6deb9f198455568))


### Performance Improvements

* **actor-sheet:** adaptation for efficient code reuse of form status calculation ([3a041d1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3a041d185e61f80cae14b08147166d700f48f1a6))
* **effects:** adaptations for v11 version of Foundry and style changes ([3da4692](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3da469282e6007692167205388fc0b8352e54fdd))

## [5.0.1](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v5.0.0...v5.0.1) (2023-10-31)


### Bug Fixes

* **biography and description:** fix the height of editor field ([3b9d038](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3b9d038d7142ce0013349947d5ba122f9322c457))

## [5.0.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v4.1.0...v5.0.0) (2023-10-27)


### ⚠ BREAKING CHANGES

* **refactor and item changed:** Items formerly called Powers have disappeared.

### Features

* **actor-sheet:** added the invalid item system ([1fcb796](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/1fcb7964b52eb2c30e336febba4878899e1dab2c))
* **actor-skills:** now the skills page has two columns ([be992bf](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/be992bfe4f6c19e971d1d943f7c34dc24b309d34))
* **css/scss:** changed the size of image item and adjusting the skills style ([cda490f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/cda490f3a68d92f4b848a2643b9cad23817bf383))
* **css:** added the style for item-alert (when the item is invalid for the categories) ([6669e9d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6669e9dfa12bfdb2763b92315b34919e53e975e4))
* **effects and localization:** added translates for effects ([77db14d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/77db14d233f3e96cff9c897f690f3df560e1261f))
* **fix and actor-sheet:** added the abilities system. fix of defense calculation and draggable item ([db328f9](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/db328f9d7d58c6ebad3a2e12eb559df866fcbb1b))
* **handlebars:** added the IfInequals helper for inequals comparations and fix the abilityTypeHelp ([edc0780](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/edc07806b7a8377168ba1374e843aa53fd298590))
* **item-sheet:** added the effects system on the item-sheet ([40c6b8f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/40c6b8fde2a94e0419fc59b0ef9354d613395a43))
* **item-sheet:** changed the size of window: width 350 -&gt; 380, height 480 -> 400 ([07447ef](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/07447effec38e98e5a1adeb0df47341031055f59))
* **items-sheet:** added new effect tab on items and the respective partial of handlebars ([cd9fda0](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/cd9fda0cf3b176c746e1ae89b62a3fc1a095e9ca))
* **items:** added translates variables and checkbox on rituals (studentForm and trueForm) ([38b28c1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/38b28c13a64484d64381f259b53de8a6e1838bc2))
* **localization:** added translates for item fields and changes to the Power tab, now is ability ([952bb23](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/952bb23782cd71eea682a441c1198395be3a29a8))
* **patch notes dialog:** added one sidebar for update notes and changed the text formatting ([4710fb4](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4710fb44980c72d1741357c4d24da21e4f35fd09))
* **patchnotes config:** default variable is changed: true -&gt; false ([8f7af09](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/8f7af09302bd3610812d6ed1e82ae267473606ae))
* **refactor and item changed:** changed item and Power tab to Ability. Fixes to the template ([ded9986](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ded998613e5efa2d7989e1f362cdc96262feb666))
* **scss:** added the style for item-alert (when the item is invalid for the categories) ([9f632be](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9f632be0de16e4927d990b487001560df00f5a9a))
* **style:** registered the abilityTypeHelper and the toUpperCase helpers ([7231a80](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/7231a80db97b6b28cbb15efdf2e12382870e3fb4))
* **update notes:** added the 5.0.0 update notes and delete the banner texts ([3acff92](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3acff92a4d0653493cd409fa43dcc54b61eb20ac))


### Bug Fixes

* **actor-abilities:** fix the name of abilities ([5ebae07](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5ebae075088fe4affc1634ae53eadb63502f5e2b))
* **roll formula:** fixed a bug where tokens with 0 agility would receive a null roll ([5a50c0f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5a50c0f6bd2d4f7edef479e14b4a88146809edc2))


### Performance Improvements

* **actor-agente-sheet:** delete the unnecessary css class ([9d3feca](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9d3fecaff40c4e0337ae917e8b5a5057455b23d9))

## [4.1.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v4.0.0...v4.1.0) (2023-10-23)


### Features

* **css/scss style:** setting the style of the updates window and all system items ([d84618f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/d84618f09a5253865a991ef1b966f7cc63d9e5c4))
* **handlebars:** added a helper for validate inputs (disabled or not) ([0c9f23c](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/0c9f23cafd075a020b3556071b030f7175a5ada8))
* **item-sheet:** item window size has been changed: 520 -&gt; 350 ([35d694c](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/35d694c1dce60df9824b02db6f1ddb681b369e4c))
* **style and items:** reordering the fields of items, added the styles class, validate inputs ([9cd6548](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9cd654850a57c963480bdd4062962c63f194fb11))


### Bug Fixes

* **localization:** the writing of the translation variable was incorrect ([dc64703](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/dc64703a4913992afd77e780e6a6561c5ce6d8d5))

## [4.0.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v3.1.0...v4.0.0) (2023-10-18)


### ⚠ BREAKING CHANGES

* By changing the variable name of general items, some items may no longer work, in addition, other types of excluded items may also no longer work.

### Features

* **actor and fix:** added the [@roll](https://github.com/roll)Initiative tag to generate roll formula and to use it in combat ([f3a2dd1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f3a2dd1788409cbd21877fa96fe8793cfe46e572))
* **actor-sheet and items:** the onMarkItem function was created, it manages used and unused items ([9a62b6e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9a62b6e82ab322811f50c8dc512e9d5627b159f6))
* call the displayMessages and registerSystemSettings methods in js file ([bd890fd](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/bd890fd31c430026c2d986c6dc031b34d83b45fc))
* **fix:** added some translates with HandleBars and fix the names and functions in html ([b6a692f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b6a692f43eb474b0509a090cea8663ea01c30b12))
* **item-sheet:** added new item-sheet with new tab and name, replacing the habilities ([50c66a9](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/50c66a9ca54850af55998f6cd0b96dba8ac02ea3))
* **item-sheet:** added the ritual and icons function features, moreover, added the send-chat action ([ec9fe65](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ec9fe6589adc8ed2a32aa8ca7444be835aa36c7b))
* **item:** added new item power and group for same item, moreover, created the html template ([5e562d5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5e562d58013796665201a4886c330e15119458ef))
* **localization:** add translates for ritual and power (en and pt-br) ([08e830f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/08e830f00fc845eecd8a2ed060818cbb2998861d))
* **localization:** added plural translations for item translation variables. added patchnotes in pt ([b50f11d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b50f11dc633d6cf210addd3a7424d1b30aded596))
* **patch notes:** added patch notes feature ([1fa1beb](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/1fa1beb99e3c5a3eeee37ceade358b55416bb819))


### Bug Fixes

* change the patch version of patch notes message and fix the powers group ([a65a14c](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/a65a14c9362de27bb112777ec38266e9655cec1e))
* disable the debug.hook, only useful for development ([5957453](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5957453d5d34e4d1e0ba1f25e73a5e9097c90da1))
* fix the name: data.resistence -&gt; data.resistance ([ee864fa](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ee864fa328e6a7ba0e2e538106420ebb1325ffea))
* **patch notes and message:** change the window size and fix the name version, also, added a note ([5216172](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/52161724ff6693da93c6c1b27c0af3ed0270a07e))
* **patch notes and message:** fix the html ([ea4d69f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ea4d69f5fc44a874fe36fcfb1e5fd9e05b47dc4a))
* tag name correction and deletion of useless items ([a81dc19](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/a81dc19ae96274051d8e695f7d74e6de6a5a5a2b))

## [3.1.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v3.0.0...v3.1.0) (2023-10-09)


### Features

* **actor-sheet and templates:** added, deleted and renamed some files related to templates ([c4bd784](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/c4bd784924b467c5e1fba34e518ad34db0ee9146))
* **actor-sheet:** added group type of items 'protection' and initiate a prototype of rituals group ([26545be](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/26545be13124a5c631d7e9402d784af3dd2e12ea))
* added the items for the system: ritual, armament, protection, general equipament and power ([5d0b740](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5d0b74070cb95d9a8410a1d29fa3c688355ac5cd))
* **localization:** added translates for dropdowns in portuguese brazil and base structure in EN ([cfa0d1a](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/cfa0d1a31e38ba3bf99e28d8c1451815afa2a1f4))
* **localization:** added translations for tab titles ([c130755](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/c130755ad33543f81fd7868e23e22afaeba89fc4))

## [3.0.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v2.1.0...v3.0.0) (2023-10-06)


### ⚠ BREAKING CHANGES

* **rename file:** The actor variable has been changed, this causes incompatibility with previous versions, as the template system works dynamically with the actor type.

### Features

* change the actor name: Agente -&gt; agent. delete character and npc data. added more item types ([2078c8d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/2078c8d5a856b01dc65d2cc5f99b3b2efdb70de3))
* **localization:** added translates for Actor and Item Types ([f3e7491](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f3e749191ee175c7e7e0709607974cafd247b506))
* **template:** create templates for new item types (copy of item template of boilerplate) ([96247df](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/96247df3ddbaa1106de46780c894e4d909eb8511))


### Bug Fixes

* **refactor:** fix the name of actor and change object options for Bar Brawl (visibility) ([9e3a491](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9e3a491a4c1b849325717eb52e2f5fa1f9e38dc9))


### Code Refactoring

* **rename file:** rename file because the agent is changed ([423d85b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/423d85bb12a754c51df8a8420641b6e81441e813))

## [2.1.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v2.0.0...v2.1.0) (2023-10-04)


### Features

* **compendium:** added some RollTables: create quick mission, temporary sanity effects, origins ([fc6d3e2](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/fc6d3e2fe52cadb65a27799f731158e8d92bd20b))
* **refactor:** conversion of all compedium data for JSON files and DB files. Rename the compediuns ([73f7c32](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/73f7c32d2ef5d99ff73b9ee268dd31e16897258d))
* **release-please:** include the packs folder in generating zip system of Github Actions ([d845d1d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/d845d1d7b8f88f62ed416bad414934883728b033))


### Bug Fixes

* **bug:** fix the RollTables Compendium. call other RollTables in Document instead of the Compedium ([175c98b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/175c98ba6f5b11ccca464cb60a6ff922e492c325))

## [2.0.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.12.0...v2.0.0) (2023-10-03)


### ⚠ BREAKING CHANGES

* the ID is the most important data of the system, without it nothing works, same for the mistakes

### Features

* **actor:** added the system of degrees with dynamic data ([5954062](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5954062f4beb004f83aee2beef4c060125fadfda))
* **feat and fix:** created the Handlebars Helper 'numberInputFVTT' and change ordemparanormal_fvtt ([80224b5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/80224b5151684077927626265fa999fd76918120))
* **fix:** added the dropdown of origins and changed 'ordemparanormal_fvtt' to 'ordemparanormal' ([e0e0ff0](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/e0e0ff0cd5f94d20d42e4a097d8c229c7443fb36))
* **fix:** added the following fields: pePerRound, origin, defense, dodge, displacement ([19a4202](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/19a4202fa612a5371bfcadda86509d9f35634b96))
* **localization:** added pePerRound and origins data. Translations for PTBR ([dd56150](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/dd56150118fb49d5b25fdeb8976e6f38d4b7d486))
* **system:** added some fields: PE.perRound, defense and desloc ([3c24b9d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3c24b9d0f5077a933e316eedf6cb623faba84da8))
* **system:** added the ID: ordemparanormal ([1855466](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/1855466f7809645d9b32af89214ec3b877c40bdd))


### Bug Fixes

* changed the ID of the System.json: ordemparanormal_fvtt -&gt; ordemparanormal ([411548d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/411548dbf2df698141700a41de687d6b34e4a301))


### Performance Improvements

* **feat:** added quick access variables and added degree value on the formula of roll a dice ([bd02cc8](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/bd02cc82d4069fa54b08ed109b0a9ab525eac8cc))

## [1.12.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.11.0...v1.12.0) (2023-10-02)


### Features

* **actor agente sheet:** style and added the dropdowns and PE field. Changes for formula system ([8a1820a](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/8a1820a1050f634749669dd4f393a6616ce9e043))
* **actor-sheet:** dropdowns have been added to context and class information was made dynamic ([aafe73b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/aafe73b081e517abb550f198d3e582a25166e3a4))
* **config:** added the system constants for Trilhas and Class ([492556e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/492556e9590dcb39739484a69c22cde6b10364b0))
* **localization:** added translates to Portuguese for className and classChoices ([891fe8f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/891fe8fd4ac281307da8e4408ea3c9a19f0779d4))
* **template:** added the Class and Trilha data ([fd73bee](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/fd73bee20edd46e1fa165a1845eb944cf4295cb1))
* was created the Handlebars Helper concatObjAndStr for concat multiples objects and strings ([6748f71](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6748f71a6aa63f179d50c2ab7b012c5c694bc46e))


### Performance Improvements

* **actor:** change the Loop System Attributes for prepareBaseData. Now the data is processed before ([264a272](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/264a2727a810c070ef4af553c6fd95869449ae5f))
* clean the code of console logs and use the appropriate data for save the info ([cc32a1e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/cc32a1e0f6911309fd7e679ec8aedaa8f8bbbc19))

## [1.11.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.10.4...v1.11.0) (2023-09-27)


### Features

* **release-please:** added the auto-commit for the changes on the system.json .download ([4e4ab65](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4e4ab655cefd0023b69f69d3cd7a22c9234cfd58))

## [1.10.4](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.10.3...v1.10.4) (2023-09-27)


### Bug Fixes

* **release-please:** one more attempt. added git-auto-commit-action@v4 for commit changes ([759ef2c](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/759ef2c6803125705cd08b36218769ec27a1e221))

## [1.10.3](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.10.2...v1.10.3) (2023-09-27)


### Bug Fixes

* **release-please:** one more attempt, but now using the action-set-json-field Job ([abd0458](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/abd0458bac2af6199b88f8c6151bfc8467104e3d))

## [1.10.2](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.10.1...v1.10.2) (2023-09-27)


### Bug Fixes

* **release-please:** attempt to test pretty json and change the system.json on the repo ([4f39969](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4f39969340415878bcf54dadb5c5894a56640378))

## [1.10.1](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.10.0...v1.10.1) (2023-09-27)


### Bug Fixes

* **release-please:** change the release.outputs.release_created to tag_name ([ef8cf0d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ef8cf0dad7e7d40b392b8e29487c7fc1ad88cb2c))

## [1.10.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.9.0...v1.10.0) (2023-09-27)


### Features

* **manifest:** new link of manifest more compatible of Foundry with base of DN5 System ([5a1a290](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5a1a290bd2f17d96a0ff18583b31e342ab54c50c))
* **release-please:** attempt to add automatic release download url ([b8ae9f0](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b8ae9f0cc69153687e18c1767e86b6405d784fac))


### Bug Fixes

* **localization:** delete the symbols ([7c5c440](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/7c5c440271cfe6bd204789e929623be842e03a4d))
* **release-please:** attempt to fix the 'bad substitution' ([c3f8089](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/c3f80897c39fd19bfecf57744e3ff88ad7b31dd8))
* **release-please:** attempt to fix the download link version. Set variables and refactor some jobs ([f203b26](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f203b2671c76034c8232a914ed69a8ec1c49ade5))
* **release-please:** attempt to fix the error: 'The template is not valid.' ([6f267c1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6f267c1eed7f97bc65752d15856aef9af20d3f99))

## [1.9.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.8.0...v1.9.0) (2023-09-27)


### Features

* **actor-sheet:** context consts for dropdownDegree(optionObj) and system ([e530d9a](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/e530d9ad5f4c7e5ddd816fdc71630f4816d614a3))
* added multiples constants of system: dropdown, skills, attributes and base stats ([127c69b](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/127c69bb8a3b5c40a472641d29b7620c7fbf9188))
* **agente sheet:** added select with handlebars helper to Foundry API using the selectOptions ([3ab369f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3ab369f0813fb30d6d34680bb90135e68f15abeb))
* **localization:** added translations for more skills and the degree dropdown ([b4a2db5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b4a2db5538840f779eabdb78c8fc1dbb546a5686))
* **system:** added flags for hotrealoding the html, css and json files ([c07d508](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/c07d508a0d9b0fccdfb54732cb2708c4f94393d3))
* **template.json:** data for Agente: many skills, conditions for skills, changed some values ([e51e55a](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/e51e55ac9cf6059c3561ef143eb4cc3a9b9b93d4))


### Bug Fixes

* change unnecessary declarations: let -&gt; const ([167f1c5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/167f1c56634b13469bc05cbef0a3065f5529e0e9))

## [1.8.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.7.0...v1.8.0) (2023-09-21)


### Features

* **actor-data:** adaptations for data system based on Ordem Paranormal. (PV, NEX, PE, SAN) ([963dcc0](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/963dcc024997dd8c90dd3b85a58ff04bc0c95327))
* **hooks-actor:** added the Hook preCreateActor for preset the bars and initial configurations ([4ed727d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4ed727d212ade6f8927cb1ad2879330b5b155767))
* **lang:** added more localizations for English and Portuguese-Brasil ([61f5048](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/61f504866004e0c9aec3f3448f5b7d928306b0e2))

## [1.7.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.6.0...v1.7.0) (2023-09-18)


### Features

* **actor:** system adaptations. Added the number of dice (d20) according to skill and attributes ([4a311e8](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4a311e81b9d36552b167c043f783da10b21ca6b7))


### Bug Fixes

* **release-please:** correct version ([3262e7a](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/3262e7a5284e96ee3119a3e6a8f3823d106d58e1))
* **release-please:** fix the next release (previous tag release is not detected) ([34e9348](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/34e93486de3220ed18559e8398d5f708d33abf20))

## [1.6.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/ordemparanormal-fvtt-v1.5.0...ordemparanormal-fvtt-v1.6.0) (2023-09-15)


### Features

* **manifest:** added the manifest link and download link ([cb7167d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/cb7167d385cd8b7b78e5be8e69fe2135b6a2d292))
* **release-please:** configuration for generate zip file and comments for orientation ([abc765e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/abc765ecc335e75f81c24aeb1ddc57524ddd444d))

## [1.5.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/ordemparanormal-fvtt-v1.4.0...ordemparanormal-fvtt-v1.5.0) (2023-09-15)


### Features

* **release-please:** copy the configurations for fvtt-system-rqg repository ([122b9e9](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/122b9e9cb2d59b9148b987911e8625a2f5355a8b))


### Bug Fixes

* **release-please:** update the version ([f1d8bd6](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f1d8bd691dbd22931db048f695cc20981a1f805a))

## [1.4.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.3.0...v1.4.0) (2023-09-15)


### Features

* **release-please:** attempt to add the command release-pr for create pull requests with release-p ([0551ef6](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/0551ef6fc41a2af50d7f7edec5aad5e862174a8a))


### Bug Fixes

* **release-please:** attempt to reset and trying the command manifest again ([9794046](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/9794046ace671624d4476b2b8fb04ee54878f299))
* **release-please:** correct parse json. added the version ([09bd88e](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/09bd88e554e08e4dbd02b841de03e1d3faca1596))

## [1.3.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.2.2...v1.3.0) (2023-09-15)


### Features

* **release-please:** added the code: command: manifest-pr ([36c234a](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/36c234a91b99634206d0d5f2a20280a097b11313))
* **test:** test ([00243f5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/00243f5437a9d89727d728f0e3e22bb248f2f6cc))


### Bug Fixes

* delete the command manifest ([ebd32cb](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/ebd32cb4ca47f1764498a3fc8568a258dc7da230))
* fix the correct version for 1.2.2 ([4a6f115](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/4a6f115fb26f12365c6b93072ea71540c488ec86))
* **release-please:** fix json code. packages are unnecessary because there is no package ([b772589](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/b7725895f76f3b21eee8045b0faa6d8b6a545e4a))
* **release-please:** one more attempt ([2890de1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/2890de15b062d5a5853ffe236650455e0fcd4f6d))

## [1.2.2](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.2.1...v1.2.2) (2023-09-15)


### Bug Fixes

* **release-please:** one more attempt for configure the versioning the system.json file ([7aaad3d](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/7aaad3d7c3d40721414e115e619169eadaa744a3))

## [1.2.1](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.2.0...v1.2.1) (2023-09-15)


### Bug Fixes

* **release-please:** correting the formatting and path for json file to system.json ([dd4c063](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/dd4c06355f6d9e1848a403dc3d9b02ff8bdcc857))
* **release-please:** fix the initial version for release-please ([63ab4c3](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/63ab4c324a4167a580973929ef33fcfbfaddcdf4))

## [1.2.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.1.0...v1.2.0) (2023-09-15)


### Features

* **release-please:** configuration for versioning the system.json and your initial version ([2bd1fb7](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/2bd1fb7a238798e35f3232e7d3fb080f3b2b61c2))


### Bug Fixes

* **rename:** fix the name. there should be a dot at the beginning of the file name ([8b6ba4f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/8b6ba4fc098bad6cabd7cf390a9700e6af0513fd))

## [1.1.0](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v1.0.0...v1.1.0) (2023-09-14)


### Features

* change the versions ([e28e75c](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/e28e75c94f912f86b01b2adf90bc7589076c5339))
* **release-please:** configuration changes for system.json versioning and other additional settings ([995d740](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/995d740744ee013b2b7d16468da7034c44470096))
* **release-please:** the file system.json now is added for releases ([f143919](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/f14391936606baaf0f61141941a0e048676038d9))


### Bug Fixes

* **release-please:** fixing the illegal pathing characters in path: ./system.json ([dabfe2f](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/dabfe2f5c19d0f6f63fcfd3b6cf73b9dc41b9709))

## [1.0.0-alpha](https://github.com/SouOWendel/ordemparanormal_fvtt/compare/v0.2.4-alpha...v1.0.0-alpha) (2023-09-14)


### ⚠ BREAKING CHANGES

* Changes to the system file compromise compatibility by altering the entire functioning of the system.

### Features

* **actor-data:** added the Agente actor's data ([2787fb1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/2787fb1dc64fd4459a43f939541c72e7f4d78567))
* **actor-sheet:** new template for actor Agente and your sheet ([56ca774](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/56ca7744899974d44dc1b8423ba4ae9cdbb1e049))
* **actor:** added modifications based on copy the character's sheet ([39cda45](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/39cda45cdfaffaf92fd4bf9fa05c55f55eda059f))
* added: pt-BR localization, module requirement Bar Brawl, correct path os esmodule and styles ([6ad9ace](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/6ad9ace6ab1d5e070888b241f918416f3f8eb601))
* initial boilerplate to system in FoundryVTT by Matt Smith ([5d77ad1](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/5d77ad1e44bff59ca31169fb26cf9d44459a666a))
* **localization:** added translations for skills and attributes data ([32eace5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/32eace5ac338d7c55a0fdb7b3afd2b3a6483539e))
* **release-please:** added new line to input 'extra-files', an attempt to version the system.json ([10236d5](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/10236d528d2b2063582262823ce9a91b83d05670))
* **sheets:** change the window size and adaptations for new actor Agente ([32007e9](https://github.com/SouOWendel/ordemparanormal_fvtt/commit/32007e9ce8b9ebde368c6eaae3eead6bf9e6788d))

## [0.1.0-alpha](https://github.com/SouOWendel/ordemparanormal-fvtt/compare/v0.0.3-alpha...v0.1.0-alpha) (2023-09-07)


### Features

* test commit ([e9f5ef6](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/e9f5ef6324d7a029047dae5114fd4bd89b07ebd0))

## [0.0.3-alpha](https://github.com/SouOWendel/ordemparanormal-fvtt/compare/v0.0.2-alpha...v0.0.3-alpha) (2023-09-07)


### Bug Fixes

* one word missing (test) ([bcc8e29](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/bcc8e290d96a430a57cbfc7e654c987f2a60c287))

## [0.0.2-alpha](https://github.com/SouOWendel/ordemparanormal-fvtt/compare/v1.0.0...v0.0.2-alpha) (2023-09-07)


### Features

* archive for test ([ab31893](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/ab31893391f27f525b2ec726d33a2e42c82751c9))
* initial configuration from system FoundryVTT creation ([f7aac4a](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/f7aac4a3c84f31e7de6ac8288e73c4a60367bcd2))
* system doc for FoundryVTT ([1a707f6](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/1a707f627b413a2b4f69519597640bcb37a67f0a))
* test commit ([ffe9c68](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/ffe9c6841713b8051e5ccec9a558e729f5a9a254))


### Reverts

* revert for original state ([91d190b](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/91d190b0a6947ab041c7436eca101c2690f31ff2))


### Miscellaneous Chores

* release 0.0.2-alpha ([21406f6](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/21406f67d5723b7d036d6c0726dc52588176387d))

## 0.0.1-alpha (2023-09-07)


### Features

* add a gitignore and the folder 'node_modules' ([ffd7764](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/ffd7764532fdbcef9999c478466c0263dd3da256))
* add the png for Ordem Paranormal logo ([eab2962](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/eab296208f1d870fad09d5f6f554fd6b3e3d37b8))
* added archives for ignore certain archives from prettier and eslint ([b5798ac](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/b5798ac73e53ef06da8291317f6b7f0663e84f75))
* added configuration for release please and github actions ([a27c19e](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/a27c19ee5d1ebf7c5449da032451910aede99f62))
* added possible archive for prepare commit msg from husky dependency ([4778d7b](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/4778d7b3ca8b756c055b4c5c6d55cc46a66c75df))
* added the eslint and prettier to standardize the code ([e740f63](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/e740f6303b969678b0f322da820f03de113a00f3))
* archives for npm and initial configuration for commitizen, husky and commitlint ([6115ce1](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/6115ce10448f2ab143b9e9417f25fbc2ceed4902))
* auto lint of commits with husky ([2305212](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/23052126d197726a1382a8b9273d3827e5292e56))
* initial configuration for commitizen ([f027e10](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/f027e10b618165d8254f034799d3229276f29365))
* initial configuration for commitlint ([af61bfe](https://github.com/SouOWendel/ordemparanormal-fvtt/commit/af61bfecc5863c49e840345ca925507c56d22a29))
