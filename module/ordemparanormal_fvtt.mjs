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
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { ordemparanormal } from './helpers/config.mjs';
import displayMessages from './components/message-system.mjs';
import registerSystemSettings from './components/settings.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
	CONFIG.debug.hooks = false;
	// Add utility classes to the global game object so that they're more easily
	// accessible in global contexts.
	game.ordemparanormal = {
		OrdemActor,
		OrdemItem,
		rollItemMacro,
	};

	// Add custom constants for configuration.
	CONFIG.ordemparanormal = ordemparanormal;

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */

	CONFIG.Combat.initiative = {
		formula: '@rollInitiative',
		decimals: 2,
	};

	// Define custom Document classes
	CONFIG.Actor.documentClass = OrdemActor;
	CONFIG.Item.documentClass = OrdemItem;

	// Register sheet application classes
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('ordemparanormal', OrdemActorSheet, {
		makeDefault: true,
	});
	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('ordemparanormal', OrdemItemSheet, {
		makeDefault: true,
	});

	// Register System Settings in Other File
	registerSystemSettings();

	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
});

Hooks.once('ready', function () {

	// ui.notifications.info('This is an info message');
	// ui.notifications.warn('This is a warning message');
	// ui.notifications.error('This is an error message');
	// ui.notifications.info('This is a 4th message which will not be shown until the first info message is done');

	displayMessages();
});

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
	
	const option = arguments[arguments.length-1];
	const args = Array.prototype.slice.call(arguments, 0,arguments.length-1);
	console.log('OP FVTT | ' + option.name + ' - Argumentos: ' + args);

	let objects = {};
	for (const arg in args) {
		if (typeof arguments[arg] == 'object' || typeof arguments[arg] == 'string') {
			// console.log('Args: ' + typeof arguments[arg]);
			// console.log('loop: ' + arg);
			if (arg == 0) {
				objects = arguments[arg];
			} else {
				objects = objects[arguments[arg]];
			}
			console.log('OP FVTT | ' + option.name + ' - Tipo final: ' +  typeof objects);
		}
	}
	return objects;

	// console.log('Trilha: ' + arguments[0]);
	// console.log('Classe: ' + arguments[1]);

	// const trilha = arguments[0];
	// const classe = arguments[1];

	// return trilha[classe];
});

Handlebars.registerHelper('numberInputFVTT', function (value, options) {
	const properties = [];
	for ( const k of ['class', 'name', 'placeholder', 'min', 'max'] ) {
		if ( k in options.hash ) properties.push(`${k}="${options.hash[k]}"`);
	}
	const step = options.hash.step ?? 'any';
	properties.unshift(`step="${step}"`);

	// Disabled = True or False
	if ( options.hash.disabled === true ) properties.push('disabled'); 

	let safe = Number.isNumeric(value) ? Number(value) : '';
	if ( Number.isNumeric(step) && (typeof safe === 'number') ) {
		safe = safe.toNearest(Number(step));
	}
	return new Handlebars.SafeString(`<input type="number" value="${safe}" ${properties.join(' ')}>`);
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
	// eslint-disable-next-line no-invalid-this
	return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('inputValid', function(arg1, arg2) {
	return (arg1 != arg2) && 'disabled';
});

Handlebars.registerHelper('toLowerCase', function (str) {
	return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
	if (data.type !== 'Item') return;
	if (!('data' in data))
		return ui.notifications.warn(
			'You can only create macro buttons for owned Items',
		);
	const item = data.data;

	// Create the macro command
	const command = `game.ordemparanormal.rollItemMacro("${item.name}");`;
	let macro = game.macros.find(
		(m) => m.name === item.name && m.command === command,
	);
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: 'script',
			img: item.img,
			command: command,
			flags: { 'ordemparanormal.itemMacro': true },
		});
	}
	game.user.assignHotbarMacro(macro, slot);
	return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
	const speaker = ChatMessage.getSpeaker();
	let actor;
	if (speaker.token) actor = game.actors.tokens[speaker.token];
	if (!actor) actor = game.actors.get(speaker.actor);
	const item = actor ? actor.items.find((i) => i.name === itemName) : null;
	if (!item)
		return ui.notifications.warn(
			`Your controlled Actor does not have an item named ${itemName}`,
		);

	// Trigger the item roll
	return item.roll();
}

/**
 * Criando o Hook preCreateActor para o módulo Bar Brawl adicionar
 * uma terceira barra nos tokens criados, essa barra ira representar
 * uns dos atributos bases dos personagens — os pontos de esforço.
 * Bar Brawl Gitlab: https://gitlab.com/woodentavern/foundryvtt-bar-brawl
 */
Hooks.on('preCreateActor', function (actor, data) {
	// Filtrando por tipos de Actors disponíveis no sistema.
	if (actor.type === 'agent') {
		const prototypeToken = { disposition: 1, actorLink: true }; // Set disposition to "Friendly"
		actor.updateSource({ prototypeToken });

		/**
		 * Adicionando configurações para todas as barras.
		 * Criando uma barra extra com o módulo Bar Brawl (configuração para os Pontos de PE)
		 */
		actor.updateSource({
			'prototypeToken.flags.barbrawl.resourceBars': {
				bar1: {
					id: 'bar1',
					mincolor: '#ff1a1a',
					maxcolor: '#80ff00',
					position: 'bottom-outer',
					attribute: 'PV',
					label: 'PV',
					style: 'fraction',
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
				},
				bar2: {
					id: 'bar2',
					mincolor: '#000000',
					maxcolor: '#000000',
					position: 'bottom-outer',
					attribute: 'SAN',
					label: 'SAN',
					style: 'fraction',
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
				},
				bar3: {
					id: 'bar3',
					mincolor: '#242899',
					maxcolor: '#66a8ff',
					position: 'bottom-outer',
					attribute: 'PE',
					label: 'PE',
					style: 'fraction',
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
				},
			},
		});
	}
});