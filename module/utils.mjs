// This code was taken from the DND5E System repository:
// https://github.com/foundryvtt/dnd5e/blob/5.1.x/module/utils.mjs
// This code is taken from DND5e under MIT license.

/* -------------------------------------------- */
/*  Keybindings Helper                          */
/* -------------------------------------------- */

const { MODIFIER_CODES: CODES, MODIFIER_KEYS } = (foundry.helpers?.interaction?.KeyboardManager ?? KeyboardManager);

/**
 * Track which KeyboardEvent#code presses associate with each modifier.
 * Added support for treating Meta separate from Control.
 * @enum {string[]}
 */
const MODIFIER_CODES = {
	Alt: CODES.Alt,
	Control: CODES.Control.filter(k => k.startsWith('Control')),
	Meta: CODES.Control.filter(k => !k.startsWith('Control')),
	Shift: CODES.Shift
};

/**
 * Based on the provided event, determine if the keys are pressed to fulfill the specified keybinding.
 * @param {Event} event    Triggering event.
 * @param {string} action  Keybinding action within the `dnd5e` namespace.
 * @returns {boolean}      Is the keybinding triggered?
 */
export function areKeysPressed(event, action) {
	if ( !event ) return false;
	const activeModifiers = {};
	const addModifiers = (key, pressed) => {
		activeModifiers[key] = pressed;
		MODIFIER_CODES[key].forEach(n => activeModifiers[n] = pressed);
	};
	addModifiers(MODIFIER_KEYS.ALT, event.altKey);
	addModifiers(MODIFIER_KEYS.CONTROL, event.ctrlKey);
	addModifiers('Meta', event.metaKey);
	addModifiers(MODIFIER_KEYS.SHIFT, event.shiftKey);
	return game.keybindings.get('ordemparanormal', action).some(b => {
		if ( game.keyboard.downKeys.has(b.key) && b.modifiers.every(m => activeModifiers[m]) ) return true;
		if ( b.modifiers.length ) return false;
		return activeModifiers[b.key];
	});
}

/* -------------------------------------------- */
/*  Handlebars Template Helpers                 */
/* -------------------------------------------- */

/**
 * Define a set of template paths to pre-load. Pre-loaded templates are compiled and cached for fast access when
 * rendering. These paths will also be available as Handlebars partials by using the file name
 * @returns {Promise}
 */
export async function preloadHandlebarsTemplates() {
	const partials = [
		// Shared Partials
		'systems/ordemparanormal/templates/shared/effects.hbs',

		// Actor Sheet Partials
		'systems/ordemparanormal/templates/actor/parts/actor-abilities.hbs',
		'systems/ordemparanormal/templates/actor/parts/actor-inventory.hbs',
		'systems/ordemparanormal/templates/actor/parts/actor-rituals.hbs',
		'systems/ordemparanormal/templates/actor/parts/actor-skills.hbs',
		'systems/ordemparanormal/templates/actor/parts/actor-effects.hbs',

		// Chat Message Partials
		'systems/ordemparanormal/templates/chat/item-card.html',

		// Dialog
		'systems/ordemparanormal/templates/chat/item-card.html',

		// Item Sheet Partials
		'systems/ordemparanormal/templates/item/item-header.hbs',
		'systems/ordemparanormal/templates/item/parts/item-ability-attributes.hbs',
		'systems/ordemparanormal/templates/item/parts/item-armament-combat.hbs',
		'systems/ordemparanormal/templates/item/parts/item-armament-spec.hbs',
		'systems/ordemparanormal/templates/item/parts/item-description.hbs',
		'systems/ordemparanormal/templates/item/parts/item-general-attributes.hbs',
		'systems/ordemparanormal/templates/item/parts/item-protection-attributes.hbs',
		'systems/ordemparanormal/templates/item/parts/item-ritual-attributes.hbs',
	];

	const paths = {};
	for ( const path of partials ) {
		paths[path.replace('.hbs', '.html')] = path;
		paths[`op.${path.split('/').pop().replace('.hbs', '')}`] = path;
	}

	return loadTemplates(paths);
}