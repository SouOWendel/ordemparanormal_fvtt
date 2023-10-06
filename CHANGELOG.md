# Changelog

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
