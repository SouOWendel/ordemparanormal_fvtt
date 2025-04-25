/* eslint-disable no-unused-vars */
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { d20Roll } from '../dice/dice.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OrdemActorSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'actor'],
			template: 'systems/ordemparanormal/templates/actor/actor-sheet.html',
			width: 600,
			height: 820,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'features',
				},
			],
		});
	}

	/** @override */
	get template() {
		return `systems/ordemparanormal/templates/actor/actor-${this.actor.type}-sheet.html`;
	}

	/**
	 * 
	 */
	get progressRuleIsNivel() {
		const rule = game.settings.get('ordemparanormal', 'globalProgressRules');
		return (rule == 2) ? true : false;
	}

	/**
	 * 
	 */
	get usingWithoutSanityRule() {
		return game.settings.get('ordemparanormal', 'globalPlayingWithoutSanity');
	}

	/**
	 * 
	 */
	get progressRuleIsNEX() {
		const rule = game.settings.get('ordemparanormal', 'globalProgressRules');
		return (rule == 1) ? true : false;
	}

	/**
	 * 
	 */
	get isV12() {
		return game.version > 11;
	}

	/**
	 * 
	 */
	get isSurvivor() {
		const system = this.actor.system;
		return system.class == 'survivor';
	}

	/* -------------------------------------------- */

	/** @override */
	async getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = await super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = context.data;

		foundry.utils.mergeObject(context, {
			// Add the actor's data to context.data for easier access, as well as flags.
			system: actorData.system,
			flags: actorData.flags,
			// Add roll data for TinyMCE editors.
			rollData: context.actor.getRollData(),
			// Return all effects stored on the actor.
			effects: prepareActiveEffectCategories(this.actor.allApplicableEffects()),
			// Dropdown options.
			optionDegree: CONFIG.op.dropdownDegree,
			optionClass: CONFIG.op.dropdownClass,
			optionTrilhas: CONFIG.op.dropdownTrilha,
			optionOrigins: CONFIG.op.dropdownOrigins,
			// Rules & Conditions
			progressRuleIsNivel: this.progressRuleIsNivel,
			progressRuleIsNEX: this.progressRuleIsNEX,
			usingWithoutSanityRule: this.usingWithoutSanityRule,
			isV12: this.isV12,
			isSurvivor: this.isSurvivor
		});

		// Prepara os dados do Agente e seus Items.
		if (actorData.type == 'agent') {
			this._prepareItems(context);
		}

		// Biography HTML enrichment
		context.biographyHTML = await TextEditor.enrichHTML(context.system.biography, {
			secrets: this.actor.isOwner,
			rollData: context.rollData,
			relativeTo: this.actor
		});

		// Goals HTML enrichment
		context.goalsHTML = await TextEditor.enrichHTML(context.system.goals, {
			secrets: this.actor.isOwner,
			rollData: context.rollData,
			relativeTo: this.actor
		});

		return context;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItems(context) {
		// Initialize containers.
		const gear = [];
		const features = [];

		const protection = [];
		const generalEquipment = [];
		const armament = [];
		const rituals = {
			valid: {
				1: [],
				2: [],
				3: [],
				4: [],
			},
			invalid: [],
		};
		const abilities = {
			valid: {
				1: [],
				2: [],
				3: [],
				4: [],
			},
			invalid: [],
		};

		// const invalid = [];

		// Iterate through items, allocating to containers
		for (const [index, i] of context.items.entries()) {
			i.img = i.img || DEFAULT_TOKEN;

			// Creating the data to use an item
			i.system.using = !i.system.using ? [true, 'fas'] : i.system.using;

			// Append to protections.
			if (i.type === 'protection') {
				protection.push(i);
			}
			// Append to general equipment.
			else if (i.type === 'generalEquipment') {
				generalEquipment.push(i);
			}
			// Append to armament.
			else if (i.type === 'armament') {
				armament.push(i);
			}
			// Append to gear.
			else if (i.type === 'item') {
				gear.push(i);
			}
			// Append to features.
			else if (i.type === 'feature') {
				features.push(i);
			}
			// Append to rituals.
			else if (i.type === 'ritual') {
				if (i.system.circle != 5) rituals.valid[i.system.circle].push(i);
				else rituals.invalid.push(i);
			}
			// Append to abilities.
			else if (i.type === 'ability') {
				if (i.system.abilityType == 'class') abilities.valid[1].push(i);
				else if (i.system.abilityType == 'path') abilities.valid[2].push(i);
				else if (i.system.abilityType == 'paranormal') abilities.valid[3].push(i);
				else if (i.system.abilityType == 'ability') abilities.valid[4].push(i);
				else if (!i.system.abilityType) abilities.invalid.push(i);
			}
		}

		// Assign and return
		context.gear = gear;
		context.features = features;

		context.rituals = rituals;
		context.protection = protection;
		context.generalEquip = generalEquipment;
		context.armament = armament;
		context.abilities = abilities;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.find('.item-edit').click((ev) => {
			ev.preventDefault();
    	ev.stopPropagation();
			const liItemId = ev.currentTarget.closest('[data-item-id]')?.dataset.itemId;
			const item = this.actor.items.get(liItemId);
			item?.sheet.render(true);
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Send description of item in chat
		html.find('.send-chat').click(this._onSendChat.bind(this));

		// Send description of item in chat
		html.find('.mark-item').click(this._onMarkItem.bind(this));

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		// Delete Inventory Item
		html.find('.item-delete').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		// Active Effect management
		html.find('.effect-control').click((ev) => {
			const row = ev.currentTarget.closest('li');
			const document = row.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(row.dataset.parentId);
			onManageActiveEffect(ev, document);
		});

		// Rollable abilities.
		html.find('.rollable').click(this._onRoll.bind(this));

		// Drag events for macros.
		if (this.actor.isOwner) {
			const handler = (ev) => this._onDragStart(ev);
			html.find('li.item').each((i, li) => {
				if (li.classList.contains('inventory-header')) return;
				li.setAttribute('draggable', true);
				li.addEventListener('dragstart', handler, false);
			});
		}

		for (const input of this.form.querySelectorAll('input[type=\'number\']')) {
			input.addEventListener('change', this._onChangeInputOP.bind(this));
		}

		for (const button of this.form.querySelectorAll('.adjustment-button')) {
			button.addEventListener('click', this._onAdjustInput.bind(this));
		}
	}

	/**
	 * 
	 * @param {*} event 
	 * @returns 
	 */
	async _onAdjustInput(event) {
		const button = event.currentTarget;
		const { action } = button.dataset;
		const input = button.parentElement.querySelector('input');
		const min = input.min ? Number(input.min) : -Infinity;
		const max = input.max ? Number(input.max) : Infinity;
		let value = Number(input.value);
		if (isNaN(value)) return;
		value += action === 'increase' ? 1 : -1;
		input.value = Math.clamp(value, min, max);
		input.dispatchEvent(new Event('change'));
	}

	/**
	 * 
	 * @param {*} event 
	 * @returns 
	 */
	async _onChangeInputOP(event) {
		const itemId = event.target.closest('[data-item-id]')?.dataset.itemId;
		if ( !itemId ) return;

		event.stopImmediatePropagation();
		const item = this.document.items.get(itemId);
		const min = event.target.min !== '' ? Number(event.target.min) : -Infinity;
		const max = event.target.max !== '' ? Number(event.target.max) : Infinity;
		const value = Math.clamp(event.target.valueAsNumber, min, max);

		if ( !item || Number.isNaN(value) ) return;

		event.target.value = value;
		item.update({[event.target.dataset.name]: value});
	}

	/** @inheritdoc */
	_onDragStart(event) {
		const li = event.currentTarget;
		console.log('OP | Movendo efeito de ID:', li.dataset.effectId);
		console.log('OP | ID descendente de:', li.dataset.parentId);
		if (event.target.classList.contains('content-link')) return;

		if (li.dataset.effectId && li.dataset.parentId) {
			const effect =
				this.actor.items.get(li.dataset.parentId)?.effects.get(li.dataset.effectId) ||
				this.actor?.effects.get(li.dataset.effectId);
			if (effect) event.dataTransfer.setData('text/plain', JSON.stringify(effect.toDragData()));
			return;
		}
		super._onDragStart(event);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onDropActiveEffect(event, data) {
		const effect = await ActiveEffect.implementation.fromDropData(data);
		if (effect?.target === this.actor) return false;
		return super._onDropActiveEffect(event, data);
	}

	/* -------------------------------------------- */

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = foundry.utils.duplicate(header.dataset);
		// Initialize a default name.
		const name = game.i18n.localize('op.newItem') + ' ' + game.i18n.localize('TYPES.Item.' + type);
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			system: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system['type'];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	/**
	 * Handle creating a new message with data of item for send to chat.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onSendChat(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemId = element.closest('.item').dataset.itemId;
		const item = this.actor.items.get(itemId);

		if (item.system.description) ChatMessage.create({ content: item.system.description });
	}

	/**
	 * Handle marks an item whether it is used or not and changes the icon
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onMarkItem(event) {
		event.preventDefault();
		const element = event.target; // Puxa o elemento filho
		const dataset = event.currentTarget.dataset; // Dataset do elemento pai

		const itemId = event.currentTarget.closest('.item').dataset.itemId;
		const item = this.actor.items.get(itemId);

		if (!item.system.using || item.system.using.state == false) {
			console.log(`OP FVTT | Definindo ${item.name} como ativado.`);
			return item.update({ 'system.using': { state: true, class: 'fas' } });
		} else {
			console.log(`OP FVTT | Definindo ${item.name} como desativado.`);
			return item.update({ 'system.using': { state: false, class: 'far' } });
		}
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		const context = super.getData();
		// Use a safe clone of the actor data for further operations.
		const actorData = context.data;
		// Add the actor's data to context.data for easier access, as well as flags.
		const system = actorData.system;

		// Handle item rolls.
		if (dataset.rollType) {
			if (dataset.rollType == 'item') {
				const itemId = element.closest('.item').dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			}
		}

		// Handle rolls that supply the formula directly.
		// if (dataset.roll) {
		// 	let label = dataset.label ? `Rolando ${dataset.label} ` : '';
		// 	if (dataset.key == 'freeSkill') label += `(${system.skills.freeSkill.name || 'Sem nome'})`;
		// 	const roll = new Roll(dataset.roll, this.actor.getRollData());
		// 	roll.toMessage({
		// 		speaker: ChatMessage.getSpeaker({ actor: this.actor }),
		// 		flavor: label,
		// 		rollMode: game.settings.get('core', 'rollMode'),
		// 	});
		// 	return roll;
		// }

		let label = dataset.label ? `Rolando ${dataset.label} ` : '';
		if (dataset.key == 'freeSkill') label += `(${system.skills.freeSkill.name || 'Sem nome'})`;
		const data = system.skills[dataset.key];
		const roll = await d20Roll({
			data,
			title: `Configuração de ${label}`,
			flavor: label,
			messageData: {speaker: ChatMessage.getSpeaker({ actor: this.actor })},
			event,
			parts: [data.degree.value, data.mod, data.value],
			shiftFastForward: event.shiftKey,
			hasCritical: false,
		});
		return roll;
			
	}

	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onSubmit(...args) {
		await super._onSubmit(...args);
	}

	/* -------------------------------------------- */
}
