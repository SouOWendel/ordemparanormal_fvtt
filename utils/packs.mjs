import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';

const config = { log: true, documentType: 'Items' };
const abilitiesPath = './packs/src/ptBR/items/abilities';
const armamentsPath = './packs/src/ptBR/items/armaments';
const protectionsPath = './packs/src/ptBR/items/protections';
const tablesPath = './packs/src/ptBR/tables';
const generalPath = './packs/src/ptBR/items/generalEquipment';
const mapsPath = './packs/src/ptBR/maps';
const journalPath = './packs/src/ptBR/journal';

// Extract a LevelDB compendium pack.
await extractPack('./packs/compiled/items/armaments', armamentsPath, config);
await extractPack('./packs/compiled/createMissionPTBR', tablesPath + '/createMissionPTBR', config);
await extractPack('./packs/compiled/generalPTBR', tablesPath + '/generalPTBR', config);
await extractPack('./packs/compiled/documentation', journalPath + '/documentation', config);
await extractPack('./packs/compiled/items/general', generalPath, config);
await extractPack('./packs/compiled/maps', mapsPath, config);
await extractPack('./packs/compiled/items/protections', protectionsPath, config);
await extractPack('./packs/compiled/items/abilities/fighterAbilities', abilitiesPath + '/fighterAbilities', config);
await extractPack('./packs/compiled/items/abilities/occultistAbilities', abilitiesPath + '/occultistAbilities', config);
await extractPack(
	'./packs/compiled/items/abilities/specialistAbilities',
	abilitiesPath + '/specialistAbilities',
	config
);
await extractPack('./packs/compiled/items/abilities/originAbilities', abilitiesPath + '/originAbilities', config);
await extractPack(
	'./packs/compiled/items/abilities/paranormalAbilities',
	abilitiesPath + '/paranormalAbilities',
	config
);
await extractPack('./packs/compiled/items/abilities/pathFighter', abilitiesPath + '/pathFighter', config);
await extractPack('./packs/compiled/items/abilities/pathOccultist', abilitiesPath + '/pathOccultist', config);
await extractPack('./packs/compiled/items/abilities/pathSpecialist', abilitiesPath + '/pathSpecialist', config);

// Compile a LevelDB compendium pack.
await compilePack(armamentsPath, './packs/compiled/items/armaments');
await compilePack(tablesPath + '/createMissionPTBR', './packs/compiled/tables/createMissionPTBR');
await compilePack(tablesPath + '/generalPTBR', './packs/compiled/tables/generalPTBR');
await compilePack(journalPath + '/documentation', './packs/compiled/journal/documentation');
await compilePack(generalPath, './packs/compiled/items/general');
await compilePack(mapsPath, './packs/compiled/maps');
await compilePack(protectionsPath, './packs/compiled/items/protections');

await compilePack(abilitiesPath + '/fighterAbilities', './packs/compiled/items/abilities/fighterAbilities');
await compilePack(abilitiesPath + '/occultistAbilities', './packs/compiled/items/abilities/occultistAbilities');
await compilePack(abilitiesPath + '/specialistAbilities', './packs/compiled/items/abilities/specialistAbilities');
await compilePack(abilitiesPath + '/originAbilities', './packs/compiled/items/abilities/originAbilities');
await compilePack(abilitiesPath + '/paranormalAbilities', './packs/compiled/items/abilities/paranormalAbilities');
await compilePack(abilitiesPath + '/pathFighter', './packs/compiled/items/abilities/pathFighter');
await compilePack(abilitiesPath + '/pathOccultist', './packs/compiled/items/abilities/pathOccultist');
await compilePack(abilitiesPath + '/pathSpecialist', './packs/compiled/items/abilities/pathSpecialist');
