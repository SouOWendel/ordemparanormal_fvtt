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
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { ordemparanormal } from './helpers/config.mjs';
import displayMessages from './components/message-system.mjs';
import registerSystemSettings from './components/settings.mjs';

import * as documents from './documents/_partial_module.mjs';
import * as dice from './dice/_module.mjs';
// import { rescueAllPathEffects } from '../utils/__test__/effects.mjs';

globalThis.ordemparanormal = {
	documents,
	dice,
};

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
		// rollItemMacro,
	};

	// Pg. 169 of the Book
	CONFIG.time.roundTime = 6;

	// Add custom constants for configuration.
	CONFIG.ordemparanormal = ordemparanormal;

	CONFIG.Dice.rolls[0].CHAT_TEMPLATE = 'systems/ordemparanormal/templates/dice/roll.html';

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

	// Active Effects are never copied to the Actor,
	// but will still apply to the Actor from within the Item
	// if the transfer property on the Active Effect is true.
	CONFIG.ActiveEffect.legacyTransferral = false;

	// Register sheet application classes
	Actors.unregisterSheet('core', ActorSheet);
	Items.unregisterSheet('core', ItemSheet);
	Actors.registerSheet('ordemparanormal', OrdemActorSheet, { types: ['agent'], makeDefault: true });
	Actors.registerSheet('ordemparanormal', OrdemThreatSheet, { types: ['threat'], makeDefault: true });
	Items.registerSheet('ordemparanormal', OrdemItemSheet, { makeDefault: true });

	// Configure Fonts
	_configureFonts();

	// Register System Settings in Other File
	registerSystemSettings();

	// TODO: arranjar uma maneira de atualizar ou excluir atores antigos.
	// console.log(game.data.actors[0]);
	// game.data.actors[0].updateSource({'type': 'agent'});
	// console.log(game.data.actors[0]);

	// Change the logo of Foundry for Ordem Paranormal logo.
	if (navigator.onLine) $('#logo').attr('src', 'https://i.imgur.com/TTrDGM4.png');

	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
	// ui.notifications.info('This is an info message');
	// ui.notifications.warn('This is a warning message');
	// ui.notifications.error('This is an error message');
	// ui.notifications.info('This is a 4th message which will not be shown until the first info message is done');

	// const newHyperItem = await rescueAllPathEffects();
	// console.log(newHyperItem);
	// let hyperItem = game.items.find((a) => a._id == '6nBQeTcS9Wjoe2jz');
	// console.log(hyperItem);
	// hyperItem = hyperItem.effects.find(
	// 	(b) => b._id == '1FjRxjs6rOVuQtPG',
	// ).changes;
	// console.log(hyperItem);

	// const objChangeData = [];
	// for (const data of newHyperItem.numb) {
	// 	objChangeData.push({ key: data, mode: 2, priority: null, value: '1' });
	// }
	// for (const data of newHyperItem.str) {
	// 	objChangeData.push({ key: data, mode: 2, priority: null, value: 'abc' });
	// }

	// await Item.get('6nBQeTcS9Wjoe2jz').updateEmbeddedDocuments('ActiveEffect', [
	// 	{ _id: '1FjRxjs6rOVuQtPG', changes: objChangeData },
	// ]);
	displayMessages();
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
	if (arg == 1) return 'class';
	else if (arg == 2) return 'path';
	else if (arg == 3) return 'paranormal';
	else if (arg == 4) return 'ability';
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

Hooks.on('renderChatMessage', documents.chat.onRenderChatMessage);

Hooks.on('renderChatLog', (app, html, data) => OrdemItem.chatListeners(html));
Hooks.on('renderChatPopout', (app, html, data) => OrdemItem.chatListeners(html));

/**
 * Criando o Hook preCreateActor para o módulo Bar Brawl adicionar
 * uma terceira barra nos tokens criados, essa barra ira representar
 * uns dos atributos bases dos personagens — os pontos de esforço.
 * Bar Brawl Gitlab: https://gitlab.com/woodentavern/foundryvtt-bar-brawl
 */
