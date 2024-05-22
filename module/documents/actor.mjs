/* eslint-disable no-unused-vars */
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

	/** @override */
	prepareBaseData() {
		// Data modifications in this step occur before processing embedded
		// documents or derived data.
		const actorData = this;
		const systemData = actorData.system;

		if (actorData.type == 'agent') {
			this._migrateData(actorData, systemData);
			this._prepareDataStatus(actorData, systemData);
			this._prepareRituals(actorData);
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
			this._prepareBaseSkills(systemData);
			this._prepareSkills(systemData);
			this._prepareItemsDerivedData(actorData, systemData);
			this._prepareDefense(systemData);
			this._prepareActorSpaces(actorData);
		}
	}

	/**
	 *
	 * @param {*} system
	 */
	_prepareDataStatus(actorData, system) {
		const VIG = system.attributes.vit.value;
		const PRE = system.attributes.pre.value;
		const NEX = system.NEX.value;
		const calcNEX = NEX < 99 ? Math.floor(NEX / 5) : 20;
		const nexAdjust = calcNEX - 1;
		const nexIf = calcNEX > 1;
		system.PE.perRound = calcNEX;
		if (system.class == 'fighter') {
			system.PV.max = 20 + VIG + (nexIf && nexAdjust * (4 + VIG));
			system.PE.max = 2 + PRE + (nexIf && nexAdjust * (2 + PRE));
			system.SAN.max = 12 + (nexIf && nexAdjust * 3);
		} else if (system.class == 'specialist') {
			system.PV.max = 16 + VIG + (nexIf && nexAdjust * (3 + VIG));
			system.PE.max = 3 + PRE + (nexIf && nexAdjust * (3 + PRE));
			system.SAN.max = 16 + (nexIf && nexAdjust * 4);
		} else if (system.class == 'occultist') {
			system.PV.max = 12 + VIG + (nexIf && nexAdjust * (2 + VIG));
			system.PE.max = 4 + PRE + (nexIf && nexAdjust * (4 + PRE));
			system.SAN.max = 20 + (nexIf && nexAdjust * 5);
		} else {
			system.PV.max = system.PV.max || 0;
			system.PE.max = system.PE.max || 0;
			system.SAN.max = system.SAN.max || 0;
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
	 *
	 * @param {*} system
	 */
	_prepareSkills(system) {
		/**
		 * Faz um loop das perícias e depois faz algumas verificações para definir a formula de rolagem,
		 * depois disso, salva o valor nas informações
		 * */
		for (const [keySkill, skillsName] of Object.entries(system.skills)) {
			// Definindo constantes para acesso simplificado.
			const overLoad = skillsName.conditions.load;
			const needTraining = skillsName.conditions.trained;

			// Calculate the modifier using d20 rules.
			// TODO: inverter a atribuição de valores.
			if (skillsName.degree.label == 'trained') skillsName.value = 5;
			else if (skillsName.degree.label == 'veteran') skillsName.value = 10;
			else if (skillsName.degree.label == 'expert') skillsName.value = 15;
			else skillsName.value = 0;

			// Formando o nome com base nas condições de carga e treino da perícia.
			skillsName.label =
				game.i18n.localize(CONFIG.ordemparanormal.skills[keySkill]) + (overLoad ? '+' : needTraining ? '*' : '') ?? k;

			// FORMULA DE ROLAGEM: Criando o que vem antes e depois do D20 das perícias.
			const beforeD20Formula = skillsName.attr[1] ? skillsName.attr[1] : 2;

			const afterD20Formula =
				(skillsName.attr[1] != 0 ? 'kh' : 'kl') +
				(skillsName.value != 0 ? '+' + skillsName.value : '') +
				(skillsName.mod ? '+' + skillsName.mod : '');

			skillsName.formula = beforeD20Formula + 'd20' + afterD20Formula;
		}
	}

	/**
	 *
	 */
	async _prepareBaseSkills(system) {
		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [keySkill, skillsName] of Object.entries(system.skills)) {
			/**
			 * Faz um loop de todos os atributos, depois disso, se o atributo
			 * necessário para a perícia for o mesmo que a mesma perícia em que o loop
			 * esta no momento, este valor é atualizado para ser utilizado nas rolagens.
			 */
			for (const [keyAttr, attribute] of Object.entries(system.attributes)) {
				if (skillsName.attr[0] == keyAttr) system.skills[keySkill].attr[1] = attribute.value;
			}
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
		spaces.over, (spaces.pctMax = 0);

		// Get the total weight from items
		const physicalItems = ['armament', 'generalEquipment', 'protection'];
		const weight = ActorData.items.reduce((weight, i) => {
			if (!physicalItems.includes(i.type)) return weight;
			const q = i.system.quantity || 0;
			const w = i.system.weight || 0;
			return weight + q * w;
		}, 0);

		// Populate the final values
		spaces.value = weight.toNearest(0.1);
		spaces.max = FOR !== 0 ? FOR * 5 : 2;

		// Plus bonus
		spaces.value += spaces.bonus.value;
		spaces.max += spaces.bonus.max;

		// TODO: V11 AND V12 SPACE/WEIGHT RETRO COMPATIBILITY
		if (game.version >= 12) spaces.pct = Math.clamp((spaces.value * 100) / spaces.max, 0, 100);
		else spaces.pct = Math.clamped((spaces.value * 100) / spaces.max, 0, 100);

		// Apply the debuffs
		if (spaces.value > spaces.max) {
			spaces.over = spaces.value - spaces.max;
			system.desloc.value += -3;
			system.defense.value += -5;

			// TODO: V11 AND V12 SPACE/WEIGHT RETRO COMPATIBILITY
			if (game.version >= 12) spaces.pctMax = Math.clamp((spaces.over * 100) / spaces.max, 0, 100);
			else spaces.pctMax = Math.clamped((spaces.over * 100) / spaces.max, 0, 100);
		}
		if (spaces.value > spaces.max * 2) ui.notifications.warn(game.i18n.localize('WARN.overWeight'));
	}

	/**
	 *
	 */
	_prepareRituals(ActorData) {
		const system = ActorData.system;
		const ritual = (system.ritual ??= {});
		const calcNEX = system.NEX.value < 99 ? Math.floor(system.NEX.value / 5) : 20;
		ritual.DT = 10 + calcNEX + system.attributes.pre.value;
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

	/**
	 *
	 */
	async _migrateData(actorData, system) {
		// TODO: Update portuguese class name for english class name (6.3.1)
		if (system?.class == 'Combatente')
			await Actor.updateDocuments([{ _id: actorData._id, system: { class: 'fighter' } }]);
		if (system?.class == 'Especialista')
			await Actor.updateDocuments([{ _id: actorData._id, system: { class: 'specialist' } }]);
		if (system?.class == 'Ocultista')
			await Actor.updateDocuments([{ _id: actorData._id, system: { class: 'occultist' } }]);

		// console.log(game.items.invalidDocumentIds);
		// for (const id of game.actors.invalidDocumentIds) await game.actors.getInvalid(id).delete();
		// delete system.skills.k;
		// await Actor.updateDocuments([{ _id: actorData._id, system: { skills: system.skills } }], {
		// 	diff: false,
		// 	recursive: false,
		// });
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
		let skillUpper;

		// Copy the skills scores to the top level, so that rolls can use
		// formulas like `@iniciativa.value + 4`.
		// TODO: criar acesso rapido de variavel para outras linguagens
		if (system.skills) {
			for (const [k, v] of Object.entries(system.skills)) {
				system[k] = foundry.utils.deepClone(v);

				skillUpper = k.charAt(0).toUpperCase() + k.slice(1);
				system[game.i18n.localize('ordemparanormal.skill.' + k).toLowerCase()] = foundry.utils.deepClone(v);
			}
		}

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
