// Some codes are from DND5e repository.
// https://github.com/foundryvtt/dnd5e/blob/3e9da363d92825175df22c319074274870d10309/utils/packs.mjs

import fs from 'fs';
import logger from 'fancy-log';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';

const config = { log: true, documentType: 'Items' };
const abilitiesPath = './packs/src/ptBR/items/abilities';
const armamentsPath = './packs/src/ptBR/items/armaments';
const protectionsPath = './packs/src/ptBR/items/protections';
const tablesPath = './packs/src/ptBR/tables';
const generalPath = './packs/src/ptBR/items/generalEquipment';
const mapsPath = './packs/src/ptBR/maps';
const journalPath = './packs/src/ptBR/journal';

/**
 * Folder where the compiled compendium packs should be located.
 * @type {string}
 */
const PACK_DEST = 'packs';

/**
 * Folder where source JSON files should be located.
 * @type {string}
 */
const PACK_SRC = 'packs/_source';


// eslint-disable-next-line
const argv = yargs(hideBin(process.argv))
	.command(packageCommand())
	.help().alias('help', 'h')
	.argv;

// eslint-disable-next-line
function packageCommand() {
	return {
		command: 'package [action] [pack] [entry]',
		describe: 'Manage packages',
		builder: yargs => {
			yargs.positional('action', {
				describe: 'The action to perform.',
				type: 'string',
				choices: ['unpack', 'pack']
			});
			yargs.positional('pack', {
				describe: 'Name of the pack upon which to work.',
				type: 'string'
			});
			yargs.positional('entry', {
				describe: 'Name of any entry within a pack upon which to work. Only applicable to extract & clean commands.',
				type: 'string'
			});
		},
		handler: async argv => {
			const { action, pack, entry } = argv;
			switch ( action ) {
			case 'pack':
				return await compilePacks(pack);
			case 'unpack':
				return await extractPacks(pack, entry);
			}
		}
	};
}

/* ----------------------------------------- */
/*  Compile Packs                            */
/* ----------------------------------------- */

/**
 * Compile the source JSON files into compendium packs.
 * @param {string} [packName]       Name of pack to compile. If none provided, all packs will be packed.
 *
 * - `npm run build:db` - Compile all JSON files into their LevelDB files.
 * - `npm run build:db -- classes` - Only compile the specified pack.
 */
async function compilePacks(packName) {
	// Determine which source folders to process
	const folders = fs.readdirSync(PACK_SRC, { withFileTypes: true }).filter(file =>
		file.isDirectory() && ( !packName || (packName === file.name) )
	);

	for ( const folder of folders ) {
		const src = path.join(PACK_SRC, folder.name);
		const dest = path.join(PACK_DEST, folder.name);
		logger.info(`Compiling pack ${folder.name}`);
		await compilePack(src, dest, { recursive: true, log: true });
	}
}

/* ----------------------------------------- */
/*  Extract Packs                            */
/* ----------------------------------------- */

/**
 * Extract the contents of compendium packs to JSON files.
 * @param {string} [packName]       Name of pack to extract. If none provided, all packs will be unpacked.
 * @param {string} [entryName]      Name of a specific entry to extract.
 *
 * - `npm build:json - Extract all compendium LevelDB files into JSON files.
 * - `npm build:json -- classes` - Only extract the contents of the specified compendium.
 * - `npm build:json -- classes Barbarian` - Only extract a single item from the specified compendium.
 */
async function extractPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();

	// Load system.json.
	const system = JSON.parse(fs.readFileSync('./system.json', { encoding: 'utf8' }));

	// Determine which source packs to process.
	const packs = system.packs.filter(p => !packName || p.name === packName);

	for ( const packInfo of packs ) {
		const dest = path.join(PACK_SRC, packInfo.name);
		logger.info(`Extracting pack ${packInfo.name}`);

		const folders = {};
		const containers = {};
		await extractPack(packInfo.path, dest, {
			log: false, transformEntry: e => {
				if ( e._key.startsWith('!folders') ) folders[e._id] = { name: slugify(e.name), folder: e.folder };
				else if ( e.type === 'container' ) containers[e._id] = {
					name: slugify(e.name), container: e.system?.container, folder: e.folder
				};
				return false;
			}
		});
		const buildPath = (collection, entry, parentKey) => {
			let parent = collection[entry[parentKey]];
			entry.path = entry.name;
			while ( parent ) {
				entry.path = path.join(parent.name, entry.path);
				parent = collection[parent[parentKey]];
			}
		};
		Object.values(folders).forEach(f => buildPath(folders, f, 'folder'));
		Object.values(containers).forEach(c => {
			buildPath(containers, c, 'container');
			const folder = folders[c.folder];
			if ( folder ) c.path = path.join(folder.path, c.path);
		});

		await extractPack(packInfo.path, dest, {
			log: true, transformEntry: entry => {
				if ( entryName && (entryName !== entry.name.toLowerCase()) ) return false;
			}, transformName: entry => {
				if ( entry._id in folders ) return path.join(folders[entry._id].path, '_folder.json');
				if ( entry._id in containers ) return path.join(containers[entry._id].path, '_container.json');
				const outputName = slugify(entry.name);
				const parent = containers[entry.system?.container] ?? folders[entry.folder];
				return path.join(parent?.path ?? '', `${outputName}.json`);
			}
		});
	}
}


/**
 * Standardize name format.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
	return name.toLowerCase().replace('\'', '').replace(/[^a-z0-9]+/gi, ' ').trim().replace(/\s+|-{2,}/g, '-');
}

/**
 * Legacy function to extract a LevelDB compendium pack.
 */
export async function legacyExtractPack() {
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
}


/**
 *  Legacy function to compile a LevelDB compendium pack.
 */ 
export async function legacyCompilePacks() {
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
}
