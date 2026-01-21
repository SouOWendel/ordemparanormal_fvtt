/**
 * The Paranormal Order game system for Foundry Virtual Tabletop
 * Author: SouOWendel
 * Software License: CC BY-NC-SA 4.0
 * Repository: https://github.com/SouOWendel/ordemparanormal_fvtt
 * Issue Tracker: https://github.com/SouOWendel/ordemparanormal_fvtt/issues
 */

/* eslint-disable no-undef */
// Import document classes.
import { OrdemActor } from './documents/actor.mjs';
import { OrdemItem } from './documents/item.mjs';
// Import sheet classes.
import { OrdemActorSheet } from './sheets/actor-sheet.mjs';
import { OrdemItemSheet } from './sheets/item-sheet.mjs';
import { OrdemThreatSheet } from './sheets/threat-sheet.mjs';

import { op } from './helpers/config.mjs';
import displayMessages from './components/message-system.mjs';
import registerSystemSettings from './settings/settings.mjs';
import { registerSystemKeybindings } from './settings/settings.mjs';

import * as documents from './documents/_partial_module.mjs';
import * as dice from './dice/_module.mjs';
import * as migrations from './migrations.mjs';
import * as hooks from './hooks.mjs';

import * as utils from './utils.mjs';

// import { rescueAllPathEffects } from '../utils/__test__/effects.mjs';

globalThis.ordemparanormal = {
	documents,
	dice,
};

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
	CONFIG.debug.hooks = false;
	// Add utility classes to the global game object so that they're more easily
	// accessible in global contexts.
	game.ordemparanormal = {
		OrdemActor,
		OrdemItem,
		dice
	};

	CONFIG.op = op; 
	CONFIG.ActiveEffect.legacyTransferral = false;
	// Define custom Document classes
	CONFIG.Actor.documentClass = OrdemActor;
	CONFIG.Item.documentClass = OrdemItem;
	CONFIG.ChatMessage.documentClass = documents.ChatMessageOP;
	CONFIG.time.roundTime = 6; // Pg. 169 of the Book
	CONFIG.Dice.D20Die = dice.D20Die;
	CONFIG.Dice.BasicRoll = dice.BasicRoll;
	CONFIG.Dice.D20Roll = dice.D20Roll;

	// Register Roll Extensions
	CONFIG.Dice.rolls = [dice.BasicRoll, dice.D20Roll];

	CONFIG.Combat.initiative = {
		formula: '@rollInitiative',
		decimals: 2,
	};

	// Register sheet application classes
	const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
	DocumentSheetConfig.unregisterSheet(Actor, 'core', foundry.appv1.sheets.ActorSheet);
	DocumentSheetConfig.registerSheet(Actor, 'ordemparanormal', OrdemActorSheet, {
		types: ['agent'],
		makeDefault: true
	});
	DocumentSheetConfig.registerSheet(Actor, 'ordemparanormal', OrdemThreatSheet, {
		types: ['threat'],
		makeDefault: true
	});

	DocumentSheetConfig.unregisterSheet(Item, 'core', foundry.appv1.sheets.ItemSheet);
	DocumentSheetConfig.registerSheet(Item, 'ordemparanormal', OrdemItemSheet, {
		makeDefault: true
	});
	// Configure Fonts
	_configureFonts();

	// Register System Settings in Other File
	registerSystemSettings();
	registerSystemKeybindings();
	utils.preloadHandlebarsTemplates();

	// Change the logo of Foundry for Ordem Paranormal logo.
	if (navigator.onLine) $('#logo').attr('src', 'https://i.imgur.com/TTrDGM4.png');
});

Hooks.once('ready', function () {
	// Display welcome messages, reports and release notes.
	displayMessages();

	// Determine whether a system migration is required and feasible
	if ( !game.user.isGM ) return;
	const cv = game.settings.get('ordemparanormal', 'systemMigrationVersion') || game.world.flags.ordemparanormal?.version;;
	const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
	if ( !cv && totalDocuments === 0 ) return game.settings.set('ordemparanormal', 'systemMigrationVersion', game.system.version);
	// When the flag is greater than the current migration version, the migration is perfomed.
	console.log('Verificando a necessidade de migração...');
	console.log(cv, game.system.flags.needsMigrationVersion, !foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv));
	if ( cv && !foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv) ) {
		console.log('Migração não é necessária.');
		return;
	};
	console.log('Iniciando a migração de dados!');

	// Determine whether a system migration is required and feasible
	migrations.migrateWorld();
});

/**
 * Configure additional system fonts.
 */
