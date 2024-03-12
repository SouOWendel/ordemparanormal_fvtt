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
			this._migrateData(systemData);
			this._prepareBaseDataAgent(systemData);
			this._prepareDataStatus(systemData);
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
			this._prepareDefense(systemData);
			this._prepareSkills(systemData);
			this._prepareActorSpaces(actorData);
		}
	}

	/**
	 *
	 * @param {*} system
	 */
	_prepareDataStatus(system) {
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
		return (system.defense.dodge =
			system.defense.value + REFLEXES.value + (REFLEXES.mod || 0));
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
			if (skillsName.degree.label == 'trained') skillsName.value = 5;
			else if (skillsName.degree.label == 'veteran') skillsName.value = 10;
			else if (skillsName.degree.label == 'expert') skillsName.value = 15;
			else skillsName.value = 0;

			// Formando o nome com base nas condições de carga e treino da perícia.
			skillsName.label =
				game.i18n.localize(CONFIG.ordemparanormal.skills[keySkill]) +
					(overLoad ? '+' : needTraining ? '*' : '') ?? k;

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
	async _prepareBaseDataAgent(system) {
		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [keySkill, skillsName] of Object.entries(system.skills)) {
			/**
			 * Faz um loop de todos os atributos, depois disso, se o atributo
			 * necessário para a perícia for o mesmo que a mesma perícia em que o loop
			 * esta no momento, este valor é atualizado para ser utilizado nas rolagens.
			 */
			for (const [keyAttr, attribute] of Object.entries(system.attributes)) {
				if (skillsName.attr[0] == keyAttr) {
					system.skills[keySkill].attr[1] = attribute.value;
				}
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

		spaces.pct = Math.clamped((spaces.value * 100) / spaces.max, 0, 100);

		// Apply the debuffs
		if (spaces.value > spaces.max) {
			spaces.over = spaces.value - spaces.max;
			system.desloc.value += -3;
			system.defense.value += -5;
			spaces.pctMax = Math.clamped((spaces.over * 100) / spaces.max, 0, 100);
		}
		if (spaces.value > spaces.max * 2)
			ui.notifications.warn(game.i18n.localize('WARN.overWeight'));
	}

	/**
	 *
	 */
	async _migrateData(system) {
		// TODO: Update portuguese class name for english class name (6.3.1)
		if (system?.class == 'Combatente')
			await Actor.updateDocuments([
				{ _id: actorData.actor._id, system: { class: 'fighter' } },
			]);
		if (system?.class == 'Especialista')
			await Actor.updateDocuments([
				{ _id: actorData.actor._id, system: { class: 'specialist' } },
			]);
		if (system?.class == 'Ocultista')
			await Actor.updateDocuments([
				{ _id: actorData.actor._id, system: { class: 'occultist' } },
			]);
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const system = super.getRollData();

		// Prepare character roll data.
		this._getAgentRollData(system);

		return system;
	}

	/**
	 * Preparação do dados dos agentes.
	 */
	async _getAgentRollData(system) {
		if (this.system.type !== 'agent') return;
		let skillUpper;

		// Copy the skills scores to the top level, so that rolls can use
		// formulas like `@iniciativa.value + 4`.
		// TODO: criar acesso rapido de variavel para outras linguagens
		if (system.skills) {
			for (const [k, v] of Object.entries(system.skills)) {
				system[k] = foundry.utils.deepClone(v);

				skillUpper = k.charAt(0).toUpperCase() + k.slice(1);
				system[
					game.i18n.localize('ordemparanormal.skill' + skillUpper).toLowerCase()
				] = foundry.utils.deepClone(v);
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
			system.rollInitiative =
				(system.attributes.dex.value == 0 ? 2 : system.attributes.dex.value) +
				'd20' +
				(system.attributes.dex.value == 0 ? 'kl' : 'kh') +
				'+' +
				system.skills.initiative.value;
		}

		// Add level for easier access, or fall back to 0.
		if (system.NEX) {
			system.nex = system.NEX.value ?? 0;
		}
	}
}