Hooks.on('preCreateActor', function (actor, data) {
	if (actor.type === 'threat') {
		const prototypeToken = { disposition: -1, actorLink: false };
		actor.updateSource({ prototypeToken }); // Set disposition to "Hostile"
		actor.updateSource({
			'prototypeToken.flags.barbrawl.resourceBars': {
				'threatHPBar': {
					id: 'threatHPBar',
					mincolor: '#ff1a1a',
					maxcolor: '#80ff00',
					position: 'bottom-outer',
					attribute: 'attributes.hp',
					label: 'Pontos de Vida',
					style: 'fraction',
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
				},
			},
		});
	}

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
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
				},
				bar2: {
					id: 'bar2',
					mincolor: '#000000',
					maxcolor: '#000000',
					position: 'bottom-outer',
					attribute: 'SAN',
					label: 'SAN',
					style: 'fraction',
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
				},
				bar3: {
					id: 'bar3',
					mincolor: '#242899',
					maxcolor: '#66a8ff',
					position: 'bottom-outer',
					attribute: 'PE',
					label: 'PE',
					style: 'fraction',
					visibility: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
				},
			},
		});
	}
});

Hooks.on('renderSettings', async (app, [html]) => {
	const details = html.querySelector('#game-details');
	const pip = details.querySelector('.system-info .update');
	details.querySelector('.system').remove();

	const heading = document.createElement('div');
	heading.classList.add('op', 'sidebar-heading');
	heading.innerHTML = `
    <h2>${game.i18n.localize('WORLD.GameSystem')}</h2>
    <ul class="links">
      <li>
        <a class="credits" href="javascript:void(0)" target="_blank">
				${game.i18n.localize('ordemparanormal.Credits')}</a>
      </li>
      <li>
        <a href="https://discord.gg/G8AwJwJXa5" target="_blank">
          ${game.i18n.localize('ordemparanormal.Discord')}
        </a>
      </li>
			<li>
        <a href="href="javascript:void(0)" target="_blank" data-tooltip="ordemparanormal.soon">
          ${game.i18n.localize('ordemparanormal.Wiki')}
        </a>
      </li>
    </ul>
  `;
	details.insertAdjacentElement('afterend', heading);

	const badge = document.createElement('div');
	badge.classList.add('op', 'system-badge');
	badge.innerHTML = `
    <img src="systems/ordemparanormal/media/op-logo.png" 
		data-tooltip="${game.i18n.localize('ordemparanormal.op')}" alt="${game.system.title}">
    <span class="system-info">${game.i18n.localize('ordemparanormal.sidebar.updateNotes')} 
		<strong>${game.system.version}</strong> </span>
		<p><span class="system-info" data-tooltip="${game.i18n.localize('ordemparanormal.sidebar.discord')}">
		<i class="fa-brands fa-discord"></i> souowendel</span>&nbsp;&nbsp;
		<a href="https://twitter.com/EuSouOWendel" target="_blank" 
		data-tooltip="${game.i18n.localize('ordemparanormal.sidebar.twitter')}">
		<span class="system-info"><i class="fa-brands fa-twitter"></i> eusouowendel</span></p>
  `;
	if (pip) badge.querySelector('.system-info').insertAdjacentElement('beforeend', pip);
	heading.insertAdjacentElement('afterend', badge);

	const credits = html.querySelector('.credits');
	credits.addEventListener('click', async function (ev) {
		const content = await renderTemplate('systems/ordemparanormal/templates/dialog/credits.html');
		new Dialog({
			title: 'Créditos no Desenvolvimento do Sistema',
			content: content,
			buttons: {},
			render: (html) => console.log('Janela (dialog) de créditos foi renderizada corretamente.'),
			close: (html) => console.log('Janela (dialog) foi fechada com sucesso!'),
		}).render(true);
	});
});
