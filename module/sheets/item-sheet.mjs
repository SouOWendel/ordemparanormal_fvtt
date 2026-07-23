/* eslint-disable new-cap */
import { prepareActiveEffectCategories } from "../helpers/effects.mjs";

const { api, sheets } = foundry.applications;
const DragDrop = foundry.applications.ux.DragDrop;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class OrdemItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
	/** */
	constructor(options = {}) {
		super(options);
		this._isEditingDescription = false;
		this._isEditingChatDescription = false;
	}

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "op-item-sheet", "sheet", "item", "themed", "theme-light"],
		position: {
			width: 540,
			height: "auto",
		},
		actions: {
			onEditImage: this.#onEditImage,
			viewDoc: this.#viewEffect,
			createDoc: this.#createEffect,
			deleteDoc: this.#deleteEffect,
			toggleEffect: this.#toggleEffect,
			onDamageControl: this.#onDamageControl,
			editDescription: this.#toggleDescriptionEdit,
			editChatDescription: this.#toggleDescriptionEdit,
		},
		form: {
			submitOnChange: true,
		},
		window: {
			resizable: true,
			title: "DCC.ActorSheetTitle", // Just the localization key
		},
		// Custom property that's merged into `this.options`
		dragDrop: [{ dragSelector: ".draggable", dropSelector: null }],
	};

	/** @override */
	static PARTS = {
		header: { template: "systems/ordemparanormal/templates/item/item-header.hbs" },
		tabs: { template: "templates/generic/tab-navigation.hbs" }, // Foundry-provided generic template
		description: {
			template: "systems/ordemparanormal/templates/item/parts/item-description.hbs",
			scrollable: [".scrollable"],
		},
		abilityAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-ability-attributes.hbs",
			scrollable: [".scrollable"],
		},
		armamentCombat: {
			template: "systems/ordemparanormal/templates/item/parts/item-armament-combat.hbs",
			scrollable: [".scrollable"],
		},
		armamentSpec: {
			template: "systems/ordemparanormal/templates/item/parts/item-armament-spec.hbs",
			scrollable: [".scrollable"],
		},
		generalAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-general-attributes.hbs",
			scrollable: [".scrollable"],
		},
		protectionAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-protection-attributes.hbs",
			scrollable: [".scrollable"],
		},
		ritualAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-ritual-attributes.hbs",
			scrollable: [".scrollable"],
		},
		originAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-origin-attributes.hbs",
			scrollable: [".scrollable"],
		},
		pathAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-path-attributes.hbs",
			scrollable: [".scrollable"],
		},
		classAttr: {
			template: "systems/ordemparanormal/templates/item/parts/item-class-attributes.hbs",
			scrollable: [".scrollable"],
		},
		effects: { template: "systems/ordemparanormal/templates/shared/effects.hbs", scrollable: [".scrollable"] },
	};

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		// Not all parts always render
		options.parts = ["header", "tabs"];
		// Don't show the other tabs if only limited view
		if (this.document.limited) return;
		// Control which parts show based on document subtype
		switch (this.document.type) {
			case "ability":
				options.parts.push("description", "abilityAttr", "effects");
				break;
			case "armament":
				options.parts.push("description", "armamentCombat", "armamentSpec", "effects");
				break;
			case "generalEquipment":
				options.parts.push("description", "generalAttr", "effects");
				break;
			case "protection":
				options.parts.push("description", "protectionAttr", "effects");
				break;
			case "ritual":
				options.parts.push("description", "ritualAttr", "effects");
				break;
			case "origin":
				options.parts.push("description", "originAttr", "effects");
				break;
			case "path":
				options.parts.push("description", "pathAttr", "effects");
				break;
			case "class":
				options.parts.push("description", "classAttr", "effects");
				break;
		}
	}

	/* -------------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		// Retrieve base data structure.
		const context = await super._prepareContext(options);

		foundry.utils.mergeObject(context, {
			item: this.item,
			editable: this.isEditable,
			owner: this.document.isOwner,
			limited: this.document.limited,

			system: this.item.system,
			flags: this.item.flags,
			config: CONFIG.op,
			tabs: this._getTabs(options.parts),
			usingWithoutSanityRule: this.usingWithoutSanityRule,

			// Armament's Dropdowns
			optionWeaponType: CONFIG.op.dropdownWeaponType,
			optionWeaponSubType: CONFIG.op.dropdownWeaponSubType,
			optionGripType: CONFIG.op.dropdownWeaponGripType,
			optionWeaponAmmunition: CONFIG.op.dropdownWeaponAmmunition,
			optionProficiency: CONFIG.op.dropdownProficiency,
			optionDamageType: CONFIG.op.dropdownDamageType,
			optionPowerType: CONFIG.op.dropdownPowerType,
			optionRange: CONFIG.op.dropdownRange,
			optionTarget: CONFIG.op.dropdownTarget,
			optionArea: CONFIG.op.dropdownArea,
			optionAreaType: CONFIG.op.dropdownAreaType,
			optionDuration: CONFIG.op.dropdownDuration,
			optionResistance: CONFIG.op.dropdownResistance,
			optionSkillResis: CONFIG.op.dropdownSkillResis,
			optionElement: CONFIG.op.dropdownElement,
			// Attack and Damage Dropdown
			attributes: CONFIG.op.attributes,
			attackSkills: CONFIG.op.attackSkills,
			// Ritual's Dropdowns
			optionExecution: CONFIG.op.dropdownExecution,
			optionOrigins: CONFIG.op.dropdownOrigins,
			optionPaths: CONFIG.op.dropdownPath,
			optionClassChoices: CONFIG.op.dropdownClass,
			// Item's Radiobox
			categories: CONFIG.op.categories,
			degree: CONFIG.op.ritualDegree,
		});

		context.editingDescription = this._isEditingDescription;
		context.editingChatDescription = this._isEditingChatDescription;

		// https://foundryvtt.com/api/classes/foundry.abstract.Document.html#updateDocuments
		// https://foundryvtt.com/api/classes/foundry.abstract.Document.html#deleteDocuments

		return context;
	}

	/** @override */
	async _preparePartContext(partId, context) {
		switch (partId) {
			case "header":
				context.tab = context.tabs[partId];
				context.isPhysical = ["protection", "armament", "generalEquipment"].includes(this.document.type);
				break;
			case "tabs":
				context.tab = context.tabs[partId];
				break;
			case "description":
				context.tab = context.tabs[partId];
				context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					this.item.system.description,
					{
						secrets: this.document.isOwner,
						relativeTo: this.item,
						rollData: this.item.getRollData(),
					}
				);
				context.enrichedChatDescription = this.item.system.chatDescription
					? await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.chatDescription, {
							secrets: this.document.isOwner,
							relativeTo: this.item,
							rollData: this.item.getRollData(),
					  })
					: null;
				break;
			case "abilityAttr":
			case "armamentCombat":
			case "armamentSpec":
			case "generalAttr":
			case "protectionAttr":
			case "ritualAttr":
			case "originAttr":
			case "pathAttr":
			case "classAttr":
				context.tab = context.tabs[partId];
				break;
			case "effects":
				context.tab = context.tabs[partId];
				// Prepare active effects for easier access
				context.effects = prepareActiveEffectCategories(this.item.effects);
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
		if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = "description";
		return parts.reduce((tabs, partId) => {
			const tab = {
				cssClass: "",
				group: tabGroup,
				// Matches tab property to
				id: "",
				// FontAwesome Icon, if you so choose
				icon: "",
				// Run through localization
				label: "op.item.tab.",
			};
			switch (partId) {
				case "header":
				case "tabs":
					return tabs;
				case "description":
					tab.id = "description";
					tab.label += "description";
					break;
				case "abilityAttr":
					tab.id = "abilityAttr";
					tab.label += "attributes";
					break;
				case "armamentCombat":
					tab.id = "armamentCombat";
					tab.label += "combat";
					break;
				case "armamentSpec":
					tab.id = "armamentSpec";
					tab.label += "spec";
					break;
				case "generalAttr":
					tab.id = "generalAttr";
					tab.label += "attributes";
					break;
				case "protectionAttr":
					tab.id = "protectionAttr";
					tab.label += "attributes";
					break;
				case "ritualAttr":
					tab.id = "ritualAttr";
					tab.label += "attributes";
					break;
				case "originAttr":
					tab.id = "originAttr";
					tab.label += "attributes";
					break;
				case "pathAttr":
					tab.id = "pathAttr";
					tab.label += "attributes";
					break;
				case "classAttr":
					tab.id = "classAttr";
					tab.label += "attributes";
					break;
				case "effects":
					tab.id = "effects";
					tab.label += "effects";
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
	get usingWithoutSanityRule() {
		return game.settings.get("ordemparanormal", "globalPlayingWithoutSanity");
	}

	/**
	 * Actions performed after any render of the Application.
	 * Post-render steps are not awaited by the render process.
	 * @param {ApplicationRenderContext} context      Prepared context data
	 * @param {RenderOptions} options                 Provided render options
	 * @protected
	 */
	async _onRender(context, options) {
		await super._onRender(context, options);
		new DragDrop.implementation({
			dragSelector: ".draggable",
			dropSelector: null,
			permissions: {
				dragstart: this._canDragStart.bind(this),
				drop: this._canDragDrop.bind(this),
			},
			callbacks: {
				dragstart: this._onDragStart.bind(this),
				dragover: this._onDragOver.bind(this),
				drop: this._onDrop.bind(this),
			},
		}).bind(this.element);

		const attributesContainer = this.element.querySelector(".class-attributes-section");
		const disableCheckbox = this.element.querySelector('input[name="system.disableCalculations"]');

		if (disableCheckbox && attributesContainer) {
			const toggleCombatInputs = () => {
				const inputs = attributesContainer.querySelectorAll("input");

				inputs.forEach((input) => {
					input.disabled = disableCheckbox.checked;
				});
			};

			disableCheckbox.addEventListener("change", toggleCombatInputs);
			toggleCombatInputs();
		}

		// Controle do Fullscreen
		const isEditing = this._isEditingDescription || this._isEditingChatDescription;
		this.element.classList.toggle("op-fullscreen-active", isEditing);

		// --- A SOLUÇÃO: Conectar o evento do ProseMirror ao nosso Layout ---
		const proseMirrors = this.element.querySelectorAll("prose-mirror");
		for (const pm of proseMirrors) {
			// Ouve o clique no botão nativo de "Salvar" do editor
			pm.addEventListener("save", () => {
				// Desliga as nossas variáveis de controle
				this._isEditingDescription = false;
				this._isEditingChatDescription = false;

				// Retorna a janela ao tamanho normal e re-renderiza
				this._toggleWindowSize(false);
				this.render();
			});
		}
	}

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	// --- Controle de tamanho fixo ---
	_toggleWindowSize(isEnteringFullscreen) {
		if (isEnteringFullscreen) {
			// Usamos "auto" para que o CSS assuma o controle do tamanho e do limite máximo
			this.setPosition({ width: 540, height: 540 });
		} else {
			// Retorna para as configurações base
			this.setPosition({ width: this.options.position.width, height: this.options.position.height });
		}
	}

	static #toggleDescriptionEdit(event, target) {
		event.stopPropagation();
		const details = target.closest("details");
		const isChatDescription = details?.classList.contains("chat-description");

		if (isChatDescription) {
			this._isEditingChatDescription = !this._isEditingChatDescription;
		} else {
			this._isEditingDescription = !this._isEditingDescription;
		}

		this._toggleWindowSize(this._isEditingDescription || this._isEditingChatDescription);
		this.render();
	}

	/**
	 * Handle changing a Document's image.
	 *
	 * @this BoilerplateItemSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @returns {Promise}
	 * @protected
	 */
	static async #onEditImage(event, target) {
		const attrElement = target.closest(".profile-img-wrapper")?.querySelector("[data-edit]");
		const attr = attrElement ? attrElement.dataset.edit : "img";

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
	 * Renders an embedded document's sheet
	 *
	 * @this BoilerplateItemSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async #viewEffect(event, target) {
		const effect = this._getEffect(target);
		effect.sheet.render(true);
	}

	/**
	 * Handles item deletion
	 *
	 * @this BoilerplateItemSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async #deleteEffect(event, target) {
		const effect = this._getEffect(target);
		await effect.delete();
	}

	/**
	 * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
	 *
	 * @this BoilerplateItemSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async #createEffect(event, target) {
		// Retrieve the configured document class for ActiveEffect
		const aeCls = getDocumentClass("ActiveEffect");
		// Prepare the document creation data by initializing it a default name.
		// As of v12, you can define custom Active Effect subtypes just like Item subtypes if you want
		const effectData = {
			name: aeCls.defaultName({
				// defaultName handles an undefined type gracefully
				type: target.dataset.type,
				parent: this.item,
			}),
		};
		// Loop through the dataset and add it to our effectData
		for (const [dataKey, value] of Object.entries(target.dataset)) {
			// These data attributes are reserved for the action handling
			if (["action", "documentClass"].includes(dataKey)) continue;
			// Nested properties require dot notation in the HTML, e.g. anything with `system`
			// An example exists in spells.hbs, with `data-system.spell-level`
			// which turns into the dataKey 'system.spellLevel'
			foundry.utils.setProperty(effectData, dataKey, value);
		}

		// Finally, create the embedded document!
		await aeCls.create(effectData, { parent: this.item });
	}

	/**
	 * Determines effect parent to pass to helper
	 *
	 * @this BoilerplateItemSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async #toggleEffect(event, target) {
		const effect = this._getEffect(target);
		await effect.update({ disabled: !effect.disabled });
	}

	/** Helper Functions */

	/**
	 * Fetches the row with the data for the rendered embedded document
	 *
	 * @param {HTMLElement} target  The element with the action
	 * @returns {HTMLLIElement} The document's row
	 */
	_getEffect(target) {
		const li = target.closest(".effect");
		return this.item.effects.get(li?.dataset?.effectId);
	}

	/**
	 *
	 * DragDrop
	 *
	 */

	/**
	 * Define whether a user is able to begin a dragstart workflow for a given drag selector
	 * @param {string} selector       The candidate HTML selector for dragging
	 * @returns {boolean}             Can the current user drag this selector?
	 * @protected
	 */
	_canDragStart(selector) {
		// game.user fetches the current user
		return this.isEditable;
	}

	/**
	 * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
	 * @param {string} selector       The candidate HTML selector for the drop target
	 * @returns {boolean}             Can the current user drop on this selector?
	 * @protected
	 */
	_canDragDrop(selector) {
		// game.user fetches the current user
		return this.isEditable;
	}

	/**
	 * Callback actions which occur at the beginning of a drag start workflow.
	 * @param {DragEvent} event       The originating DragEvent
	 * @protected
	 */
	_onDragStart(event) {
		const li = event.currentTarget;
		if ("link" in event.target.dataset) return;

		let dragData = null;

		// Active Effect
		if (li.dataset.effectId) {
			const effect = this.item.effects.get(li.dataset.effectId);
			dragData = effect.toDragData();
		}

		if (!dragData) return;

		// Set data transfer
		event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
	}

	/**
	 * Callback actions which occur when a dragged element is over a drop target.
	 * @param {DragEvent} event       The originating DragEvent
	 * @protected
	 */
	_onDragOver(event) {}

	/**
	 * Callback actions which occur when a dragged element is dropped on a target.
	 * @param {DragEvent} event       The originating DragEvent
	 * @protected
	 */
	async _onDrop(event) {
		// V13: Use namespaced TextEditor
		const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
		const item = this.item;
		// CANCELABLE HOOK — `dropItemSheetData` listeners MUST be synchronous;
		// async listeners return a Promise (truthy) and cannot block the drop.
		const allowed = Hooks.call("dropItemSheetData", item, this, data);
		if (allowed === false) return;

		// Although you will find implmentations to all doc types here, it is important to keep
		// in mind that only Active Effects are "valid" for items.
		// Actors have items, but items do not have actors.
		// Items in items is not implemented on Foudry per default. If you need an implementation with that,
		// try to search how other systems do. Basically they will use the drag and drop, but they will store
		// the UUID of the item.
		// Folders can only contain Actors or Items. So, fall on the cases above.
		// We left them here so you can have an idea of how that would work, if you want to do some kind of
		// implementation for that.
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

	/* -------------------------------------------- */

	/**
	 * Handle the dropping of ActiveEffect data onto an Actor Sheet
	 * @param {DragEvent} event                  The concluding DragEvent which contains drop data
	 * @param {object} data                      The data transfer extracted from the event
	 * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
	 * @protected
	 */
	async _onDropActiveEffect(event, data) {
		const aeCls = getDocumentClass("ActiveEffect");
		const effect = await aeCls.fromDropData(data);
		if (!this.item.isOwner || !effect) return false;

		if (this.item.uuid === effect.parent?.uuid) return this._onEffectSort(event, effect);
		return aeCls.create(effect, { parent: this.item });
	}

	/**
	 * Sorts an Active Effect based on its surrounding attributes
	 *
	 * @param {DragEvent} event
	 * @param {ActiveEffect} effect
	 */
	_onEffectSort(event, effect) {
		const effects = this.item.effects;
		const dropTarget = event.target.closest("[data-effect-id]");
		if (!dropTarget) return;
		const target = effects.get(dropTarget.dataset.effectId);

		// Don't sort on yourself
		if (effect.id === target.id) return;

		// Identify sibling items based on adjacent HTML elements
		const siblings = [];
		for (const el of dropTarget.parentElement.children) {
			const siblingId = el.dataset.effectId;
			if (siblingId && siblingId !== effect.id) siblings.push(effects.get(el.dataset.effectId));
		}

		// Perform the sort
		const sortUpdates = SortingHelpers.performIntegerSort(effect, {
			target,
			siblings,
		});
		const updateData = sortUpdates.map((u) => {
			const update = u.update;
			update._id = u.target._id;
			return update;
		});

		// Perform the update
		return this.item.updateEmbeddedDocuments("ActiveEffect", updateData);
	}

	/* -------------------------------------------- */

	/**
	 * Handle dropping of an Actor data onto another Actor sheet
	 * @param {DragEvent} event            The concluding DragEvent which contains drop data
	 * @param {object} data                The data transfer extracted from the event
	 * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
	 *                                     not permitted.
	 * @protected
	 */
	async _onDropActor(event, data) {
		if (!this.item.isOwner) return false;
	}

	/* -------------------------------------------- */

	/**
	 * Handle dropping of an item reference or item data onto an Actor Sheet
	 * @param {DragEvent} event            The concluding DragEvent which contains drop data
	 * @param {object} data                The data transfer extracted from the event
	 * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
	 * @protected
	 */
	async _onDropItem(event, data) {
		if (!this.item.isOwner) return false;
	}

	/* -------------------------------------------- */

	/**
	 * Handle dropping of a Folder on an Actor Sheet.
	 * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
	 * @param {DragEvent} event     The concluding DragEvent which contains drop data
	 * @param {object} data         The data transfer extracted from the event
	 * @returns {Promise<Item[]>}
	 * @protected
	 */
	async _onDropFolder(event, data) {
		if (!this.item.isOwner) return [];
	}

	/* -------------------------------------------- */

	/**
	 * Add or remove a damage part from the damage formula.
	 * @param {Event} event             The original click event.
	 * @returns {Promise<OrdemItemSheet>|null}  Item with updates applied.
	 * @private
	 */
	static async #onDamageControl(event, target) {
		event.preventDefault();
		const a = target;

		// Add new damage component
		if (a.classList.contains("add-damage")) {
			await this._onSubmitForm(this.options.form, event); // Submit any unsaved changes
			const damage = this.item.system.formulas.damage;
			return this.item.update({
				"system.formulas.damage.parts": damage.parts.concat([["", ""]]),
			});
		}

		// Remove a damage component
		if (a.classList.contains("delete-damage")) {
			await this._onSubmitForm(this.options.form, event); // Submit any unsaved changes
			const li = a.closest(".damage-formula");
			const damage = foundry.utils.deepClone(this.item.system.formulas.damage);
			damage.parts.splice(Number(li.dataset.damagePart), 1);
			return this.item.update({ "system.formulas.damage.parts": damage.parts });
		}
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	_prepareSubmitData(event, form, formData) {
		if (this._isEditingDescription || this._isEditingChatDescription) {
			this._toggleWindowSize(false);
			this._isEditingDescription = false;
			this._isEditingChatDescription = false;
		}

		// Retorna os dados para que o Foundry faça o salvamento no banco de dados
		return super._prepareSubmitData(event, form, formData);
	}

	/** @inheritDoc */
	_processSubmitData(event, form, submitData) {
		const clone = this.document.clone(foundry.utils.deepClone(submitData));

		// Handle Damage array
		const damage = clone.system?.formulas?.damage;
		if (damage) {
			foundry.utils.setProperty(
				submitData,
				"system.formulas.damage.parts",
				Object.values(damage?.parts || {}).map((d) => [d[0] || "", d[1] || ""])
			);
		}
		super._processSubmitData(event, form, submitData);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onSubmitForm(...args) {
		await super._onSubmitForm(...args);
	}

	/* -------------------------------------------- */

	/**
	 * Sobrescreve o fechamento da janela ("X") para garantir o salvamento
	 * de qualquer texto no ProseMirror antes de destruir a ficha do item.
	 * @override
	 */
	async close(options = {}) {
		if (this.isEditable) {
			// 1. Pede para os editores atualizarem o formulário com o texto atual
			const proseMirrors = this.element?.querySelectorAll("prose-mirror");
			if (proseMirrors) {
				for (const pm of proseMirrors) {
					if (typeof pm.save === "function") pm.save();
				}
			}

			// 2. Força o envio dos dados pro banco antes da janela sumir
			await this.submit();
		}

		// 3. Destrói a janela normalmente (o que já desativa a edição para a próxima abertura)
		return super.close(options);
	}
}
