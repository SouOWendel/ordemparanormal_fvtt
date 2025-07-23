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