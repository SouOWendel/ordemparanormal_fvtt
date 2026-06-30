/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import BasicRoll from "../dice/basic-roll.mjs";
import SkillToolRollConfigurationDialog from "../applications/skill-tool-configuration-dialog.mjs";
import AttributeRollConfigurationDialog from "../applications/attribute-configuration-dialog.mjs";
import { calculateSpaces, calculateDefense } from "../helpers/actor-calculations.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class OrdemActor extends Actor {
	/**
	 *
	 */
	get progressRuleIsNivel() {
		const rule = game.settings.get("ordemparanormal", "globalProgressRules");
		return rule === 2;
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
		return rule === 1;
	}

	/**
	 *
	 */
	get isSurvivor() {
		return this.system.class === "survivor";
	}

	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/**
	 *  Prepare data related to this DataModel itself, before any derived data (including Active Effects)
	 *  is computed. This is especially useful for initializing numbers, arrays, and sets you expect to
	 *  be modified by active effects
	 */
	/** @override */
	prepareBaseData() {
		super.prepareBaseData();
	}

	/** @override */
	prepareDerivedData() {
		super.prepareDerivedData();
		if (this.type === "agent") {
			this._prepareItemsDerivedData(this, this.system);
			this._prepareActorSpaces(this);
			// Defense must run after items and spaces — both mutate system.defense.value
			const sys = this.system;
			const result = calculateDefense(
				sys.defense.value,
				sys.attributes.dex.value,
				sys.skills.reflexes.degree.value,
				sys.skills.reflexes.mod || 0
			);
			sys.defense.value = result.value;
			sys.defense.dodge = result.dodge;
		}
	}

	/**
	 * Prepare and calcule the spaces of actors
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareActorSpaces(ActorData) {
		const system = ActorData.system;
		const spaces = (system.spaces ??= {});
		const FOR = system.attributes.str.value || 0;

		const physicalItems = ["armament", "generalEquipment", "protection"];
		const weight = ActorData.items.reduce((w, i) => {
			if (!physicalItems.includes(i.type)) return w;
			const q = i.system.quantity || 0;
			const iw = i.system.using.state ? i.system.weight || 0 : 0;
			return w + q * iw;
		}, 0);

		const result = calculateSpaces(weight, FOR, spaces.bonus);
		spaces.value = result.value;
		spaces.max = result.max;
		spaces.pct = result.pct;
		spaces.over = result.over;
		spaces.pctMax = result.pctMax;

		if (result.isOverweight) {
			system.desloc.value += -3;
			system.defense.value += -5;
		}
		if (result.isDoubleOverweight) ui.notifications.warn(game.i18n.localize("WARN.overWeight"));
	}

	/**
	 * Prepare and calcule the data of items
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItemsDerivedData(actorData, system) {
		const protections = actorData.items.filter((item) => item.type === "protection");
		for (const p of protections) {
			if (typeof p.system.defense === "number" && p.system.using.state === true) {
				system.defense.value += p.system.defense;
			}
		}
	}

	/** @inheritDoc */
	applyActiveEffects(phase) {
		// 1. Preparar dados para rolagem (para resolver variáveis como @NEX.value)
		// Atenção: Aqui só estarão disponíveis os dados base (prepareBaseData),
		// pois os dados derivados ainda não foram calculados.
		const rollData = this.getRollData();

		// 2. Iterar sobre todos os efeitos aplicáveis ao ator
		// (Isso inclui efeitos do próprio ator e efeitos transferidos de itens)
		const effects = this.allApplicableEffects();

		for (const effect of effects) {
			if (effect.disabled) continue;

			// Iterar sobre as mudanças (changes) de cada efeito
			for (const change of effect.changes) {
				// Verifica se o valor é uma string e contém "@" indicando uma variável
				if (typeof change.value === "string" && change.value.includes("@")) {
					try {
						// Substitui as variáveis pelos valores reais do ator
						// Ex: "@NEX.value" vira "50"
						const formula = Roll.replaceFormulaData(change.value, rollData);

						// Avalia a expressão matemática com segurança
						// Ex: "50 * 1" vira 50
						const result = Roll.safeEval(formula);

						// Atualiza o valor na memória para ser aplicado corretamente pelo Foundry
						// Importante: Convertemos para string pois o sistema espera isso em alguns casos
						change.value = result.toString();
					} catch (e) {
						console.error(`Ordem Paranormal | Erro ao calcular fórmula no efeito "${effect.name}":`, e);
					}
				}
			}
		}

		// 3. Executa a lógica padrão do sistema (hook prepareEmbeddedData)
		if (game.release.generation < 14) phase ??= "initial";
		if (this.system?.prepareEmbeddedData instanceof Function && phase === "initial") {
			this.system.prepareEmbeddedData();
		}

		// 4. Chama o método original para aplicar os valores já calculados
		return super.applyActiveEffects(phase);
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const actorData = this;
		const system = super.getRollData();

		// Cálculo da Formula de Iniciativa (@rollInitiative)
		const agi = system.attributes?.dex?.value || 0;
		const diceFormula = agi > 0 ? `${agi}d20kh` : "2d20kl";

		let bonus = 0;
		// Verifica se a perícia de iniciativa existe (vale para Agente e Ameaça)
		if (system.skills?.initiative) {
			const degree = system.skills.initiative.degree?.value || 0;
			const mod = Number(system.skills.initiative.mod) || 0; // Modificador manual (opcional)
			const flatValue = Number(system.skills.initiative.value) || 0;
			bonus = (degree > 0 ? degree : flatValue) + mod;
		}

		system.rollInitiative = `${diceFormula} + ${bonus}`;

		// Adiciona referências diretas para Active Effects
		// Isso permite que variáveis como @NEX.value, @PV.value, etc. funcionem nos efeitos ativos
		return {
			...system,
			NEX: system.NEX,
			PV: system.PV,
			PE: system.PE,
			PD: system.PD,
			SAN: system.SAN,
			defense: system.defense,
			desloc: system.desloc,
			attributes: system.attributes,
			skills: system.skills,
		};
	}

	/**
	 * Roll an Ability Check.
	 * @param {Partial<AbilityRollProcessConfiguration>} config  Configuration information for the roll.
	 * @param {Partial<BasicRollDialogConfiguration>} dialog     Configuration for the roll dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} message   Configuration for the roll message.
	 * @returns {Promise<D20Roll[]|null>}                        A Promise which resolves to the created Roll instance.
	 */
	async #rollAttributeCheck(type, config = {}, dialog = {}, message = {}) {
		const attributeLabel = game.i18n.localize(CONFIG.op.attributes[config.attribute] ?? "");
		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					window: {
						title: game.i18n.format("op.AttributePromptTitle", { attribute: attributeLabel }),
						subtitle: this.name,
					},
				},
			},
			dialog
		);
		return this.#rollD20Test("check", config, dialogConfig, message);
	}

	/**
	 * @typedef {D20RollProcessConfiguration} AbilityRollProcessConfiguration
	 * @property {string} [ability]  ID of the ability to roll as found in `CONFIG.op.abilities`.
	 */

	/**
	 * Shared rolling functionality between ability checks & saving throws.
	 * @param {"check"} type                     								 D20 test type.
	 * @param {Partial<AbilityRollProcessConfiguration>} config  Configuration information for the roll.
	 * @param {Partial<BasicRollDialogConfiguration>} dialog     Configuration for the roll dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} message   Configuration for the roll message.
	 * @returns {Promise<D20Roll[]|null>}               A Promise which resolves to the created Roll instance.
	 */
	async #rollD20Test(type, config = {}, dialog = {}, message = {}) {
		const name = "AttributeCheck";
		const oldName = "AttributeTest";

		const attribute = this.system.attributes?.[config.attribute];
		const attributeConfig = game.i18n.localize(CONFIG.op.attributes[config.attribute]);

		const rollData = this.getRollData();
		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts(
			{
				// bonus: attribute?.bonus,
				// prof: ability?.[`${type}Prof`].hasProficiency ? ability[`${type}Prof`].term : null,
				// [`${config.ability}${type.capitalize()}Bonus`]: ability?.bonuses[type],
				// [`${type}Bonus`]: this.system.bonuses?.abilities?.[type],
				// cover: (config.ability === 'dex') && (type === 'save') ? this.system.attributes?.ac?.cover : null
			},
			rollData
		);
		const options = {};

		const buildConfig = this._buildAttributesConfig.bind(this, type);

		const rollConfig = foundry.utils.mergeObject(
			{
				attributeId: config.attribute,
			},
			config
		);
		// const rollConfig = config;
		rollConfig.hookNames = [...(config.hookNames ?? []), name, "d20Test"];
		rollConfig.rolls = [BasicRoll.mergeConfigs({ parts, data, options }, config.rolls?.shift())].concat(
			config.rolls ?? []
		);
		// rollConfig.rolls.forEach(({ parts, data }) => this.addRollExhaustion(parts, data));
		rollConfig.subject = this;

		// const dialogConfig = foundry.utils.deepClone(dialog);
		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: AttributeRollConfigurationDialog,
				options: {
					buildConfig,
					chooseAbility: false,
				},
			},
			dialog
		);

		const messageConfig = foundry.utils.mergeObject(
			{
				create: true,
				data: {
					flags: {
						ordemparanormal: {
							messageType: "roll",
							roll: {
								attribute: config.attribute,
								type: "attribute",
							},
						},
					},
					flavor: game.i18n.format("op.AttributePromptTitle", { attribute: attributeConfig ?? "" }),
					speaker: ChatMessage.getSpeaker({ actor: this }),
				},
			},
			message
		);

		const rolls = await CONFIG.Dice.D20Roll.build(rollConfig, dialogConfig, messageConfig);

		message.rollMode = messageConfig.rollMode;

		if (!rolls.length) return null;

		return rolls;
	}

	/* -------------------------------------------- */

	/**
	 * Roll a generic ability test or saving throw.
	 * Prompt the user for input on which variety of roll they want to do.
	 * @param {Partial<AbilityRollProcessConfiguration>} config  Configuration information for the roll.
	 * @param {Partial<BasicRollDialogConfiguration>} dialog     Configuration for the roll dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} message   Configuration for the roll message.
	 */
	rollAttribute(config = {}, dialog = {}, message = {}) {
		const attributeId = config.attribute;
		const attributeLabel = game.i18n.localize(CONFIG.op.attributes[attributeId] ?? "");
		// new foundry.applications.api.Dialog({
		// 	window: { title: `${game.i18n.format('op.AbilityPromptTitle', { ability: label })}: ${this.name}` },
		// 	position: { width: 400 },
		// 	content: `<p>${game.i18n.format('op.AbilityPromptText', { ability: label })}</p>`,
		// 	buttons: [
		// 		{
		// 			action: 'test',
		// 			label: game.i18n.localize('op.ActionAbil'),
		// 			callback: () => this.rollAttributeCheck(config, dialog, message)
		// 		}
		// 	]
		// }).render({ force: true });

		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					window: {
						title: game.i18n.format("op.AttributePromptTitle", { attribute: attributeLabel }),
						subtitle: this.name,
					},
				},
			},
			dialog
		);

		return this.#rollAttributeCheck("attribute", config, dialogConfig, message);
	}

	/* -------------------------------------------- */

	/**
	 * Roll an ability check with a skill.
	 * @param {Partial<SkillToolRollProcessConfiguration>} config  Configuration information for the roll.
	 * @param {Partial<SkillToolRollDialogConfiguration>} dialog   Configuration for the roll dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} message     Configuration for the roll message.
	 * @returns {Promise<D20Roll[]|null>}                          A Promise which resolves to the created Roll instance.
	 */
	async rollSkill(config = {}, dialog = {}, message = {}) {
		const skillLabel = game.i18n.localize(CONFIG.op.skills[config.skill] ?? "");
		const ability = this.system.skills[config.skill]?.attr[0] ?? "";
		const abilityLabel = game.i18n.localize(CONFIG.op.attributes[ability] ?? "");
		const dialogConfig = foundry.utils.mergeObject(
			{
				options: {
					window: {
						title: game.i18n.format("op.SkillPromptTitle", { skill: skillLabel, ability: abilityLabel }),
						subtitle: this.name,
					},
				},
			},
			dialog
		);

		return this.#rollSkillTool("skill", config, dialogConfig, message);
	}

	/**
	 * Shared rolling functionality between skill & tool checks.
	 * @param {"skill"|"tool"} type                                Type of roll.
	 * @param {Partial<SkillToolRollProcessConfiguration>} config  Configuration information for the roll.
	 * @param {Partial<SkillToolRollDialogConfiguration>} dialog   Configuration for the roll dialog.
	 * @param {Partial<BasicRollMessageConfiguration>} message     Configuration for the roll message.
	 * @returns {Promise<D20Roll[]|null>}                          A Promise which resolves to the created Roll instance.
	 */
	async #rollSkillTool(type, config = {}, dialog = {}, message = {}) {
		// const name = type === 'skill' ? 'Skill' : 'ToolCheck';
		const name = "Skill";

		const skillConfig = game.i18n.localize(CONFIG.op.skills[config.skill]);

		// const toolConfig = CONFIG.op.tools[config.tool];
		if (type === "skill" && !skillConfig) {
			return this.#rollAttributeCheck(type, config, dialog, message);
		}

		const relevant = this.system.skills[config.skill];
		const buildConfig = this._buildSkillToolConfig.bind(this, type);

		const rollConfig = foundry.utils.mergeObject(
			{
				attributeId: relevant?.attr[0] ?? skillConfig.ability,
				advantage: false /* relevant?.roll.mode === CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE, */,
				disadvantage: false /* relevant?.roll.mode === CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE, */,
				// halflingLucky: this.getFlag('ordemparanormal', 'halflingLucky'),
				// reliableTalent: (relevant?.value >= 1) && this.getFlag('ordemparanormal', 'reliableTalent')
			},
			config
		);
		rollConfig.hookNames = [...(config.hookNames ?? []), type, "abilityCheck", "d20Test"];
		rollConfig.rolls = [
			BasicRoll.mergeConfigs(
				{
					options: {
						// maximum: relevant?.roll.max,
						// minimum: relevant?.roll.min
					},
				},
				config.rolls?.shift()
			),
		].concat(config.rolls ?? []);
		rollConfig.subject = this;

		const dialogConfig = foundry.utils.mergeObject(
			{
				applicationClass: SkillToolRollConfigurationDialog,
				options: {
					buildConfig,
					chooseAbility: true,
				},
			},
			dialog
		);

		const abilityLabel = game.i18n.localize(CONFIG.op.attributes[relevant?.attr[0] ?? ""]);
		const messageConfig = foundry.utils.mergeObject(
			{
				create: true,
				data: {
					flags: {
						ordemparanormal: {
							messageType: "roll",
							roll: {
								[`${type}Id`]: config[type],
								type,
							},
						},
					},
					flavor: game.i18n.format("op.SkillPromptTitle", { skill: skillConfig, ability: abilityLabel }),
					speaker: ChatMessage.getSpeaker({ actor: this }),
				},
			},
			message
		);

		const rolls = await CONFIG.Dice.D20Roll.build(rollConfig, dialogConfig, messageConfig);

		if (!rolls.length) return null;

		return rolls;
	}

	/**
	 * Configure a roll config for each roll performed as part of the skill or tool check process. Will be called once
	 * per roll in the process each time an option is changed in the roll configuration interface.
	 * @param {"skill"|"tool"} type                          Type of roll.
	 * @param {D20RollProcessConfiguration} process          Configuration for the entire rolling process.
	 * @param {D20RollConfiguration} config                  Configuration for a specific roll.
	 * @param {FormDataExtended} [formData]                  Any data entered into the rolling prompt.
	 * @param {number} index                                 Index of the roll within all rolls being prepared.
	 */
	_buildSkillToolConfig(type, process, config, formData, index) {
		const skill = this.system.skills?.[process.skill];
		const rollData = this.getRollData();
		const attributeId = formData?.get("attribute") ?? process.attributeId;
		const attribute = this.system.attributes?.[attributeId];
		const prof = skill.degree.value; // this.system.calculateAbilityCheckProficiency(relevant?.effectValue ?? 0, attributeId);
		const hasProficiency = skill.degree.value > 0;

		// TODO: Local para adicionar possíveis partes adicionais de bônus. É preciso aprofundamento no método de constructParts;
		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts(
			{
				prof: hasProficiency ? prof : null,
				mod: skill?.mod || null,
				extraBonus: skill.value || null,
			},
			{ ...rollData }
		);

		// Add exhaustion reduction
		// this.addRollExhaustion(parts, data);

		config.parts = [...(config.parts ?? []), ...parts];
		config.data = { ...data, ...(config.data ?? {}) };
		config.data.attributeId = attributeId;
	}

	/** */
	_buildAttributesConfig(type, process, config, formData, index) {
		const rollData = this.getRollData();
		const attributeId = formData?.get("attribute") ?? process.attributeId;
		const attribute = this.system.attributes?.[attributeId];

		// TODO: Local para adicionar possíveis partes adicionais de bônus. É preciso aprofundamento no método de constructParts;
		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts(
			{
				// prof: hasProficiency ? prof : null,
				// mod: skill?.mod || null,
				// extraBonus: skill.value || null,
				// [`${config[type]}Bonus`]: relevant?.bonuses?.check,
				// [`${abilityId}CheckBonus`]: ability?.bonuses?.check,
				// [`${type}Bonus`]: this.system.bonuses?.abilities?.[type],
				// abilityCheckBonus: this.system.bonuses?.abilities?.check
			},
			{ ...rollData }
		);

		config.parts = [...(config.parts ?? []), ...parts];
		config.data = { ...data, ...(config.data ?? {}) };
		config.data.attributeId = attributeId;
	}
}
