/* eslint-disable no-undef */
// Import document classes.
import { OrdemActor } from './documents/actor.mjs';
import { OrdemItem } from './documents/item.mjs';
// Import sheet classes.
import { OrdemActorSheet } from './sheets/actor-sheet.mjs';
import { OrdemItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { ORDEMPARANORMAL_FVTT } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
	// Add utility classes to the global game object so that they're more easily
	// accessible in global contexts.
	game.ordemparanormal_fvtt = {
		OrdemActor,
		OrdemItem,
		rollItemMacro,
	};

	// Add custom constants for configuration.
	CONFIG.ORDEMPARANORMAL_FVTT = ORDEMPARANORMAL_FVTT;

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
		formula: '1d20 + @abilities.dex.mod',
		decimals: 2,
	};

	// Define custom Document classes
	CONFIG.Actor.documentClass = OrdemActor;
	CONFIG.Item.documentClass = OrdemItem;

	// Register sheet application classes
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('ordemparanormal_fvtt', OrdemActorSheet, {
		makeDefault: true,
	});
	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('ordemparanormal_fvtt', OrdemItemSheet, {
		makeDefault: true,
	});

	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
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
	const command = `game.ordemparanormal_fvtt.rollItemMacro("${item.name}");`;
	let macro = game.macros.find(
		(m) => m.name === item.name && m.command === command,
	);
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: 'script',
			img: item.img,
			command: command,
			flags: { 'ordemparanormal_fvtt.itemMacro': true },
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
	if (actor.type === 'Agente' || actor.type === 'NPC') {
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
					ownerVisibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
					otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
				},
				bar2: {
					id: 'bar2',
					mincolor: '#000000',
					maxcolor: '#000000',
					position: 'bottom-outer',
					attribute: 'SAN',
					label: 'SAN',
					style: 'fraction',
					ownerVisibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
					otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
				},
				bar3: {
					id: 'bar3',
					mincolor: '#242899',
					maxcolor: '#66a8ff',
					position: 'bottom-outer',
					attribute: 'PE',
					label: 'PE',
					style: 'fraction',
					ownerVisibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
					otherVisibility: CONST.TOKEN_DISPLAY_MODES.NONE,
				},
			},
		});
	}
});