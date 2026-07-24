/* eslint-disable new-cap */
// TABS: https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Tabs-in-AppV2

import { AgentConfigApp } from "../applications/agent-config-app.mjs";
import { prepareActiveEffectCategories } from "../helpers/effects.mjs";

const { api, sheets } = foundry.applications;
// const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OrdemActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "actor", "themed", "theme-light"],
		tag: "form",
		roll: this._onRoll,
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
		position: {
			width: 600,
			height: 820,
		},
		window: {
			resizable: true,
			title: "DCC.ActorSheetTitle", // Just the localization key
		},
		form: {
			submitOnChange: true,
		},
		actions: {
			onEditImage: this.#onEditImage,
			onSendChat: this.#onSendChat,
			onMarkItem: this.#onMarkItem,
			onItemCreate: this.#onItemCreate,
			viewDoc: this._viewDoc,
			createDoc: this._createDoc,
			deleteDoc: this._deleteDoc,
			toggleEffect: this._toggleEffect,
			onRoll: this.#onRoll,
			onRollSkillCheck: this.#onRollSkillCheck,
			onRollAttributeTest: this.#onRollAttributeTest,
			toggleResources: this._onToggleResources,
			openConfig: this.#openConfig,
			findItem: this.#findItem,
		},
	};

	/** @inheritDoc */
	static PARTS = {
		agent: { id: "agent", template: "systems/ordemparanormal/templates/actor/actor-agent-sheet.hbs", scrollable: [""] },
		tabs: { id: "tabs", template: "templates/generic/tab-navigation.hbs", scrollable: [""] },
		skills: {
			id: "skills",
			template: "systems/ordemparanormal/templates/actor/parts/actor-skills.hbs",
			scrollable: [""],
		},
		inventory: {
			id: "inventory",
			template: "systems/ordemparanormal/templates/actor/parts/actor-inventory.hbs",
			scrollable: [""],
		},
		abilities: {
			id: "abilities",
			template: "systems/ordemparanormal/templates/actor/parts/actor-abilities.hbs",
			scrollable: [""],
		},
		rituals: {
			id: "rituals",
			template: "systems/ordemparanormal/templates/actor/parts/actor-rituals.hbs",
			scrollable: [""],
		},
		biography: {
			id: "biography",
			template: "systems/ordemparanormal/templates/actor/parts/actor-biography.hbs",
			scrollable: [""],
		},
		effects: { id: "effects", template: "systems/ordemparanormal/templates/shared/effects.hbs", scrollable: [""] },
	};

	/** @inheritDoc */
	static TABS = {
		primary: {
			// This is the group name
			tabs: [
				{ id: "skills", label: "op.tab.skills" },
				{ id: "inventory", label: "op.tab.inventory" },
				{ id: "abilities", label: "op.tab.abilities" },
				{ id: "rituals", label: "op.tab.rituals" },
				{ id: "biography", label: "op.tab.biography" },
				{ id: "effects", label: "op.tab.effects" },
			],
			initial: "skills",
		},
	};

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		// Not all parts always render
		options.parts = ["agent", "tabs"];
		// Don't show the other tabs if only limited view
		if (this.document.limited) return;
		// Control which parts show based on document subtype
		switch (this.document.type) {
			case "agent":
				options.parts.push("skills", "inventory", "abilities", "rituals", "biography", "effects");
				break;
		}
	}

	/* -------------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.mostrarRecursos = this.actor.getFlag("ordemparanormal", "showResources") || false;

		foundry.utils.mergeObject(context, {
			editable: this.isEditable,
			owner: this.document.isOwner,
			limited: this.document.limited,
			system: this.options.document.system,
			flags: this.actor.flags,
			actor: this.options.document,
			config: CONFIG.op,
			// Add roll data for TinyMCE editors.
			// rollData: context.actor.getRollData(),
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
			isSurvivor: this.isSurvivor,
			tabs: this._getTabs(options.parts),
			costLabel: this.usingWithoutSanityRule ? "PD" : "PE",
			skillTotals: this._prepareSkillTotals(this.options.document.system.skills),
		});

		// Prepara os dados do Agente e seus Items.
		this._prepareItems(context);

		return context;
	}

	/** */
	async _preparePartContext(partId, context) {
		switch (partId) {
			// Enrich biography info for display
			// Enrichment turns text like `[[/r 1d20]]` into buttons
			case "biography":
				context.tab = context.tabs[partId];
				context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					this.actor.system.biography,
					{
						// Whether to show secret blocks in the finished html
						secrets: this.document.isOwner,
						// Data to fill in for inline rolls
						rollData: this.actor.getRollData(),
						// Relative UUID resolution
						relativeTo: this.actor,
					}
				);
				// Enrich biography info for display
				// Enrichment turns text like `[[/r 1d20]]` into buttons
				context.enrichedGoals = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					this.actor.system.goals,
					{
						// Whether to show secret blocks in the finished html
						secrets: this.document.isOwner,
						// Data to fill in for inline rolls
						rollData: this.actor.getRollData(),
						// Relative UUID resolution
						relativeTo: this.actor,
					}
				);

				break;
			case "skills":
			case "abilities":
			case "inventory":
			case "rituals":
				context.tab = context.tabs[partId];
				break;
			case "effects":
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

	/**
	 * Generates the data for the generic tab navigation template
	 * @param {string[]} parts An array of named template parts to render
	 * @returns {Record<string, Partial<ApplicationTab>>}
	 * @protected
	 */
	_getTabs(parts) {
		// If you have sub-tabs this is necessary to change
		const tabGroup = "primary";
		// Default tab for first time it's rendered this session
		if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = "skills";
		return parts.reduce((tabs, partId) => {
			const tab = {
				cssClass: "",
				group: tabGroup,
				// Matches tab property to
				id: "",
				// FontAwesome Icon, if you so choose
				icon: "",
				// Run through localization
				label: "op.tab.",
			};
			switch (partId) {
				case "agent":
				case "tabs":
					return tabs;
				case "skills":
					tab.id = "skills";
					tab.label += "skills";
					break;
				case "abilities":
					tab.id = "abilities";
					tab.label += "abilities";
					break;
				case "effects":
					tab.id = "effects";
					tab.label += "effects";
					break;
				case "rituals":
					tab.id = "rituals";
					tab.label += "rituals";
					break;
				case "biography":
					tab.id = "biography";
					tab.label += "biography";
					break;
				case "inventory":
					tab.id = "inventory";
					tab.label += "inventory";
					break;
			}
			if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = "active";
			tabs[partId] = tab;
			return tabs;
		}, {});
	}

	/**
	 *
	 */
	get progressRuleIsNivel() {
		const rule = game.settings.get("ordemparanormal", "globalProgressRules");
		return rule == 2 ? true : false;
	}

	/**
	 *
	 */
	get usingWithoutSanityRule() {
		return game.settings.get("ordemparanormal", "globalPlayingWithoutSanity");
	}

	/**
	 *
	 */
	get progressRuleIsNEX() {
		const rule = game.settings.get("ordemparanormal", "globalProgressRules");
		return rule == 1 ? true : false;
	}

	/**
	 *
	 */
	get isSurvivor() {
		return this.document.system._isSurvivor ?? false;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItems(context) {
		const details = { origin: null, class: null, path: null };
		const protection = [];
		const generalEquipment = [];
		const armament = [];
		const rituals = {
			valid: { 1: [], 2: [], 3: [], 4: [] },
			invalid: [],
		};
		const abilities = {
			// 1 = Origem 2 = Classe 3 = Trilha 4 = Geral 5 = Paranormal 6 = Habilidade/Complicação
			valid: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
			invalid: [],
		};

		// Pega o rótulo global (PE ou PD) que já foi definido no _prepareContext com base na configuração
		const labelCusto = context.custoLabel || "PE";

		// const invalid = [];

		// Iterate through items, allocating to containers
		for (const i of this.document.items) {
			i.img = i.img || DEFAULT_TOKEN;

			// Creating the data to use an item
			i.system.using = !i.system.using ? [true, "fas"] : i.system.using;

			// Append to protections.
			if (i.type === "protection") {
				protection.push(i);
			}
			// Append to general equipment.
			else if (i.type === "generalEquipment") {
				generalEquipment.push(i);
			}
			// Append to armament.
			else if (i.type === "armament") {
				armament.push(i);
			}
			// Append to item.
			else if (i.type === "item") {
				gear.push(i);
			}
			// Append to rituals.
			else if (i.type === "ritual") {
				if (i.system.circle != 5) rituals.valid[i.system.circle].push(i);
				else rituals.invalid.push(i);
			}
			// Append to abilities.
			else if (i.type === "ability") {
				const abilityType = i.system.abilityType;
				const costVal = i.system.cost || "";

				// Em vez de ler i.system.costType, usamos a configuração global (labelCusto)
				i.displayCost = costVal !== "" ? `${costVal} ${labelCusto}` : "—";

				if (i.system.activation) {
					i.activationLabel = game.i18n.localize(`op.executionChoices.${i.system.activation}`);
				} else {
					i.activationLabel = "—";
				}

				if (abilityType === "origin") abilities.valid[1].push(i);
				else if (abilityType === "class") abilities.valid[2].push(i);
				else if (abilityType === "path") abilities.valid[3].push(i);
				else if (abilityType === "general") abilities.valid[4].push(i);
				else if (abilityType === "paranormal") abilities.valid[5].push(i);
				else if (abilityType === "ability" || abilityType === "complication") abilities.valid[6].push(i);
				else if (!abilityType) abilities.invalid.push(i);
			} else if (i.type === "origin") {
				details.origin = i;
			} else if (i.type === "class") {
				details.class = i;
			} else if (i.type === "path") {
				details.path = i;
			}
		}

		for (const s of Object.values(rituals.valid)) {
			s.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		}

		for (const s of Object.values(abilities.valid)) {
			s.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		}

		context.details = details;
		context.rituals = rituals;
		context.abilities = abilities;
		context.protection = protection.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		context.generalEquip = generalEquipment.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		context.armament = armament.sort((a, b) => (a.sort || 0) - (b.sort || 0));
	}

	/**
	 * Calculates skill totals for sheet display only.
	 *
	 * @param {Record<string, object>} skills Actor skills.
	 * @returns {Record<string, number>} Skill totals indexed by skill key.
	 */
	_prepareSkillTotals(skills = {}) {
		return Object.fromEntries(
			Object.entries(skills).map(([key, skill]) => {
				const degree = Number(skill.degree?.value ?? 0);
				const bonuses = Number(skill.value ?? 0);
				const modifier = Number(skill.mod ?? 0);

				return [key, degree + bonuses + modifier];
			})
		);
	}

	/**
	 * Actions performed after any render of the Application.
	 * Post-render steps are not awaited by the render process.
	 * @param {ApplicationRenderContext} context      Prepared context data
	 * @param {RenderOptions} options                 Provided render options
	 * @protected
	 * @override
	 */
	async _onRender(context, options) {
		await super._onRender(context, options);
		this.#disableOverrides();

		for (const input of this.element.querySelectorAll("input[type='number']")) {
			input.addEventListener("change", this._onChangeInputOP.bind(this));
		}

		for (const button of this.element.querySelectorAll(".adjustment-button")) {
			button.addEventListener("click", this._onAdjustInput.bind(this));
		}

		// V13 DOM API (no jQuery)
		for (const toggle of this.element.querySelectorAll(".item-toggle")) {
			toggle.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopPropagation();

				// Find parent item and description
				const li = event.currentTarget.closest(".item");
				const desc = li.querySelector(".item-description");
				console.log(li, desc.style.display);

				if (desc) {
					const computedDisplay = window.getComputedStyle(desc).display;
					if (computedDisplay === "none") {
						desc.style.display = "block";
					} else {
						desc.style.display = "none";
					}
				}
			});
		}

		for (const compendium of this.element.querySelectorAll(".compendium-event-contextmenu")) {
			compendium.addEventListener("contextmenu", this._onOpenCompendiumEntry.bind(this));
		}

		for (const compendium of this.element.querySelectorAll(".compendium-event-click")) {
			compendium.addEventListener("click", this._onOpenCompendiumEntry.bind(this));
		}
	}

	/**
	 * Define os controles extras no cabeçalho (header) da janela.
	 * @returns {ApplicationHeaderControlsEntry[]}
	 */
	_getHeaderControls() {
		// Puxa os controles padrões do Foundry (Fechar, Configurar Ficha, etc.)
		const controls = super._getHeaderControls();

		if (this.actor.isOwner) {
			// unshift() coloca o botão no começo da fila (mais à esquerda entre os botões da direita).
			controls.unshift({
				action: "openConfig",
				icon: "fas fa-id-card",
				label: "Configurações do Agente",
			});
		}

		return controls;
	}

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	/**
	 * Handle changing a Document's image.
	 *
	 * @this BoilerplateActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @returns {Promise}
	 * @protected
	 */
	static async #onEditImage(event, target) {
		const attr = target.dataset.edit;
		const current = foundry.utils.getProperty(this.document, attr);
		const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
		// V13: Use namespaced FilePicker
		const fp = new foundry.applications.apps.FilePicker({
			current,
			type: "image",
			redirectToRoot: img ? [img] : [],
			callback: (path) => {
				this.document.update({ [attr]: path });
			},
			top: this.position.top + 40,
			left: this.position.left + 10,
		});
		return fp.browse();
	}

	/**
	 * Open the agent configuration dialog.
	 *
	 * @this OrdemActorSheet
	 * @param {PointerEvent} event
	 * @param {HTMLElement} target
	 */
	static #openConfig(event, target) {
		event.preventDefault();
		new AgentConfigApp(this.document).render({ force: true });
	}

	/**
	 * Renders an embedded document's sheet
	 *
	 * @this BoilerplateActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _viewDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		doc.sheet.render(true);
	}

	/**
	 * Handles item deletion
	 *
	 * @this BoilerplateActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _deleteDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		await doc.delete();
	}

	/**
	 * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
	 *
	 * @this BoilerplateActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createDoc(event, target) {
		// Retrieve the configured document class for Item or ActiveEffect
		const docCls = getDocumentClass(target.dataset.documentClass);

		// Prepare the document creation data by initializing it a default name.
		const docData = {
			name: docCls.defaultName({
				// defaultName handles an undefined type gracefully
				type: target.dataset.type,
				parent: this.actor,
			}),
		};
		// Loop through the dataset and add it to our docData
		for (const [dataKey, value] of Object.entries(target.dataset)) {
			// These data attributes are reserved for the action handling
			if (["action", "documentClass"].includes(dataKey)) continue;
			foundry.utils.setProperty(docData, dataKey, value);
		}

		// Finally, create the embedded document!
		await docCls.create(docData, { parent: this.actor });
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	static async #onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = foundry.utils.duplicate(header.dataset);
		// Initialize a default name.
		const name = game.i18n.localize("op.newItem") + " " + game.i18n.localize("TYPES.Item." + type);
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			system: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system["type"];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	/**
	 * Determines effect parent to pass to helper
	 *
	 * @this BoilerplateActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _toggleEffect(event, target) {
		const effect = this._getEmbeddedDocument(target);
		await effect.update({ disabled: !effect.disabled });
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

	/**
	 * Handle opening a skill's compendium entry
	 * @param {Event} event	 The originating click event
	 * @private
	 */
	async _onOpenCompendiumEntry(event) {
		const parent = event.currentTarget.closest("li") ?? event.currentTarget;
		const key = parent.dataset.key ?? null;
		console.log(parent, key);
		if (!key || !CONFIG.op.CompendiumEntries[key]) return;
		const entryKey = CONFIG.op.CompendiumEntries[key];
		await foundry.documents.collections.Journal._showEntry(entryKey, true);
	}

	/** */
	static async _onToggleResources(event, target) {
		event.preventDefault();
		// Pega o estado atual (ou false se não existir)
		const currentState = this.actor.getFlag("ordemparanormal", "showResources") || false;
		// Salva o inverso (!currentState)
		await this.actor.setFlag("ordemparanormal", "showResources", !currentState);
	}

	/** */
	static _onToggleDescription(event) {
		event.preventDefault();
		const li = event.currentTarget.closest(".item");
		const itemId = li.dataset.itemId;

		if (this.expanded.has(itemId)) {
			this.expanded.delete(itemId);
		} else {
			this.expanded.add(itemId);
		}
		this.render();
	}

	/**
	 *
	 * @param {*} event
	 * @returns
	 */
	async _onAdjustInput(event) {
		const button = event.currentTarget;
		const { action } = button.dataset;
		const input = button.parentElement.querySelector("input");
		const min = input.min ? Number(input.min) : -Infinity;
		const max = input.max ? Number(input.max) : Infinity;
		let value = Number(input.value);
		if (isNaN(value)) return;
		value += action === "increase" ? 1 : -1;
		input.value = Math.clamp(value, min, max);
		input.dispatchEvent(new Event("change"));
	}

	/**
	 *
	 * @param {*} event
	 * @returns
	 */
	async _onChangeInputOP(event, target) {
		const itemId = event.currentTarget.closest("[data-item-id]")?.dataset.itemId;
		if (!itemId) return;

		event.stopImmediatePropagation();
		const item = this.document.items.get(itemId);
		const min = event.target.min !== "" ? Number(event.target.min) : -Infinity;
		const max = event.target.max !== "" ? Number(event.target.max) : Infinity;
		const value = Math.clamp(event.target.valueAsNumber, min, max);

		if (!item || Number.isNaN(value)) return;

		event.target.value = value;
		item.update({ [event.target.dataset.name]: value });
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onDropActiveEffect(event, data) {
		// const effect = await ActiveEffect.implementation.fromDropData(data);
		// if (effect?.target === this.actor) return false;
		// return super._onDropActiveEffect(event, data);
		const aeCls = getDocumentClass("ActiveEffect");
		const effect = await aeCls.fromDropData(data);
		if (!this.actor.isOwner || !effect) return false;
		if (effect.target === this.actor) return this._onSortActiveEffect(event, effect);
		return aeCls.create(effect, { parent: this.actor });
	}

	/**
	 * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
	 *
	 * @param {DragEvent} event
	 * @param {ActiveEffect} effect
	 */
	async _onSortActiveEffect(event, effect) {
		/** @type {HTMLElement} */
		const dropTarget = event.target.closest("[data-effect-id]");
		if (!dropTarget) return;
		const target = this._getEmbeddedDocument(dropTarget);

		// Don't sort on yourself
		if (effect.uuid === target.uuid) return;

		// Identify sibling items based on adjacent HTML elements
		const siblings = [];
		for (const el of dropTarget.parentElement.children) {
			const siblingId = el.dataset.effectId;
			const parentId = el.dataset.parentId;
			if (siblingId && parentId && (siblingId !== effect.id || parentId !== effect.parent.id))
				siblings.push(this._getEmbeddedDocument(el));
		}

		// Perform the sort
		const sortUpdates = SortingHelpers.performIntegerSort(effect, {
			target,
			siblings,
		});

		// Split the updates up by parent document
		const directUpdates = [];

		const grandchildUpdateData = sortUpdates.reduce((items, u) => {
			const parentId = u.target.parent.id;
			const update = { _id: u.target.id, ...u.update };
			if (parentId === this.actor.id) {
				directUpdates.push(update);
				return items;
			}
			if (items[parentId]) items[parentId].push(update);
			else items[parentId] = [update];
			return items;
		}, {});

		// Effects-on-items updates
		for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
			await this.actor.items.get(itemId).updateEmbeddedDocuments("ActiveEffect", updates);
		}

		// Update on the main actor
		return this.actor.updateEmbeddedDocuments("ActiveEffect", directUpdates);
	}

	/**
	 * Handle dropping of an Actor data onto another Actor sheet
	 * @param {DragEvent} event            The concluding DragEvent which contains drop data
	 * @param {object} data                The data transfer extracted from the event
	 * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
	 *                                     not permitted.
	 * @protected
	 */
	async _onDropActor(event, data) {
		if (!this.actor.isOwner) return false;
	}

	/* -------------------------------------------- */

	/**
	 * Handle creating a new message with data of item for send to chat.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	static async #onSendChat(event, target) {
		event.preventDefault();

		const itemId = target.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);

		if (item.system.description) ChatMessage.create({ content: item.system.chatDescription || item.system.description });
	}

	/**
	 * Handle marks an item whether it is used or not and changes the icon
	 * @param {Event} event   The originating click event
	 * @private
	 */
	static async #onMarkItem(event, target) {
		event.preventDefault();

		const itemId = target.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);

		if (!item.system.using || item.system.using.state === false) {
			return item.update({ "system.using": { state: true, class: "fas" } });
		} else {
			return item.update({ "system.using": { state: false, class: "far" } });
		}
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	static async #onRoll(event, target) {
		event.preventDefault();
		const dataset = target.dataset;

		// Handle item rolls.
		if (dataset.rollType) {
			if (dataset.rollType == "item") {
				const itemId = target.closest(".item").dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			}
		}
	}

	/**
	 * Handle rolling an Ability test or saving throw.
	 * @param {Event} event      The originating click event.
	 * @private
	 */
	static #onRollAttributeTest(event, target) {
		event.preventDefault();
		const attribute = target.closest("[data-key]").dataset.key;
		this.actor.rollAttribute({ attribute, event });
	}

	/**
	 * Handle rolling a Skill check.
	 * @param {Event} event      The originating click event.
	 * @returns {Promise<Roll>}  The resulting roll.
	 * @private
	 */
	static #onRollSkillCheck(event, target) {
		event.preventDefault();
		const skill = target.closest("[data-key]").dataset.key;
		return this.actor.rollSkill({ skill, event });
	}

	/* -------------------------------------------- */

	/** Helper Functions */

	/**
	 * Fetches the embedded document representing the containing HTML element
	 *
	 * @param {HTMLElement} target    The element subject to search
	 * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
	 */
	_getEmbeddedDocument(target) {
		const docRow = target.closest("[data-document-class]");
		if (!docRow) return console.warn("Element with data-document-class not found in the DOM hierarchy.");
		if (docRow.dataset.documentClass === "Item") {
			return this.actor.items.get(docRow.dataset.itemId);
		} else if (docRow.dataset.documentClass === "ActiveEffect") {
			const parent =
				docRow.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(docRow?.dataset.parentId);
			return parent.effects.get(docRow?.dataset.effectId);
		} else return console.warn("Could not find document class");
	}

	/**
	 * Callback actions which occur when a dragged element is dropped on a target.
	 * @param {DragEvent} event       The originating DragEvent
	 * @protected
	 */
	async _onDrop(event) {
		// V13: Use namespaced TextEditor
		const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
		const actor = this.actor;
		// CANCELABLE HOOK — `dropActorSheetData` listeners MUST be synchronous;
		// async listeners return a Promise (truthy) and cannot block the drop.
		const allowed = Hooks.call("dropActorSheetData", actor, this, data);
		if (allowed === false) return;

		// Handle different data types
		switch (data.type) {
			case "ActiveEffect":
				return this._onDropActiveEffect(event, data);
			case "Actor":
				return this._onDropActor(event, data);
			case "Item":
				return this._onDropItem(event, data);
			case "Folder":
				return this._onDropFolder(event, data);
		}
	}

	// -------------------------------------

	/* -------------------------------------------- */

	/**
	 * Handle dropping of an item reference or item data onto an Actor Sheet
	 * @param {DragEvent} event            The concluding DragEvent which contains drop data
	 * @param {object} data                The data transfer extracted from the event
	 * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
	 * @protected
	 */
	async _onDropItem(event, data) {
		if (!this.actor.isOwner) return false;

		const actor = this.actor;
		const item = await Item.implementation.fromDropData(data);
		const details = ["class", "origin", "path"];

		if (details.includes(item.type)) {
			const dataModel = CONFIG.Item.dataModels[item.type];
			const singleton = dataModel?.metadata?.singleton ?? false;
			const existingItems = actor.itemTypes[item.type];

			if (singleton && actor.itemTypes[item.type].length) {
				const existingItem = existingItems[0]; // Pega o item atual da ficha

				// Pausa o código e abre a janela de confirmação do Foundry
				const confirmar = await Dialog.confirm({
					title: `Substituir ${item.type.toUpperCase()}?`,
					content: `
            <p>Seu personagem já possui <strong>${existingItem.name}</strong>.</p>
            <p>Deseja substituí-lo por <strong>${item.name}</strong>?</p>
          `,
					yes: () => true,
					no: () => false,
					defaultYes: false,
				});

				if (confirmar) {
					await actor.deleteEmbeddedDocuments("Item", [existingItem.id]);
					ui.notifications.info(`${existingItem.name} foi removido.`);
				} else {
					return false;
				}
			}
		}

		// Handle item sorting within the same Actor
		if (this.actor.uuid === item.parent?.uuid) {
			return this._onSortItem(event, item);
		}

		// Create the owned item
		try {
			return await this._onDropItemCreate(item.toObject(), event);
		} catch (error) {
			console.error("Erro ao criar item no ator:", error);
			ui.notifications.error(`Erro ao adicionar item: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Handle dropping of a Folder on an Actor Sheet.
	 * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
	 * @param {DragEvent} event     The concluding DragEvent which contains drop data
	 * @param {object} data         The data transfer extracted from the event
	 * @returns {Promise<Item[]>}
	 * @protected
	 */
	async _onDropFolder(event, data) {
		if (!this.actor.isOwner) return [];
		const folder = await Folder.implementation.fromDropData(data);
		if (folder.type !== "Item") return [];
		const droppedItemData = await Promise.all(
			folder.contents.map(async (item) => {
				if (!(document instanceof Item)) item = await fromUuid(item.uuid);
				return item;
			})
		);
		return this._onDropItemCreate(droppedItemData, event);
	}

	/**
	 * Handle the final creation of dropped Item data on the Actor.
	 * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
	 * @param {object[]|object} itemData      The item data requested for creation
	 * @param {DragEvent} event               The concluding DragEvent which provided the drop data
	 * @returns {Promise<Item[]>}
	 * @private
	 */
	async _onDropItemCreate(itemData, event) {
		itemData = itemData instanceof Array ? itemData : [itemData];

		// Converter objetos Item para dados antes de criar
		const itemDataArray = itemData.map((item) => {
			if (item instanceof Item) return item.toObject();
			return item;
		});

		return this.actor.createEmbeddedDocuments("Item", itemDataArray);
	}

	/**
	 * Open compendium when clicking on an empty item slot.
	 * @param {PointerEvent} event
	 * @param {HTMLElement} target
	 */
	static #findItem(event, target) {
		event.preventDefault();

		const reference = target.dataset.reference;

		const compendiumMap = CONFIG.op.CompendiumEntries;

		const packKey = compendiumMap[reference];

		if (packKey) {
			const pack = game.packs.get(packKey);
			if (pack) {
				// Abre a janela do compêndio na tela do jogador
				pack.render(true);
			} else {
				ui.notifications.warn(`O compêndio de ${reference} (${packKey}) não foi encontrado no sistema.`);
			}
		}
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