function _configureFonts() {
	Object.assign(CONFIG.fontDefinitions, {
		'Warnock Pro': {
			editor: true,
			fonts: [
				{
					urls: ['systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-Regular.otf'],
				},
				{
					urls: ['systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-Semibold.otf'],
					weight: 'semibold',
				},
				{
					urls: ['systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-SemiboldItSubh.otf'],
					style: 'italic',
				},
				{
					urls: ['systems/ordemparanormal/media/fonts/warnock-pro/WarnockPro-SemiboldIt.otf'],
					weight: 'bold',
					style: 'italic',
				},
			],
		},
		'Optima Nova LT PRO': {
			editor: true,
			fonts: [
				{
					urls: ['systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProRegular.otf'],
				},
				{
					urls: ['systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProBold.otf'],
					weight: 'bold',
				},
				{
					urls: ['systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProItalic.otf'],
					style: 'italic',
				},
				{
					urls: ['systems/ordemparanormal/media/fonts/optima-nova-lt-pro/OptimaNovaLTProBoldItalic.otf'],
					weight: 'bold',
					style: 'italic',
				},
			],
		},
	});
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function () {
	let outStr = '';
	for (const arg in arguments) {
		if (typeof arguments[arg] != 'object') {
			outStr += arguments[arg];
		}
	}
	return outStr;
});

Handlebars.registerHelper('concatObjAndStr', function () {
	const option = arguments[arguments.length - 1];
	const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
	console.log('OP FVTT | ' + option.name + ' - Argumentos: ' + args);
	let objects = {};
	for (const arg in args) {
		if (typeof arguments[arg] == 'object' || typeof arguments[arg] == 'string') {
			if (arg == 0) {
				objects = arguments[arg];
			} else {
				objects = objects[arguments[arg]];
			}
			console.log('OP FVTT | ' + option.name + ' - Tipo final: ' + typeof objects);
		}
	}
	return objects;
});

Handlebars.registerHelper('numberInputFVTT', function (value, options) {
	const properties = [];
	for (const k of ['class', 'name', 'placeholder', 'min', 'max']) {
		if (k in options.hash) properties.push(`${k}="${options.hash[k]}"`);
	}
	const step = options.hash.step ?? 'any';
	properties.unshift(`step="${step}"`);

	// Disabled = True or False
	if (options.hash.disabled === true) properties.push('disabled');

	let safe = Number.isNumeric(value) ? Number(value) : '';
	if (Number.isNumeric(step) && typeof safe === 'number') {
		safe = safe.toNearest(Number(step));
	}
	return new Handlebars.SafeString(`<input type="number" value="${safe}" ${properties.join(' ')}>`);
});

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
	// eslint-disable-next-line no-invalid-this
	return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifInequals', function (arg1, arg2, options) {
	// eslint-disable-next-line no-invalid-this
	return arg1 != arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('abilityTypeHelper', function (arg) {
	if (arg == 1) return 'origin';
	else if (arg == 2) return 'class';
	else if (arg == 3) return 'path';
	else if (arg == 4) return 'paranormal';
	else if (arg == 5) return 'ability';
});

Handlebars.registerHelper('inputValid', function (arg1, arg2) {
	return arg1 != arg2 && 'disabled';
});

Handlebars.registerHelper('toLowerCase', function (str) {
	return str.toLowerCase();
});

Handlebars.registerHelper('toUpperCase', function (str) {
	return str.toUpperCase();
});

/**
 * Custom radioBoxes helper that properly handles numeric values
 * @param {string} name - The name attribute for the radio inputs
 * @param {Object} choices - Object with key-value pairs for the radio options
 * @param {Object} options - Handlebars options object containing hash parameters
 * @returns {Handlebars.SafeString} HTML string of radio inputs
 */
Handlebars.registerHelper('radioBoxes', function (name, choices, options) {
	const hash = options.hash || {};
	const checked = hash.checked;
	
	let html = '';
	for (const [key, label] of Object.entries(choices)) {
		// Compare both as strings and as their original types to handle number/string mismatches
		const isChecked = (checked == key) || (String(checked) === String(key));
		const checkedAttr = isChecked ? 'checked' : '';
		
		html += `<label class="radio-label">
			<input type="radio" name="${name}" value="${key}" ${checkedAttr}>
			<span>${label}</span>
		</label>`;
	}
	
	return new Handlebars.SafeString(html);
});

/* -------------------------------------------- */
/*  Ready Hooks                                  */
/* -------------------------------------------- */

// Hook for create a macro on drop items or effects in hotbar.
Hooks.once('ready', function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on('hotbarDrop', (bar, data, slot) => {
		if (['Item', 'ActiveEffect'].includes(data.type)) {
			documents.macro.createOPMacro(data, slot);
			return false;
		}
	});
});

Hooks.on('renderChatLog', (app, html, data) => OrdemItem.chatListeners(html));
Hooks.on('renderChatPopout', (app, html, data) => OrdemItem.chatListeners(html));
// Hooks.on('renderChatMessage', (app, html, data) => OrdemItem.chatListeners(html));

/* -------------------------------------------- */

// Load hooks
hooks.default();
