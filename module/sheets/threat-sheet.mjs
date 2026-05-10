/* eslint-disable new-cap */
import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { ResistanceConfig } from "../applications/resistance-config.mjs";
import { TraitsConfig } from "../applications/traits-config.mjs";

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
		this.tabGroups = { primary: "attacks" };
	}

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["ordemparanormal", "sheet", "actor", "threat", "themed", "theme-light"],
		tag: "form",
		position: { width: 600, height: 820 },
		window: {
			resizable: true,
			title: "Ficha de Ameaça",
		},
		form: {
			submitOnChange: true,
		},
		// Mapeamento de Ações (data-action="nomeDaAcao")
		actions: {
			onTab: this.prototype._onTab,
			onEditImage: this.prototype._onEditImage,

			// Rolagens
			onRollAttributeTest: this.#onRollAttributeTest,
			onRollSkillCheck: this.#onRollSkillCheck,
			onRollSkill: this.#onRollSkill,
			onRollMentalDamage: this.#onRollMentalDamage,
			onRoll: this.#onRoll,

			// Gestão de Itens e Efeitos
			createDoc: this.prototype._onCreateDoc,
			createThreatAttack: OrdemThreatSheet.#onCreateThreatAttack,
			editThreatAttack: OrdemThreatSheet.#onEditThreatAttack,
			viewDoc: this.prototype._onViewDoc,
			deleteDoc: this.prototype._onDeleteDoc,
			toggleDescription: this.prototype._onToggleDescription,
			toggleEffect: this.prototype._onToggleEffect,
			// Configurações
			openResistanceConfig: this.#onOpenResistanceConfig,
			openTraitsConfig: this.#onOpenTraitsConfig,
		},
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
	};

	/** @inheritDoc */
	static PARTS = {
		threat: { id: "sheet", template: "systems/ordemparanormal/templates/threat/actor-threat-sheet.hbs" },
		tabs: { id: "tabs", template: "templates/generic/tab-navigation.hbs" },
		attacks: { id: "attacks", template: "systems/ordemparanormal/templates/threat/parts/threat-attacks.hbs" },
		abilities: { id: "abilities", template: "systems/ordemparanormal/templates/threat/parts/threat-abilities.hbs" },
		enigmas: { id: "enigmas", template: "systems/ordemparanormal/templates/threat/parts/threat-enigmas.hbs" },
		effects: { id: "effects", template: "systems/ordemparanormal/templates/shared/effects.hbs" },
	};

	/** @inheritDoc */
	static TABS = {
		primary: {
			tabs: [
				{ id: "attacks", label: "op.tab.attacks" },
				{ id: "abilities", label: "op.tab.abilities" },
				{ id: "enigmas", label: "op.tab.enigmas" },
				{ id: "effects", label: "op.tab.effects" },
			],
			initial: "attacks",
		},
	};

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		// Not all parts always render
		options.parts = ["threat", "tabs"];
		// Don't show the other tabs if only limited view
		if (this.document.limited) return;
		// Control which parts show based on document subtype
		switch (this.document.type) {
			case "threat":
				options.parts.push("attacks", "abilities", "enigmas", "effects");
				break;
			case "npc":
				options.parts.push("gear", "effects");
				break;
		}
	}

	/** @override */
	_onRender(context, options) {
		// Re-bind do Drag & Drop após renderizar
		this.#dragDrop.forEach((d) => d.bind(this.element));
		this.#disableOverrides();

		for (const input of this.element.querySelectorAll("input[type='number']")) {
			input.addEventListener("change", this._onChangeInputOP.bind(this));
		}

		for (const button of this.element.querySelectorAll(".adjustment-button")) {
			button.addEventListener("click", this._onAdjustInput.bind(this));
		}

		// V13 DOM API (no jQuery)
		for (const compendiumSkill of this.element.querySelectorAll(".compendium-skill")) {
			compendiumSkill.addEventListener("contextmenu", this._onOpenCompendiumEntry.bind(this));
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
			tabs: this._getTabs(options.parts),
		});

		// Prepara visualização de Resistências e Características
		this._prepareResistances(context);
		this._prepareTraits(context);

		// Prepara Itens e Perícias
		this._prepareItems(context);

		return context;
	}

	/**
	 * Handle opening a skill's compendium entry
	 * @param {Event} event	 The originating click event
	 * @private
	 */
	async _onOpenCompendiumEntry(event) {
		const parent = event.currentTarget.closest("li") ?? event.currentTarget;
		const skill = parent.dataset.key ?? null;
		if (!skill || !CONFIG.op.skillCompendiumEntries[skill]) return;
		const entryKey = CONFIG.op.skillCompendiumEntries[skill];
		await foundry.documents.collections.Journal._showEntry(entryKey, true);
	}

	/**
	 *  Separei a lógica de resistências para limpar o _prepareContext
	 * */
	_prepareResistances(context) {
		context.viewResistances = {};
		const allDamageTypes = CONFIG.op.dropdownDamageType || {};
		const actorResistances = context.system.resistances || {};

		for (const [key] of Object.entries(allDamageTypes)) {
			const resData = actorResistances[key] || { value: 0, vulnerable: false, immune: false };
			// Mostra apenas se tiver algum valor relevante
			const isVisible = resData.value > 0 || resData.vulnerable === true || resData.immune === true;

			context.viewResistances[key] = {
				...resData,
				isVisible: isVisible,
				translatedLabel: game.i18n.localize(`op.damageTypeAbv.${key}`),
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

		for (const [key] of Object.entries(allTraitsTypes)) {
			const traitData = actorTraits[key];
			// Mostra apenas se tiver algum valor relevante
			const isVisible = traitData == undefined || traitData === true;

			context.viewTraits[key] = {
				...traitData,
				isVisible: isVisible,
				translatedLabel: game.i18n.localize(`op.traits.${key}`),
			};
		}
	}

	/** */
	_prepareItems(context) {
		const attacks = [];
		const abilities = [];

		for (const i of this.document.items) {
			i.img = i.img || DEFAULT_TOKEN;

			if (i.type === "armament") {
				const rangeType = i.system.types?.rangeType?.name;
				const itemBonus = i.system.formulas?.attack?.bonus;

				let attrKey = rangeType === "ranged" ? "dex" : "str";
				let skillKey = rangeType === "ranged" ? "aim" : "fighting";

				if (i.system.formulas?.attack?.attr) attrKey = i.system.formulas.attack.attr;
				if (i.system.formulas?.attack?.skill) skillKey = i.system.formulas.attack.skill;

				const attrValue = this.actor.system.attributes[attrKey]?.value || 0;
				const diceString = attrValue > 0 ? `${attrValue}d20` : "2d20kl1";
				const skillLabel = game.i18n.localize(`op.skill.${skillKey}`) || skillKey;

				let attackLabel = `${diceString} + ${skillLabel}`;
				if (itemBonus && itemBonus != 0) attackLabel += ` + ${itemBonus}`;
				i.attackLabel = attackLabel;

				const dmgFormula = i.system.formulas?.damage?.formula || "0";
				const dmgTypeKey = i.system.formulas?.damage?.type;
				const dmgTypeLabel = dmgTypeKey ? game.i18n.localize(`op.damageTypeAbv.${dmgTypeKey}`) : "";
				i.damageLabel = `${dmgFormula} ${dmgTypeLabel}`;

				// Enrich threat-specific attack metadata
				const actionType = i.system.actionType ?? "standard";
				i.actionTypeBadge = {
					label: game.i18n.localize(`op.actionType.${actionType}`),
					cls: actionType,
				};
				i.numberOfAttacks = i.system.numberOfAttacks ?? 1;
				i.rangeCategoryLabel = i.system.rangeCategory
					? game.i18n.localize(`op.rangeCategory.${i.system.rangeCategory}`)
					: "";

				attacks.push(i);
			} else if (i.type === "ability") {
				const costVal = i.system.cost || "—";
				const costType = i.system.costType || "PE";
				i.displayCost = costVal !== "—" && costVal !== "" && costVal != 0 ? `${costVal} ${costType}` : "—";

				if (i.system.activation) {
					i.activationLabel = game.i18n.localize(`op.executionChoices.${i.system.activation}`);
				} else {
					i.activationLabel = "—";
				}

				abilities.push(i);
			}
		}

		attacks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		abilities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

		context.attacks = attacks;
		context.abilities = abilities;
	}

	/** */
	async _preparePartContext(partId, context) {
		switch (partId) {
			// Enrich biography info for display
			// Enrichment turns text like `[[/r 1d20]]` into buttons
			case "attacks":
				context.tab = context.tabs[partId];
				break;
			case "enigmas":
				context.tab = context.tabs[partId];
				context.enrichedFearRiddle = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					this.actor.system.details.fearRiddle,
					{
						secrets: this.document.isOwner,
						rollData: this.actor.getRollData(),
						relativeTo: this.actor,
					}
				);
				break;
			case "abilities":
				context.tab = context.tabs[partId];
				context.enrichedAbilities = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					this.actor.system.temporary.abilities,
					{
						secrets: this.document.isOwner,
						rollData: this.actor.getRollData(),
						relativeTo: this.actor,
					}
				);
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

	/** */
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
				case "threat":
				case "tabs":
					return tabs;
				case "attacks":
					tab.id = "attacks";
					tab.label += "attacks";
					break;
				case "abilities":
					tab.id = "abilities";
					tab.label += "abilities";
					break;
				case "enigmas":
					tab.id = "enigmas";
					tab.label += "enigmas";
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

	/** */
	_getEmbeddedDocument(target) {
		const docRow = target.closest("li[data-document-class]");
		if (!docRow) return null;
		if (docRow.dataset.documentClass === "Item") {
			return this.actor.items.get(docRow.dataset.itemId);
		} else if (docRow.dataset.documentClass === "ActiveEffect") {
			return Array.from(this.actor.allApplicableEffects()).find((e) => e.id === docRow.dataset.effectId) ?? null;
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
		// V13: Use namespaced FilePicker
		const fp = new foundry.applications.apps.FilePicker({
			current,
			type: "image",
			redirectToRoot: img ? [img] : [],
			callback: (path) => this.document.update({ [attr]: path }),
			top: this.position.top + 40,
			left: this.position.left + 10,
		});
		return fp.browse();
	}

	// CORREÇÃO: Passando o objeto corretamente para evitar o erro "One of original or other are not Objects"
	/** */
	static #onRollAttributeTest(event, target) {
		event.preventDefault();
		const attribute = target.dataset.key;
		if (this.actor.rollAttribute) {
			this.actor.rollAttribute({ attribute, event });
		} else {
			console.error("Função rollAttribute não encontrada no ator.");
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
		const skill = target.closest("[data-key]").dataset.key;
		return this.actor.rollSkill({ skill, event });
	}

	/** */
	static async #onRollSkill(event, target) {
		event.preventDefault();
		const skillKey = target.dataset.key;
		const attrKey = target.dataset.attr;
		const label = target.dataset.label;

		const skillData = this.document.system.skills[skillKey] || {};

		// Valores de bônus
		const degreeValues = { untrained: 0, trained: 5, veteran: 10, expert: 15, master: 20 };

		const currentDegreeLabel = skillData.degree?.label || "untrained";
		const skillValue = degreeValues[currentDegreeLabel] || 0;
		const attrValue = this.document.system.attributes[attrKey]?.value || 0;

		// 0 Atributo rola 2d20kl1, senão rola Xd20kh1
		const diceFormula = attrValue > 0 ? `${attrValue}d20kh` : "2d20kl";
		const formula = `${diceFormula} + ${skillValue}`;

		const roll = await new Roll(formula, this.actor.getRollData()).evaluate();
		await roll.toMessage({
			flavor: `Teste de ${label} <span style="font-size: 0.8em; color: gray">(${attrKey.toUpperCase()})</span>`,
			speaker: ChatMessage.getSpeaker({ actor: this.document }),
		});
	}

	/** */
	static async #onRollMentalDamage(event, target) {
		event.preventDefault();
		let formula = this.document.system.disturbingPresence.mentalDamage;

		// Tenta pegar do input se não estiver salvo
		if (!formula || formula.trim() === "") {
			const inputElement = target.closest("div").querySelector("input");
			if (inputElement) formula = inputElement.value;
		}

		if (!formula || formula.trim() === "") {
			return ui.notifications.warn(game.i18n.localize("op.disturbingPresence.noFormula"));
		}

		try {
			const roll = await new Roll(formula, this.actor.getRollData()).evaluate();
			await roll.toMessage({
				flavor: game.i18n.localize("op.disturbingPresence.mentalDamageRollFlavor"),
				speaker: ChatMessage.getSpeaker({ actor: this.document }),
			});
		} catch (err) {
			ui.notifications.error(`${game.i18n.localize("op.disturbingPresence.errorFormula")} ${err.message}`);
		}
	}

	/** */
	async _onCreateDoc(event, target) {
		event.preventDefault();
		const docClass = target.dataset.documentClass;
		const docCls = getDocumentClass(docClass);

		if (docClass === "ActiveEffect") {
			const effectData = {
				name: docCls.defaultName({ parent: this.document }),
				icon: "icons/svg/aura.svg",
			};
			await docCls.create(effectData, { parent: this.document });
		} else {
			const type = target.dataset.type;
			const docData = {
				name: docCls.defaultName({ type: type, parent: this.document }),
				type: type,
				system: {},
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
		value += action === "increase" ? 5 : -5;
		input.value = Math.clamp(value, min, max);
		input.dispatchEvent(new Event("change"));
	}

	/**
	 *
	 * @param {*} event
	 * @returns
	 */
	async _onChangeInputOP(event) {
		event.stopImmediatePropagation();
		const min = event.target.min !== "" ? Number(event.target.min) : -Infinity;
		const max = event.target.max !== "" ? Number(event.target.max) : Infinity;
		const value = Math.clamp(event.target.valueAsNumber, min, max);

		if (Number.isNaN(value)) return;

		event.target.value = value;
		await this.document.update({ [event.target.dataset.name]: value });
	}

	/** */
	async _onToggleDescription(event, target) {
		const li = target.closest("li");
		const summary = li.querySelector(".item-summary");
		if (summary) {
			summary.remove();
		} else {
			const item = this._getEmbeddedDocument(li);
			if (!item) return;
			const div = document.createElement("div");
			div.classList.add("item-summary");
			div.style.flexBasis = "100%";
			div.style.padding = "5px 10px";
			div.style.fontSize = "0.9em";
			div.style.borderTop = "1px dashed #ccc";
			div.style.marginTop = "5px";
			div.innerHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description, {
				secrets: this.document.isOwner,
				rollData: this.actor.getRollData(),
				async: true,
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

	/** Build the HTML content for the threat attack dialog. */
	static #buildAttackDialogContent(existing = null) {
		const damageTypes = CONFIG.op?.dropdownDamageType ?? {};
		const attributes = CONFIG.op?.attributes ?? {};
		// Limit to skills actually present on ThreatData.skills — using one outside the
		// schema would crash rollAttack later when reading skill.degree.
		const threatSkillKeys = [
			"fighting",
			"aim",
			"resilience",
			"reflexes",
			"will",
			"initiative",
			"perception",
			"freeSkill",
		];
		const allAttackSkills = CONFIG.op?.attackSkills ?? {};
		const attackSkills = Object.fromEntries(Object.entries(allAttackSkills).filter(([k]) => threatSkillKeys.includes(k)));

		const selectOpts = (obj, selected = "") =>
			Object.entries(obj)
				.map(([k, v]) => `<option value="${k}" ${k === selected ? "selected" : ""}>${game.i18n.localize(v)}</option>`)
				.join("");

		const actionTypeOpts = ["standard", "free", "movement", "reaction", "full"]
			.map(
				(k) =>
					`<option value="${k}" ${(existing?.actionType ?? "standard") === k ? "selected" : ""}>${game.i18n.localize(
						`op.actionType.${k}`
					)}</option>`
			)
			.join("");

		const rangeCatOpts = ["", "short", "medium", "long", "extreme"]
			.map(
				(k) =>
					`<option value="${k}" ${(existing?.rangeCategory ?? "") === k ? "selected" : ""}>${
						k ? game.i18n.localize(`op.rangeCategory.${k}`) : "—"
					}</option>`
			)
			.join("");

		const isRanged = existing ? existing.types?.rangeType?.name === "ranged" : false;

		return `
<div class="threat-attack-dialog" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px;">
  <label>${game.i18n.localize("op.name")}<input name="name" type="text" value="${
			existing?.name ?? ""
		}" style="width:100%;margin-top:2px;" /></label>
  <label>${game.i18n.localize(
			"op.actionType.label"
		)}<select name="actionType" style="width:100%;margin-top:2px;">${actionTypeOpts}</select></label>
  <label>${game.i18n.localize(
			"op.numberOfAttacks"
		)}<input name="numberOfAttacks" type="number" min="1" max="8" value="${
			existing?.numberOfAttacks ?? 1
		}" style="width:100%;margin-top:2px;" /></label>
  <label>${game.i18n.localize("op.RollAttribute")}<select name="attr" style="width:100%;margin-top:2px;">${selectOpts(
			attributes,
			existing?.formulas?.attack?.attr ?? "str"
		)}</select></label>
  <label>${game.i18n.localize("op.skill.label")}<select name="skill" style="width:100%;margin-top:2px;">${selectOpts(
			attackSkills,
			existing?.formulas?.attack?.skill ?? "fighting"
		)}</select></label>
  <label>${game.i18n.localize("op.bonus")}<input name="atkBonus" type="number" value="${
			existing?.formulas?.attack?.bonus ?? 0
		}" style="width:100%;margin-top:2px;" /></label>
  <label>${game.i18n.localize("op.rangeType.label")}<select name="rangeType" style="width:100%;margin-top:2px;">
    <option value="melee" ${!isRanged ? "selected" : ""}>${game.i18n.localize("op.rangeType.melee")}</option>
    <option value="ranged" ${isRanged ? "selected" : ""}>${game.i18n.localize("op.rangeType.ranged")}</option>
  </select></label>
  <label>${game.i18n.localize(
			"op.rangeCategory.label"
		)}<select name="rangeCategory" style="width:100%;margin-top:2px;">${rangeCatOpts}</select></label>
  <label>${game.i18n.localize("op.formulaDamage")}<input name="dmgFormula" type="text" value="${
			existing?.formulas?.damage?.formula ?? "1d6"
		}" style="width:100%;margin-top:2px;" /></label>
  <label>${game.i18n.localize("op.damage")}<select name="dmgType" style="width:100%;margin-top:2px;">${selectOpts(
			damageTypes,
			existing?.formulas?.damage?.type ?? "impactDamage"
		)}</select></label>
  <label>${game.i18n.localize("op.critical")}<input name="critical" type="text" value="${
			existing?.critical ?? "20"
		}" style="width:100%;margin-top:2px;" /></label>
</div>`;
	}

	/** Open dialog to create a new threat attack (embedded armament item). */
	static async #onCreateThreatAttack(event, _target) {
		event.preventDefault();
		const result = await foundry.applications.api.DialogV2.prompt({
			window: { title: game.i18n.localize("op.atkDialogTitle") },
			content: OrdemThreatSheet.#buildAttackDialogContent(),
			ok: {
				label: game.i18n.localize("op.addThreatAttack"),
				callback: (_event, button) => new FormDataExtended(button.form).object,
			},
		});
		if (!result || !result.name) return;
		await this.actor.createEmbeddedDocuments("Item", [OrdemThreatSheet.#attackFormDataToItem(result)]);
	}

	/** Open dialog to edit an existing threat attack item. */
	static async #onEditThreatAttack(event, target) {
		event.preventDefault();
		const li = target.closest("[data-item-id]");
		const item = this.actor.items.get(li?.dataset.itemId);
		if (!item) return;
		const result = await foundry.applications.api.DialogV2.prompt({
			window: { title: game.i18n.localize("op.editThreatAttack") },
			content: OrdemThreatSheet.#buildAttackDialogContent({ ...item.system, name: item.name }),
			ok: {
				label: game.i18n.localize("op.saveChanges"),
				callback: (_event, button) => new FormDataExtended(button.form).object,
			},
		});
		if (!result) return;
		const update = OrdemThreatSheet.#attackFormDataToItem(result);
		await item.update({ name: update.name, system: update.system });
	}

	/** Convert form data from the attack dialog into an Item creation object. */
	static #attackFormDataToItem(data) {
		return {
			name: data.name || game.i18n.localize("op.attack"),
			type: "armament",
			system: {
				formulas: {
					attack: { attr: data.attr, skill: data.skill, bonus: Number(data.atkBonus) || 0 },
					damage: { formula: data.dmgFormula || "1d6", attr: "", type: data.dmgType, bonus: 0, parts: [] },
					extraFormula: "",
				},
				critical: data.critical || "20",
				proficiency: "simpleWeapons",
				types: { rangeType: { name: data.rangeType === "ranged" ? "ranged" : "melee" } },
				actionType: data.actionType ?? "standard",
				numberOfAttacks: Number(data.numberOfAttacks) || 1,
				rangeCategory: data.rangeCategory ?? "",
				using: { state: true },
				quantity: 1,
				weight: 0,
			},
		};
	}

	/** */
	static async #onOpenResistanceConfig(event, target) {
		event.preventDefault();
		new ResistanceConfig({ document: this.document }).render(true);
	}

	/** */
	static async #onOpenTraitsConfig(event, target) {
		event.preventDefault();
		new TraitsConfig({ document: this.document }).render(true);
	}

	/* -------------------------------------------- */
	/* Drag & Drop                                  */
	/* -------------------------------------------- */

	/** */
	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = { dragstart: this._canDragStart.bind(this), drop: this._canDragDrop.bind(this) };
			d.callbacks = {
				dragstart: this._onDragStart.bind(this),
				dragover: this._onDragOver.bind(this),
				drop: this._onDrop.bind(this),
			};
			return new foundry.applications.ux.DragDrop.implementation(d);
		});
	}

	/** */
	_canDragStart(selector) {
		return this.isEditable;
	}

	/** */
	_canDragDrop(selector) {
		return this.isEditable;
	}

	/** */
	_onDragStart(event) {
		const docRow = event.currentTarget.closest("li");
		if (event.target.dataset.link) return;
		const item = this._getEmbeddedDocument(docRow);
		if (!item) return;
		event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
	}

	/** */
	_onDragOver(event) {}

	/** */
	async _onDrop(event) {
		// V13: Use namespaced TextEditor
		const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
		if (!this.actor.isOwner) return false;
		if (data.type === "Item") return this._onDropItem(event, data);
		if (data.type === "ActiveEffect") return this._onDropActiveEffect(event, data);
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
			return await this.actor.createEmbeddedDocuments("Item", [itemData]);
		} catch (error) {
			console.error("Erro ao criar item na ameaça:", error);
			ui.notifications.error(`Erro ao adicionar item: ${error.message}`);
			throw error;
		}
	}

	/** */
	async _onDropActiveEffect(event, data) {
		const aeCls = getDocumentClass("ActiveEffect");
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
