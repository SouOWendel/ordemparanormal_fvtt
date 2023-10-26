import {
	onManageActiveEffect,
	prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class OrdemItemSheet extends ItemSheet {

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'item'],
			width: 480,
			height: 400,
			template: 'systems/ordemparanormal/templates/itemn/item-sheet.html',
			tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }]
		});
	}

	/** @override */
	get template() {
		const path = 'systems/ordemparanormal/templates/item';
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/item-${this.item.data.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		const itemData = context.item.data;

		// Dropdowns
		context.optionWeaponType = CONFIG.ordemparanormal.dropdownWeaponType;
		context.optionWeaponSubType = CONFIG.ordemparanormal.dropdownWeaponSubType;
		context.optionGripType = CONFIG.ordemparanormal.dropdownWeaponGripType;
		context.optionWeaponAmmunition = CONFIG.ordemparanormal.dropdownWeaponAmmunition;
		context.optionProficiency = CONFIG.ordemparanormal.dropdownProficiency;
		context.optionDamageType = CONFIG.ordemparanormal.dropdownDamageType;
		context.optionPowerType = CONFIG.ordemparanormal.dropdownPowerType;
		
		// Retrieve the roll data for TinyMCE editors.
		context.rollData = {};
		const actor = this.object?.parent ?? null;
		if (actor) {
			context.rollData = actor.getRollData();
		}

		// Add the actor's data to context.data for easier access, as well as flags.
		context.data = itemData.data;
		context.flags = itemData.flags;

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.item.effects);
		console.log(context.effects);

		return context;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		html.find('.effect-control').click((ev) =>
			onManageActiveEffect(ev, this.item),
		);

		// Roll handlers, click handlers, etc. would go here.
	}
}
