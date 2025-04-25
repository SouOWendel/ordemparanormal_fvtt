/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import semverComp from '../../utils/semver-compare.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class OrdemActor extends Actor {
	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
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
		return semverComp(12, game.version, 12.999);
	}

	/**
	 * 
	 */
	get isSurvivor() {
		return this.system.class == 'survivor';
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
				// TODO: inverter a atribuição de valores.
				if (skill.degree.label == 'trained') skill.degree.value = 5;
				else if (skill.degree.label == 'veteran') skill.degree.value = 10;
				else if (skill.degree.label == 'expert') skill.degree.value = 15;
				else skill.degree.value = 0;

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
		console.log(this.isV12);
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
		this._getAgentRollData(actorData, system);

		return system;
	}

	/**
	 * Preparação do dados dos agentes.
	 */
	async _getAgentRollData(actorData, system) {
		if (actorData.type !== 'agent') return;
		// let skillUpper;

		// Copy the skills scores to the top level, so that rolls can use
		// formulas like `@iniciativa.value + 4`.
		// TODO: criar acesso rapido de variavel para outras linguagens
		// if (system.skills) {
		// 	for (const [k, v] of Object.entries(system.skills)) {
		// 		system[k] = foundry.utils.deepClone(v);

		// 		skillUpper = k.charAt(0).toUpperCase() + k.slice(1);
		// 		system[game.i18n.localize('op.skill.' + k).toLowerCase()] = foundry.utils.deepClone(v);
		// 	}
		// }

		// Copy the attributes to the top level, so that rolls can use
		// formulas like `@dex.value`.
		if (system.attributes) {
			for (const [k, v] of Object.entries(system.attributes)) {
				system[k] = foundry.utils.deepClone(v);
			}
		}
		if (system.attributes && system.skills) {
			const mainDice = (this.system.dex.value || 2) + 'd20';
			const rollMode = this.system.dex.value ? 'kh' : 'kl';
			const formula = [];
			formula.push(mainDice + rollMode);
			if (system.skills.initiative.value != 0) formula.push(system.skills.initiative.value);
			if (system.skills.initiative.mod) formula.push(system.skills.initiative.mod);
			system.rollInitiative = formula.join('+');
		}

		// Add level for easier access, or fall back to 0.
		if (system.NEX) {
			system.nex = system.NEX.value ?? 0;
		}
	}
}
