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
	async getData() {
		// Retrieve base data structure.
		const context = await super.getData();
		const itemData = context.item;
		const source = itemData.toObject();

		foundry.utils.mergeObject(context, {
			source: source.system,
			system: itemData.system,
			rollData: this.item.getRollData(),
			flags: itemData.flags,
			effects: prepareActiveEffectCategories(this.item.effects),

			// Armament's Dropdowns
			optionWeaponType: CONFIG.ordemparanormal.dropdownWeaponType,
			optionWeaponSubType: CONFIG.ordemparanormal.dropdownWeaponSubType,
			optionGripType: CONFIG.ordemparanormal.dropdownWeaponGripType,
			optionWeaponAmmunition: CONFIG.ordemparanormal.dropdownWeaponAmmunition,
			optionProficiency: CONFIG.ordemparanormal.dropdownProficiency,
			optionDamageType: CONFIG.ordemparanormal.dropdownDamageType,
			optionPowerType: CONFIG.ordemparanormal.dropdownPowerType,

			// Attack and Damage Dropdown
			attributes: CONFIG.ordemparanormal.attributes,
			attackSkills: CONFIG.ordemparanormal.attackSkills,

			// Ritual's Dropdowns
			optionExecution: CONFIG.ordemparanormal.dropdownExecution,

			// Item's Radiobox
			categories: CONFIG.ordemparanormal.categories,
		});

		return context;
	}

	/* -------------------------------------------- */

	/**
   * Add or remove a damage part from the damage formula.
   * @param {Event} event             The original click event.
   * @returns {Promise<OrdemItemSheet>|null}  Item with updates applied.
   * @private
   */
	async _onDamageControl(event) {
		event.preventDefault();
		const a = event.currentTarget;
	
		 // Add new damage component
		 if ( a.classList.contains('add-damage') ) {
			await this._onSubmit(event);  // Submit any unsaved changes
			const damage = this.item.system.formulas.damage;
			return this.item.update({'system.formulas.damage.parts': damage.parts.concat([['', '', '']])});
		  }
	  
		  // Remove a damage component
		  if ( a.classList.contains('delete-damage') ) {
			await this._onSubmit(event);  // Submit any unsaved changes
			const li = a.closest('.damage-part');
			const damage = foundry.utils.deepClone(this.item.system.formulas.damage);
			damage.parts.splice(Number(li.dataset.damagePart), 1);
			return this.item.update({'system.formulas.damage.parts': damage.parts});
		  }
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_getSubmitData(updateData={}) {
		const formData = foundry.utils.expandObject(super._getSubmitData(updateData));

		// Handle Damage array
    	const damage = formData.system.formulas?.damage;
    	if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || '', d[1] || '', d[2] || '']);

		
		// Check max uses formula
		// const uses = formData.data?.uses;
		// if ( uses?.max ) {
		// 	const maxRoll = new Roll(uses.max);
		// 	if ( !maxRoll.isDeterministic ) {
		// 		uses.max = this.item._source.system.uses.max;
		// 		this.form.querySelector('input[name=\'system.uses.max\']').value = uses.max;
		// 		ui.notifications.error(game.i18n.format('DND5E.FormulaCannotContainDiceError', {
		// 			name: game.i18n.localize('DND5E.LimitedUses')
		// 		}));
		// 		return null;
		// 	}
		// }

		// // Check duration value formula
		// const duration = formData.data?.duration;
		// if ( duration?.value ) {
		// 	const durationRoll = new Roll(duration.value);
		// 	if ( !durationRoll.isDeterministic ) {
		// 		duration.value = this.item._source.system.duration.value;
		// 		this.form.querySelector('input[name=\'system.duration.value\']').value = duration.value;
		// 		ui.notifications.error(game.i18n.format('DND5E.FormulaCannotContainDiceError', {
		// 			name: game.i18n.localize('DND5E.Duration')
		// 		}));
		// 		return null;
		// 	}
		// }

		// // Check class identifier
		// if ( formData.data?.identifier && !dnd5e.utils.validators.isValidIdentifier(formData.system.identifier) ) {
		// 	formData.system.identifier = this.item._source.system.identifier;
		// 	this.form.querySelector('input[name=\'system.identifier\']').value = formData.system.identifier;
		// 	ui.notifications.error('DND5E.IdentifierError', {localize: true});
		// 	return null;
		// }

		// Return the flattened submission data
		return foundry.utils.flattenObject(formData);
	}


	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		html.find('.damage-control').click(this._onDamageControl.bind(this));

		html.find('.effect-control').click((ev) =>
			onManageActiveEffect(ev, this.item),
		);

		// Roll handlers, click handlers, etc. would go here.
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onSubmit(...args) {
		await super._onSubmit(...args);
	}

	/* -------------------------------------------- */
}
