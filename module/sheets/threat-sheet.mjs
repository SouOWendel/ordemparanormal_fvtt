/* eslint-disable new-cap */
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { ResistanceConfig } from '../applications/resistance-config.mjs';
import { TraitsConfig } from '../applications/traits-config.mjs';

const { api, sheets } = foundry.applications;

/**
 * Ficha de Ameaça (V2) - Versão Estável e Funcional
 * @extends {ActorSheetV2}
 */
export class OrdemThreatSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
    
	#dragDrop;

	/** 
	 * 
	*/
	constructor(options = {}) {
		super(options);
		this.#dragDrop = this.#createDragDropHandlers();
		// Define a aba inicial padrão
		this.tabGroups = { primary: 'attacks' };
	}

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ['ordemparanormal', 'sheet', 'actor', 'threat', 'themed', 'theme-light'],
		tag: 'form',
		position: { width: 600, height: 820 },
		window: { 
			resizable: true, 
			title: 'Ficha de Ameaça'
		},
		form: { 
			submitOnChange: true
		},      
		// Mapeamento de Ações (data-action="nomeDaAcao")
		actions: {
			onTab: this.prototype._onTab,
			onEditImage: this.prototype._onEditImage,
                
			// Rolagens
			onRollAttributeTest: this.prototype._onRollAttributeTest,
			onRollSkillCheck: this.#onRollSkillCheck,
			onRollSkill: this.prototype._onRollSkill,
			onRollMentalDamage: this.prototype._onRollMentalDamage,
			onRoll: this.prototype._onRoll,
                
			// Gestão de Itens e Efeitos
			createDoc: this.prototype._onCreateDoc,
			viewDoc: this.prototype._onViewDoc,
			deleteDoc: this.prototype._onDeleteDoc,
			toggleDescription: this.prototype._onToggleDescription,
			toggleEffect: this.prototype._onToggleEffect,
			// Configurações
			openResistanceConfig: this.prototype._onOpenResistanceConfig,
			openTraitsConfig: this.prototype._onOpenTraitsConfig
		},
		dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }]
	};

	/** @inheritDoc */
	static PARTS = {
		threat: { id: 'sheet', template: 'systems/ordemparanormal/templates/threat/actor-threat-sheet.hbs' },
		tabs: { id: 'tabs', template: 'templates/generic/tab-navigation.hbs' },
		attacks: { id: 'attacks', template: 'systems/ordemparanormal/templates/threat/parts/threat-attacks.hbs' },
		abilities: { id: 'abilities', template: 'systems/ordemparanormal/templates/threat/parts/threat-abilities.hbs' },
		enigmas: { id: 'enigmas', template: 'systems/ordemparanormal/templates/threat/parts/threat-enigmas.hbs' },
		effects: { id: 'effects', template: 'systems/ordemparanormal/templates/shared/effects.hbs' },
	};

	/** @inheritDoc */
	static TABS = {
		primary: {
			tabs: [
				{ id: 'attacks', label: 'op.tab.attacks' },
				{ id: 'abilities', label: 'op.tab.abilities' },
				{ id: 'enigmas', label: 'op.tab.enigmas' },
				{ id: 'effects', label: 'op.tab.effects' }
			],
			initial: 'attacks'
		}
	};

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		// Not all parts always render
		options.parts = ['threat', 'tabs'];
		// Don't show the other tabs if only limited view
		if (this.document.limited) return;
		// Control which parts show based on document subtype
		switch (this.document.type) {
		case 'threat':
			options.parts.push('attacks', 'abilities', 'enigmas', 'effects');
			break;
		case 'npc':
			options.parts.push('gear', 'effects');
			break;
		}
	}

	/** @override */
	_onRender(context, options) {
		// Re-bind do Drag & Drop após renderizar
		this.#dragDrop.forEach((d) => d.bind(this.element));
		this.#disableOverrides();

		for (const input of this.element.querySelectorAll('input[type=\'number\']')) {
			input.addEventListener('change', this._onChangeInputOP.bind(this));
		}

		for (const button of this.element.querySelectorAll('.adjustment-button')) {
			button.addEventListener('click', this._onAdjustInput.bind(this));
		}
	}

	/** * Prepara os dados para o Handlebars 
     * @override 
     */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Mescla dados essenciais no contexto
		foundry.utils.mergeObject(context, {
			system: this.document.system,
			actor: this.document,
			editable: this.isEditable,
			owner: this.document.isOwner,
			effects: prepareActiveEffectCategories(this.actor.allApplicableEffects()),
			// Listas para Dropdowns
			optionDegree: CONFIG.op.dropdownDegree || {},
			elements: CONFIG.op.dropdownElement || {},
			threatTypes: CONFIG.op.dropdownThreatType,
			threatSizes: CONFIG.op.dropdownThreatSize,
			// Controle de Abas
			tabs: this._getTabs(options.parts)
		});

		// Prepara visualização de Resistências e Características
		this._prepareResistances(context);
		this._prepareTraits(context);

		// Prepara Itens e Perícias
		this._prepareItems(context);
        
		return context;
	}

	/**
	 *  Separei a lógica de resistências para limpar o _prepareContext
	 * */
	_prepareResistances(context) {
		context.viewResistances = {};
		const allDamageTypes = CONFIG.op.dropdownDamageType || {}; 
		const actorResistances = context.system.resistances || {};

		for (const [key, ] of Object.entries(allDamageTypes)) {
			const resData = actorResistances[key] || { value: 0, vulnerable: false, immune: false };
			// Mostra apenas se tiver algum valor relevante
			const isVisible = (resData.value > 0) || (resData.vulnerable === true) || (resData.immune === true);

			context.viewResistances[key] = {
				...resData,
				isVisible: isVisible,
				translatedLabel: game.i18n.localize(`op.damageTypeAbv.${key}`)
			};
		}
	}

	/**
	 *  Separei a lógica de resistências para limpar o _prepareContext
	 * */
	_prepareTraits(context) {
		context.viewTraits = {};
		const allTraitsTypes = CONFIG.op.traits || {}; 
		const actorTraits = context.system.traits || {};

		for (const [key, ] of Object.entries(allTraitsTypes)) {
			const traitData = actorTraits[key];
			// Mostra apenas se tiver algum valor relevante
			const isVisible = (traitData == undefined) || (traitData === true);

			context.viewTraits[key] = {
				...traitData,
				isVisible: isVisible,
				translatedLabel: game.i18n.localize(`op.traits.${key}`)
			};
		}
	}

	/** */
	_prepareItems(context) {
		const attacks = [];
		const abilities = [];

		for (const i of this.document.items) {
			i.img = i.img || DEFAULT_TOKEN;
            
			if (i.type === 'armament') {
				const rangeType = i.system.types?.rangeType?.name;
				const itemBonus = i.system.formulas?.attack?.bonus;
                
				let attrKey = rangeType === 'ranged' ? 'dex' : 'str';
				let skillKey = rangeType === 'ranged' ? 'aim' : 'fighting';
                
				if (i.system.formulas?.attack?.attr) attrKey = i.system.formulas.attack.attr;
				if (i.system.formulas?.attack?.skill) skillKey = i.system.formulas.attack.skill;

				const attrValue = this.actor.system.attributes[attrKey]?.value || 0;
				const diceString = attrValue > 0 ? `${attrValue}d20` : '2d20kl1';
				const skillLabel = game.i18n.localize(`op.skill.${skillKey}`) || skillKey;

				let attackLabel = `${diceString} + ${skillLabel}`;
				if (itemBonus && itemBonus != 0) attackLabel += ` + ${itemBonus}`;
				i.attackLabel = attackLabel;

				const dmgFormula = i.system.formulas?.damage?.formula || '0';
				const dmgTypeKey = i.system.formulas?.damage?.type;
				const dmgTypeLabel = dmgTypeKey ? game.i18n.localize(`op.damageTypeAbv.${dmgTypeKey}`) : '';
				i.damageLabel = `${dmgFormula} ${dmgTypeLabel}`;

				attacks.push(i);
			} 
			else if (i.type === 'ability') {
				const costVal = i.system.cost || '—';
				const costType = i.system.costType || 'PE';
				i.displayCost = (costVal !== '—' && costVal !== '') && costVal != 0 ? `${costVal} ${costType}` : '—';
                
				if (i.system.activation) {
					i.activationLabel = game.i18n.localize(`op.executionChoices.${i.system.activation}`);
				} else {
					i.activationLabel = '—';
				}

				abilities.push(i);
			}
		}

		attacks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		abilities.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

		context.attacks = attacks;
		context.abilities = abilities;
	}

	/** */
	async _preparePartContext(partId, context) {
		switch (partId) {
		// Enrich biography info for display
		// Enrichment turns text like `[[/r 1d20]]` into buttons
		case 'attacks':
			context.tab = context.tabs[partId];
			break;
		case 'enigma':
			context.tab = context.tabs[partId];
			context.enrichedFearRiddle = await TextEditor.enrichHTML(
				this.actor.system.details.fearRiddle, { 
					secrets: this.document.isOwner, 
					rollData: this.actor.getRollData(), 
					relativeTo: this.actor 
				}
			);
			break;
		case 'abilities':
			context.tab = context.tabs[partId];
			context.enrichedAbilities = await TextEditor.enrichHTML(
				this.actor.system.temporary.abilities, { 
					secrets: this.document.isOwner, 
					rollData: this.actor.getRollData(), 
					relativeTo: this.actor 
				}
			);
			break;
		case 'effects':
			context.tab = context.tabs[partId];
			// Prepare active effects
			context.effects = prepareActiveEffectCategories(
				// A generator that returns all effects stored on the actor
				// as well as any items
				this.actor.allApplicableEffects()
			);
			break;
		}
		return context;
	}

	/** */
	/**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
	_getTabs(parts) {
		// If you have sub-tabs this is necessary to change
		const tabGroup = 'primary';
		// Default tab for first time it's rendered this session
		if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'skills';
		return parts.reduce((tabs, partId) => {
			const tab = {
				cssClass: '',
				group: tabGroup,
				// Matches tab property to
				id: '',
				// FontAwesome Icon, if you so choose
				icon: '',
				// Run through localization
				label: 'op.tab.',
			};
			switch (partId) {
			case 'threat':
			case 'tabs':
				return tabs;
			case 'attacks':
				tab.id = 'attacks';
				tab.label += 'attacks';
				break;
			case 'abilities':
				tab.id = 'abilities';
				tab.label += 'abilities';
				break;
			case 'enigmas':
				tab.id = 'enigmas';
				tab.label += 'enigmas';
				break;
			case 'effects':
				tab.id = 'effects';
				tab.label += 'effects';
				break;
			}
			if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
			tabs[partId] = tab;
			return tabs;
		}, {});
	}

	/** */
	_getEmbeddedDocument(target) {
		const docRow = target.closest('li[data-document-class]');
		if (!docRow) return null;
		if (docRow.dataset.documentClass === 'Item') {
			return this.actor.items.get(docRow.dataset.itemId);
		} else if (docRow.dataset.documentClass === 'ActiveEffect') {
			return this.actor.effects.get(docRow.dataset.effectId);
		}
	}

	/* -------------------------------------------- */
	/* Action Handlers (MÉTODOS DE INSTÂNCIA)      */
	/* -------------------------------------------- */

	/** */
	async _onTab(event, target) {
		event.preventDefault();
		const tab = target.dataset.tab;
		this.tabGroups.primary = tab;
		this.render();
	}

	/** */
	async _onEditImage(event, target) {
		const attr = target.dataset.edit;
		const current = foundry.utils.getProperty(this.document, attr);
		const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
		const fp = new FilePicker({
			current,
			type: 'image',
			redirectToRoot: img ? [img] : [],
			callback: (path) => this.document.update({ [attr]: path }),
			top: this.position.top + 40,
			left: this.position.left + 10,
		});
		return fp.browse();
	}

	// CORREÇÃO: Passando o objeto corretamente para evitar o erro "One of original or other are not Objects"
	/** */
	_onRollAttributeTest(event, target) {
		event.preventDefault();
		const attribute = target.dataset.key;
		if (this.actor.rollAttribute) {
			this.actor.rollAttribute({ attribute, event }); 
		} else {
			console.error('Função rollAttribute não encontrada no ator.');
		}
	}

	/**
   * Handle rolling a Skill check.
   * @param {Event} event      The originating click event.
   * @returns {Promise<Roll>}  The resulting roll.
   * @private
   */
	static #onRollSkillCheck(event, target) {
		event.preventDefault();
		const skill = target.closest('[data-key]').dataset.key;
		return this.actor.rollSkill({ skill, event });
	}

	/** */
	async _onRollSkill(event, target) {
		event.preventDefault();
		const skillKey = target.dataset.key;
		const attrKey = target.dataset.attr;
		const label = target.dataset.label;

		const skillData = this.document.system.skills[skillKey] || {};
        
		// Valores de bônus
		const degreeValues = { 'untrained': 0, 'trained': 5, 'veteran': 10, 'expert': 15, 'master': 20 };

		const currentDegreeLabel = skillData.degree?.label || 'untrained';
		const skillValue = degreeValues[currentDegreeLabel] || 0;
		const attrValue = this.document.system.attributes[attrKey]?.value || 0;
        
		// 0 Atributo rola 2d20kl1, senão rola Xd20kh1
		const diceFormula = attrValue > 0 ? `${attrValue}d20kh` : '2d20kl';
		const formula = `${diceFormula} + ${skillValue}`;

		const roll = new Roll(formula, this.actor.getRollData());
		await roll.toMessage({
			flavor: `Teste de ${label} <span style="font-size: 0.8em; color: gray">(${attrKey.toUpperCase()})</span>`,
			speaker: ChatMessage.getSpeaker({ actor: this.document })
		});
	}

	/** */
	async _onRollMentalDamage(event, target) {
		event.preventDefault();
		let formula = this.document.system.disturbingPresence.mentalDamage;
        
		// Tenta pegar do input se não estiver salvo
		if (!formula || formula.trim() === '') {
			const inputElement = target.closest('div').querySelector('input');
			if (inputElement) formula = inputElement.value;
		}

		if (!formula || formula.trim() === '') {
			return ui.notifications.warn('Defina um valor para o Dano Mental (Ex: 2d6).');
		}
        
		try {
			const roll = new Roll(formula, this.actor.getRollData());
			await roll.toMessage({
				flavor: 'Dano Mental (Presença Perturbadora)',
				speaker: ChatMessage.getSpeaker({ actor: this.document })
			});
		} catch (err) {
			ui.notifications.error(`Erro na fórmula de dano: ${err.message}`);
		}
	}

	/** */
	async _onCreateDoc(event, target) {
		event.preventDefault();
		const docClass = target.dataset.documentClass; 
		const docCls = getDocumentClass(docClass);

		if (docClass === 'ActiveEffect') {
			const effectData = {
				name: docCls.defaultName({ parent: this.document }),
				icon: 'icons/svg/aura.svg'
			};
			await docCls.create(effectData, { parent: this.document });
		} else {
			const type = target.dataset.type;
			const docData = {
				name: docCls.defaultName({ type: type, parent: this.document }),
				type: type,
				system: {}
			};
			await docCls.create(docData, { parent: this.document });
		}
	}

	/** */
	_onViewDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		if (doc) doc.sheet.render(true);
	}

	/** */
	async _onDeleteDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		if (doc) await doc.delete();
	}

	/** */
	async _onRoll(event, target) {
		event.preventDefault();
		let doc = this._getEmbeddedDocument(target);
		if (!doc) {
			const itemRow = target.closest('.item');
			if (itemRow && itemRow.dataset.itemId) {
				doc = this.actor.items.get(itemRow.dataset.itemId);
			}
		}
		if (doc) return doc.roll();
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
		value += action === 'increase' ? 5 : -5;
		input.value = Math.clamp(value, min, max);
		input.dispatchEvent(new Event('change'));
	}

	/**
	 * 
	 * @param {*} event 
	 * @returns 
	 */
	async _onChangeInputOP(event) {
		event.stopImmediatePropagation();
		const min = event.target.min !== '' ? Number(event.target.min) : -Infinity;
		const max = event.target.max !== '' ? Number(event.target.max) : Infinity;
		const value = Math.clamp(event.target.valueAsNumber, min, max);

		if ( Number.isNaN(value) ) return;

		event.target.value = value;
		await this.document.update({[event.target.dataset.name]: value});
	}

	/** */
	async _onToggleDescription(event, target) {
		const li = target.closest('li');
		const summary = li.querySelector('.item-summary');
		if (summary) {
			summary.remove();
		} else {
			const item = this._getEmbeddedDocument(li);
			if (!item) return;
			const div = document.createElement('div');
			div.classList.add('item-summary');
			div.style.flexBasis = '100%';
			div.style.padding = '5px 10px';
			div.style.fontSize = '0.9em';
			div.style.borderTop = '1px dashed #ccc';
			div.style.marginTop = '5px';
			div.innerHTML = await TextEditor.enrichHTML(item.system.description, {
				secrets: this.document.isOwner,
				rollData: this.actor.getRollData(),
				async: true
			});
			li.appendChild(div);
		}
	}

	/** */
	async _onToggleEffect(event, target) {
		const effect = this._getEmbeddedDocument(target);
		if (effect) await effect.update({ disabled: !effect.disabled });
	}

	/**
   * Disables inputs subject to active effects
   */
	#disableOverrides() {
		const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
		for (const override of Object.keys(flatOverrides)) {
			const input = this.element.querySelector(`[name="${override}"]`);
			if (input) {
				input.disabled = true;
			}
		}
	}

	/** */
	async _onOpenResistanceConfig(event, target) {
		event.preventDefault();
		new ResistanceConfig(this.document).render(true);
	}

	/** */
	async _onOpenTraitsConfig(event, target) {
		event.preventDefault();
		new TraitsConfig(this.document).render(true);
	}

	/* -------------------------------------------- */
	/* Drag & Drop                                  */
	/* -------------------------------------------- */

	/** */
	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = { dragstart: this._canDragStart.bind(this), drop: this._canDragDrop.bind(this) };
			d.callbacks = { dragstart: this._onDragStart.bind(this), dragover: this._onDragOver.bind(this), drop: this._onDrop.bind(this) };
			return new DragDrop(d);
		});
	}

	/** */
	_canDragStart(selector) { return this.isEditable; }

	/** */
	_canDragDrop(selector) { return this.isEditable; }

	/** */
	_onDragStart(event) {
		const docRow = event.currentTarget.closest('li');
		if (event.target.dataset.link) return;
		const item = this._getEmbeddedDocument(docRow);
		if (!item) return;
		event.dataTransfer.setData('text/plain', JSON.stringify(item.toDragData()));
	}

	/** */
	_onDragOver(event) {}

	/** */
	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		if (!this.actor.isOwner) return false;
		if (data.type === 'Item') return this._onDropItem(event, data);
		if (data.type === 'ActiveEffect') return this._onDropActiveEffect(event, data);
	}

	/** */
	async _onDropItem(event, data) {
		if (!this.actor.isOwner) return false;
		
		const item = await Item.implementation.fromDropData(data);
		if (!item) return false;
		
		// Handle item sorting within the same Actor
		if (this.actor.uuid === item.parent?.uuid) return false;
		
		// Convert Item object to data before creating
		const itemData = item instanceof Item ? item.toObject() : item;
		
		try {
			return await this.actor.createEmbeddedDocuments('Item', [itemData]);
		} catch (error) {
			console.error('Erro ao criar item na ameaça:', error);
			ui.notifications.error(`Erro ao adicionar item: ${error.message}`);
			throw error;
		}
	}

	/** */
	async _onDropActiveEffect(event, data) {
		const aeCls = getDocumentClass('ActiveEffect');
		const effect = await aeCls.fromDropData(data);
		if (!this.actor.isOwner || !effect) return false;
		return aeCls.create(effect, { parent: this.actor });
	}

	/** ******************
   *
   * Actor Override Handling
   *
   ********************/

	/**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @returns {Promise<void>}
   * @protected
   * @override
   */
	async _processSubmitData(event, form, submitData) {
		const overrides = foundry.utils.flattenObject(this.actor.overrides);
		for (const k of Object.keys(overrides)) delete submitData[k];
		await this.document.update(submitData);
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onSubmit(...args) {
		await super._onSubmit(...args);
	}

	/* -------------------------------------------- */
}