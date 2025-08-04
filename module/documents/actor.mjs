/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import semverComp from '../../utils/semver-compare.mjs';
import BasicRoll from '../dice/basic-roll.mjs';
import SkillToolRollConfigurationDialog from '../applications/skill-tool-configuration-dialog.mjs';
import AttributeRollConfigurationDialog from '../applications/attribute-configuration-dialog.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class OrdemActor extends Actor {

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
		// A versão atual está entre 12.000 e 12.999?
		return foundry.utils.isNewerVersion(game.version, '12.000') &&
		foundry.utils.isNewerVersion('12.999', game.version);
	}

	/**
	 * 
	 */
	get isSurvivor() {
		return this.system.class == 'survivor';
	}

	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		// Data modifications in this step occur before processing embedded
		// documents or derived data.
		const actorData = this;
		const systemData = actorData.system;

		if (actorData.type == 'agent') {
			this._prepareDataStatus(actorData, systemData);
			this._prepareRituals(actorData);
			this._prepareBaseSkills(systemData);
			this._preparePatent(actorData);
		}
	}

	/**
	 * @override
	 * Augment the basic actor data with additional dynamic data. Typically,
	 * you'll want to handle most of your calculated/derived data in this step.
	 * Data calculated in this step should generally not exist in template.json
	 * (such as ability modifiers rather than ability scores) and should be
	 * available both inside and outside of character sheets (such as if an actor
	 * is queried and has a roll executed directly from it).
	 */
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.ordemparanormal || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		if (actorData.type == 'agent') {
			this._prepareItemsDerivedData(actorData, systemData);
			this._prepareDefense(systemData);
			this._prepareActorSpaces(actorData);
		}
	}

	/**
	 * Method to obtain a suitable variable to calculate attributes. 
	 * @param {*} system 
	 */
	progressCalculation(system) {
		const rule = game.settings.get('ordemparanormal', 'globalProgressRules');
		if (this.isSurvivor) return system.stage.value;
		if (rule == 1) return system.NEX.value < 99 ? Math.floor(system.NEX.value / 5) : 20;
		else if (rule == 2) return system.nivel.value;
	}

	/**
	 * Calculation for PD or PD per round.
	 * @param {*} system 
	 */
	perRoundCalculation(system, progress) {
		if (this.usingWithoutSanityRule) {
			system.PD.perRound = (this.isSurvivor) ? 1 : progress;
		} else {
			if (this.isSurvivor) system.PD.perRound = 1;
			else system.PE.perRound = progress;
		}
	}

	/**
	 *
	 * @param {*} system
	 */
	_prepareDataStatus(actorData, system) {
		const VIG = system.attributes.vit.value;
		const PRE = system.attributes.pre.value;

		const progress = this.progressCalculation(system);
		const progressAdjust = progress - 1;
		const progressIf = progress > 1;

		this.perRoundCalculation(system, progress);

		switch (system.class) {
		case 'fighter':
			system.PV.max = 20 + VIG + (progressIf && progressAdjust * (4 + VIG));
			system.SAN.max = 12 + (progressIf && progressAdjust * 3);

			if (this.usingWithoutSanityRule) system.PD.max = 6 + PRE + (progressIf && progressAdjust * (3 + PRE));
			else system.PE.max = 2 + PRE + (progressIf && progressAdjust * (2 + PRE));
			break;
		case 'specialist':
			system.PV.max = 16 + VIG + (progressIf && progressAdjust * (3 + VIG));
			system.SAN.max = 16 + (progressIf && progressAdjust * 4);

			if (this.usingWithoutSanityRule) system.PD.max = 8 + PRE + (progressIf && progressAdjust * (4 + PRE));
			else system.PE.max = 3 + PRE + (progressIf && progressAdjust * (3 + PRE));
			break;
		case 'occultist':
			system.PV.max = 12 + VIG + (progressIf && progressAdjust * (2 + VIG));
			system.SAN.max = 20 + (progressIf && progressAdjust * 5);

			if (this.usingWithoutSanityRule) system.PD.max = 10 + PRE + (progressIf && progressAdjust * (5 + PRE));
			else system.PE.max = 4 + PRE + (progressIf && progressAdjust * (4 + PRE));
			break;
		case 'survivor':
			system.PV.max = 8 + VIG + (progressIf && progressAdjust * 2);
			system.SAN.max = 8 + (progressIf && progressAdjust * 2);

			if (this.usingWithoutSanityRule) system.PD.max = 4 + PRE + (progressIf && progressAdjust * (2));
			else system.PE.max = 2 + PRE + (progressIf && progressAdjust * 1);
			break;
		default:
			system.PV.max = system.PV.max || 0;
			system.PE.max = system.PE.max || 0;
			system.SAN.max = system.SAN.max || 0;
			break;
		}
	}

	/**
	 *
	 * @param {*} system
	 */
	_prepareDefense(system) {
		const REFLEXES = system.skills.reflexes;
		const AGI = system.attributes.dex.value;
		system.defense.value += AGI;
		system.defense.dodge = system.defense.value + system.skills.reflexes.value + (system.skills.reflexes.mod || 0);
	}

	
	/** */
	calculateSkillProficiency(skill){
		// TODO: inverter a atribuição de valores.
		if (skill.degree.label == 'trained') return 5;
		if (skill.degree.label == 'veteran') return 10;
		if (skill.degree.label == 'expert') return 15;
		return 0;
	}

	/**
	 * Faz um loop das perícias e depois faz algumas verificações para definir a formula de rolagem,
	 * depois disso, salva o valor nas informações.
	 * @param {*} system
	 */
	async _prepareBaseSkills(system) {
		console.time('Tempo de atualização das perícias');
		const attributes = system.attributes;
		const skills = system.skills;

		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [keySkill, skill] of Object.entries(skills)) {
			if (skill && Array.isArray(skill.attr) && skill.attr.length > 0) {
				const requiredAttrKey = skill.attr[0]; // Pega a chave do atributo
		
				// Verifica se o atributo correspondente existe
				if (attributes.hasOwnProperty(requiredAttrKey)) {
					// Atualiza o valor na perícia diretamente
					skill.attr[1] = attributes[requiredAttrKey].value;
				} else {
					// Opcional: Aviso se o atributo não for encontrado
					console.warn(`Atributo '${requiredAttrKey}' necessário para a perícia '${keySkill}' não foi encontrado em system.attributes.`);
				}

				// Definindo constantes para acesso simplificado.
				const overLoad = skill?.conditions?.load || false;
				const needTraining = skill?.conditions?.trained || false;

				// Calculate the modifier using d20 rules.
				skill.degree.value = this.calculateSkillProficiency(skill);

				// Formando o nome com base nas condições de carga e treino da perícia.
				skill.label = game.i18n.localize(CONFIG.op.skills[keySkill]) + (overLoad ? '+' : needTraining ? '*' : '') ?? k;
			}
		}
		console.timeEnd('Tempo de atualização das perícias');
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
		spaces.over, (spaces.pctMax = 0);

		// Get the total weight from items
		const physicalItems = ['armament', 'generalEquipment', 'protection'];
		const weight = ActorData.items.reduce((weight, i) => {
			if (!physicalItems.includes(i.type)) return weight;
			const q = i.system.quantity || 0;
			const w = (i.system.using.state) ? i.system.weight || 0 : 0;
			return weight + q * w;
		}, 0);

		// Populate the final values
		spaces.value = weight.toNearest(0.1);
		spaces.max = FOR !== 0 ? FOR * 5 : 2;

		// Plus bonus
		spaces.value += spaces.bonus.value;
		spaces.max += spaces.bonus.max;

		// TODO: V11 AND V12 SPACE/WEIGHT RETRO COMPATIBILITY
		if (this.isV12) spaces.pct = Math.clamp((spaces.value * 100) / spaces.max, 0, 100);
		else spaces.pct = Math.clamped((spaces.value * 100) / spaces.max, 0, 100);

		// Apply the debuffs
		if (spaces.value > spaces.max) {
			spaces.over = spaces.value - spaces.max;
			system.desloc.value += -3;
			system.defense.value += -5;

			// TODO: V11 AND V12 SPACE/WEIGHT RETRO COMPATIBILITY
			if (this.isV12) spaces.pctMax = Math.clamp((spaces.over * 100) / spaces.max, 0, 100);
			else spaces.pctMax = Math.clamped((spaces.over * 100) / spaces.max, 0, 100);
		}
		if (spaces.value > spaces.max * 2) ui.notifications.warn(game.i18n.localize('WARN.overWeight'));
	}

	/**
	 * A function to calculate and apply all the patent data.
	 * @param {*} ActorData 
	 */
	_preparePatent(ActorData) {
		const patent = ActorData.system.patent;
		const PP = patent.prestigePoints;
		if (PP >= 200) {
			patent.name = 'Agente de Elite';
			patent.itemLimit1 = 3;
			patent.itemLimit2 = 3;
			patent.itemLimit3 = 3;
			patent.itemLimit4 = 2;
			patent.creditLimit = 'Ilimitado';
		} else if (PP >= 100) {
			patent.name = 'Oficial de Operações';
			patent.itemLimit1 = 3;
			patent.itemLimit2 = 3;
			patent.itemLimit3 = 2;
			patent.itemLimit4 = 1;
			patent.creditLimit = 'Alto';
		} else if (PP >= 50) {
			patent.name = 'Agente Especial';
			patent.itemLimit1 = 3;
			patent.itemLimit2 = 2;
			patent.itemLimit3 = 1;
			patent.itemLimit4 = null;
			patent.creditLimit = 'Médio';
		} else if (PP >= 20) {
			patent.name = 'Operador';
			patent.itemLimit1 = 3;
			patent.itemLimit2 = 1;
			patent.itemLimit3 = null;
			patent.itemLimit4 = null;
			patent.creditLimit = 'Médio';
		} else if (PP >= 0) {
			patent.name = 'Recruta';
			patent.itemLimit1 = 2;
			patent.itemLimit2 = null;
			patent.itemLimit3 = null;
			patent.itemLimit4 = null;
			patent.creditLimit = 'Baixo';
		} else {
			patent.name = 'Sem Patente';
			patent.itemLimit1 = null;
			patent.itemLimit2 = null;
			patent.itemLimit3 = null;
			patent.itemLimit4 = null;
			patent.creditLimit = 'Baixo';
		}
	}

	/**
	 *
	 */
	_prepareRituals(ActorData) {
		const system = ActorData.system;
		const ritual = (system.ritual ??= {});
		const calcNEX = system.NEX.value < 99 ? Math.floor(system.NEX.value / 5) : 20;
		if (!this.isSurvivor) {
			ritual.DT = 10 + calcNEX + system.attributes.pre.value;
		} else {
			ritual.DT = 10 + system.attributes.pre.value;
		}
	}

	/**
	 * Prepare and calcule the data of items
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItemsDerivedData(actorData, system) {
		const protections = actorData.items.filter((item) => item.type === 'protection');
		for (const p of protections) {
			if (typeof p.system.defense == 'number' && p.system.using.state == true) {
				system.defense.value += p.system.defense;
			}
		}
	}

	/** @inheritDoc */
	applyActiveEffects() {
		if (this.system?.prepareEmbeddedData instanceof Function) this.system.prepareEmbeddedData();
		return super.applyActiveEffects();
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const actorData = this;
		const system = super.getRollData();

		// Prepare character roll data.
		// this._getAgentRollData(actorData, system);

		return system;
	}

	/**
   * Roll an Ability Check.
   * @param {Partial<AbilityRollProcessConfiguration>} config  Configuration information for the roll.
   * @param {Partial<BasicRollDialogConfiguration>} dialog     Configuration for the roll dialog.
   * @param {Partial<BasicRollMessageConfiguration>} message   Configuration for the roll message.
   * @returns {Promise<D20Roll[]|null>}                        A Promise which resolves to the created Roll instance.
   */
	async #rollAttributeCheck(type, config={}, dialog={}, message={}) {
		const attributeLabel = game.i18n.localize(CONFIG.op.attributes[config.attribute] ?? '');
		const dialogConfig = foundry.utils.mergeObject({
			options: {
				window: {
					title: game.i18n.format('op.AttributePromptTitle', { attribute: attributeLabel }),
					subtitle: this.name
				}
			}
		}, dialog);
		return this.#rollD20Test('check', config, dialogConfig, message);
	}

	/**
   * @typedef {D20RollProcessConfiguration} AbilityRollProcessConfiguration
   * @property {string} [ability]  ID of the ability to roll as found in `CONFIG.DND5E.abilities`.
   */

	/**
   * Shared rolling functionality between ability checks & saving throws.
   * @param {"check"} type                     								 D20 test type.
   * @param {Partial<AbilityRollProcessConfiguration>} config  Configuration information for the roll.
   * @param {Partial<BasicRollDialogConfiguration>} dialog     Configuration for the roll dialog.
   * @param {Partial<BasicRollMessageConfiguration>} message   Configuration for the roll message.
   * @returns {Promise<D20Roll[]|null>}               A Promise which resolves to the created Roll instance.
   */
	async #rollD20Test(type, config={}, dialog={}, message={}) {
		const name = 'AttributeCheck';
		const oldName = 'AttributeTest';

		const attribute = this.system.attributes?.[config.attribute];
		const attributeConfig = game.i18n.localize(CONFIG.op.attributes[config.attribute]);
		
		const rollData = this.getRollData();
		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts({
			// bonus: attribute?.bonus,
			// prof: ability?.[`${type}Prof`].hasProficiency ? ability[`${type}Prof`].term : null,
			// [`${config.ability}${type.capitalize()}Bonus`]: ability?.bonuses[type],
			// [`${type}Bonus`]: this.system.bonuses?.abilities?.[type],
			// cover: (config.ability === 'dex') && (type === 'save') ? this.system.attributes?.ac?.cover : null
		}, rollData);
		const options = {};

		const buildConfig = this._buildAttributesConfig.bind(this, type);

		const rollConfig = foundry.utils.mergeObject({
			attributeId: config.attribute
		}, config);
		// const rollConfig = config;
		rollConfig.hookNames = [...(config.hookNames ?? []), name, 'd20Test'];
		rollConfig.rolls = [
			BasicRoll.mergeConfigs({ parts, data, options }, config.rolls?.shift())
		].concat(config.rolls ?? []);
		// rollConfig.rolls.forEach(({ parts, data }) => this.addRollExhaustion(parts, data));
		rollConfig.subject = this;

		// const dialogConfig = foundry.utils.deepClone(dialog);
		const dialogConfig = foundry.utils.mergeObject({
			applicationClass: AttributeRollConfigurationDialog,
			options: {
				buildConfig,
				chooseAbility: false,
			}
		}, dialog);

		const messageConfig = foundry.utils.mergeObject({
			create: true,
			data: {
				flags: {
					ordemparanormal: {
						messageType: 'roll',
						roll: {
							attribute: config.attribute,
							type: 'attribute'
						}
					}
				},
				flavor: game.i18n.format(
					'op.AttributePromptTitle', { attribute: attributeConfig ?? '' }
				),
				speaker: ChatMessage.getSpeaker({ actor: this })
			}
		}, message);

		const rolls = await CONFIG.Dice.D20Roll.build(rollConfig, dialogConfig, messageConfig);

		message.rollMode = messageConfig.rollMode;

		if ( !rolls.length ) return null;

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
	rollAttribute(config={}, dialog={}, message={}) {
		const attributeId = config.attribute;
		const attributeLabel = game.i18n.localize(CONFIG.op.attributes[attributeId] ?? '');
		// new foundry.applications.api.Dialog({
		// 	window: { title: `${game.i18n.format('DND5E.AbilityPromptTitle', { ability: label })}: ${this.name}` },
		// 	position: { width: 400 },
		// 	content: `<p>${game.i18n.format('DND5E.AbilityPromptText', { ability: label })}</p>`,
		// 	buttons: [
		// 		{
		// 			action: 'test',
		// 			label: game.i18n.localize('DND5E.ActionAbil'),
		// 			callback: () => this.rollAttributeCheck(config, dialog, message)
		// 		}
		// 	]
		// }).render({ force: true });

		const dialogConfig = foundry.utils.mergeObject({
			options: {
				window: {
					title: game.i18n.format('op.AttributePromptTitle', { attribute: attributeLabel}),
					subtitle: this.name
				}
			}
		}, dialog);

		return this.#rollAttributeCheck('attribute', config, dialogConfig, message);
	}

	/* -------------------------------------------- */

	/**
   * Roll an ability check with a skill.
   * @param {Partial<SkillToolRollProcessConfiguration>} config  Configuration information for the roll.
   * @param {Partial<SkillToolRollDialogConfiguration>} dialog   Configuration for the roll dialog.
   * @param {Partial<BasicRollMessageConfiguration>} message     Configuration for the roll message.
   * @returns {Promise<D20Roll[]|null>}                          A Promise which resolves to the created Roll instance.
   */
	async rollSkill(config={}, dialog={}, message={}) {
		const skillLabel = game.i18n.localize(CONFIG.op.skills[config.skill] ?? '');
		const ability = this.system.skills[config.skill]?.attr[0] ?? '';
		const abilityLabel = game.i18n.localize(CONFIG.op.attributes[ability] ?? '');
		const dialogConfig = foundry.utils.mergeObject({
			options: {
				window: {
					title: game.i18n.format('op.SkillPromptTitle', { skill: skillLabel, ability: abilityLabel }),
					subtitle: this.name
				}
			}
		}, dialog);

		return this.#rollSkillTool('skill', config, dialogConfig, message);
	}

	/**
   * Shared rolling functionality between skill & tool checks.
   * @param {"skill"|"tool"} type                                Type of roll.
   * @param {Partial<SkillToolRollProcessConfiguration>} config  Configuration information for the roll.
   * @param {Partial<SkillToolRollDialogConfiguration>} dialog   Configuration for the roll dialog.
   * @param {Partial<BasicRollMessageConfiguration>} message     Configuration for the roll message.
   * @returns {Promise<D20Roll[]|null>}                          A Promise which resolves to the created Roll instance.
   */
	async #rollSkillTool(type, config={}, dialog={}, message={}) {
		// const name = type === 'skill' ? 'Skill' : 'ToolCheck';
		const name = 'Skill';

		const skillConfig = game.i18n.localize(CONFIG.op.skills[config.skill]);

		// const toolConfig = CONFIG.DND5E.tools[config.tool];
		if ( ((type === 'skill') && !skillConfig)) {
			return this.rollAttributeCheck(config, dialog, message);
		}

		const relevant = this.system.skills[config.skill];
		const buildConfig = this._buildSkillToolConfig.bind(this, type);

		const rollConfig = foundry.utils.mergeObject({
			attributeId: relevant?.attr[0] ?? skillConfig.ability,
			advantage: false, /* relevant?.roll.mode === CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE, */
			disadvantage: false, /* relevant?.roll.mode === CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE, */
			// halflingLucky: this.getFlag('ordemparanormal', 'halflingLucky'),
			// reliableTalent: (relevant?.value >= 1) && this.getFlag('ordemparanormal', 'reliableTalent')
		}, config);
		rollConfig.hookNames = [...(config.hookNames ?? []), type, 'abilityCheck', 'd20Test'];
		rollConfig.rolls = [BasicRoll.mergeConfigs({
			options: {
				// maximum: relevant?.roll.max,
				// minimum: relevant?.roll.min
			}
		}, config.rolls?.shift())].concat(config.rolls ?? []);
		rollConfig.subject = this;

		const dialogConfig = foundry.utils.mergeObject({
			applicationClass: SkillToolRollConfigurationDialog,
			options: {
				buildConfig,
				chooseAbility: true
			}
		}, dialog);

		const abilityLabel = game.i18n.localize(CONFIG.op.attributes[relevant?.attr[0] ?? '']);
		const messageConfig = foundry.utils.mergeObject({
			create: true,
			data: {
				flags: {
					ordemparanormal: {
						messageType: 'roll',
						roll: {
							[`${type}Id`]: config[type],
							type
						}
					}
				},
				flavor: game.i18n.format('op.SkillPromptTitle', { skill: skillConfig, ability: abilityLabel }),
				speaker: ChatMessage.getSpeaker({ actor: this })
			}
		}, message);

		const rolls = await CONFIG.Dice.D20Roll.build(rollConfig, dialogConfig, messageConfig);

		if ( !rolls.length ) return null;

		/**
     * A hook event that fires after a skill or tool check has been rolled.
     * @function dnd5e.rollSkillV2
     * @function dnd5e.rollToolCheckV2
     * @memberof hookEvents
     * @param {D20Roll[]} rolls       The resulting rolls.
     * @param {object} data
     * @param {string} [data.skill]   ID of the skill that was rolled as defined in `CONFIG.DND5E.skills`.
     * @param {string} [data.tool]    ID of the tool that was rolled as defined in `CONFIG.DND5E.tools`.
     * @param {Actor5e} data.subject  Actor for which the roll has been performed.
     */
		Hooks.callAll(`dnd5e.roll${name}V2`, rolls, { [type]: config[type], subject: this });

		if ( `dnd5e.roll${name}` in Hooks.events ) {
			foundry.utils.logCompatibilityWarning(
				`The \`dnd5e.roll${name}\` hook has been deprecated and replaced with \`dnd5e.roll${type.capitalize()}V2\`.`,
				{ since: 'DnD5e 4.1', until: 'DnD5e 5.0' }
			);
			Hooks.callAll(`dnd5e.roll${name}`, this, rolls[0], config.skill);
		}

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
		const attributeId = formData?.get('attribute') ?? process.attributeId;
		const attribute = this.system.attributes?.[attributeId];
		const prof = skill.degree.value; // this.system.calculateAbilityCheckProficiency(relevant?.effectValue ?? 0, attributeId);
		const hasProficiency = skill.degree.value > 0;

		// TODO: Local para adicionar possíveis partes adicionais de bônus. É preciso aprofundamento no método de constructParts;
		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts({
			prof: hasProficiency ? prof : null,
			mod: skill?.mod || null,
			extraBonus: skill.value || null,
			// [`${config[type]}Bonus`]: relevant?.bonuses?.check,
			// [`${abilityId}CheckBonus`]: ability?.bonuses?.check,
			// [`${type}Bonus`]: this.system.bonuses?.abilities?.[type],
			// abilityCheckBonus: this.system.bonuses?.abilities?.check
		}, { ...rollData });

		// Add exhaustion reduction
		// this.addRollExhaustion(parts, data);

		config.parts = [...(config.parts ?? []), ...parts];
		config.data = { ...data, ...(config.data ?? {}) };
		config.data.attributeId = attributeId;

	}

	/** */
	_buildAttributesConfig(type, process, config, formData, index) {
		const rollData = this.getRollData();
		const attributeId = formData?.get('attribute') ?? process.attributeId;
		const attribute = this.system.attributes?.[attributeId];

		// TODO: Local para adicionar possíveis partes adicionais de bônus. É preciso aprofundamento no método de constructParts;
		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts({
			// prof: hasProficiency ? prof : null,
			// mod: skill?.mod || null,
			// extraBonus: skill.value || null,
			// [`${config[type]}Bonus`]: relevant?.bonuses?.check,
			// [`${abilityId}CheckBonus`]: ability?.bonuses?.check,
			// [`${type}Bonus`]: this.system.bonuses?.abilities?.[type],
			// abilityCheckBonus: this.system.bonuses?.abilities?.check
		}, { ...rollData });

		config.parts = [...(config.parts ?? []), ...parts];
		config.data = { ...data, ...(config.data ?? {}) };
		config.data.attributeId = attributeId;
	}
}
