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
		const actorData = this.data;

		this._prepareBaseDataAgent(actorData);

	}

	/**
	 * 
	 */
	_prepareBaseDataAgent(actorData) {
		if (actorData.type !== 'agent') return;

		// Make modifications to data here. For example:
		const data = actorData.data;

		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [keySkill, skillsName] of Object.entries(data.skills)) {
			// Calculate the modifier using d20 rules.
			if (!skillsName.mod) skillsName.mod = '';

			/**
			 * Faz um loop de todos os atributos, depois disso, se o atributo
			 * necessário para a perícia for o mesmo que a mesma perícia em que o loop
			 * esta no momento, este valor é atualizado para ser utilizado nas rolagens.
			 */
			for (const [keyAttr, attribute] of Object.entries(data.attributes)) {
				// console.log('keyAttr is ' + keyAttr);
				// console.log('skillsName.attr[0] is ' + skillsName.attr[0]);
				if (skillsName.attr[0] == keyAttr) {
					// console.log('attribute.value ' + attribute.value + ' data.skills[keySkill].attr[1] ' + data.skills[keySkill].attr[1]);
					data.skills[keySkill].attr[1] = attribute.value;
				}
			}
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
		const actorData = this.data;
		// eslint-disable-next-line no-unused-vars
		const data = actorData.data;
		// eslint-disable-next-line no-unused-vars
		const flags = actorData.flags.ordemparanormal || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._prepareAgentData(actorData);
	}

	/**
	 * Preparação dos dados específicos do tipo Agente
	 */
	_prepareAgentData(actorData) {
		if (actorData.type !== 'agent') return;

		// Make modifications to data here. For example:
		const data = actorData.data;

		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [keySkill, skillsName] of Object.entries(data.skills)) {
			// Calculate the modifier using d20 rules.
			// if (skillsName.mod) skillsName.mod = 0;
			if (skillsName.degree.label == 'trained') skillsName.value = 5;
			else if (skillsName.degree.label == 'veteran') skillsName.value = 10;
			else if (skillsName.degree.label == 'expert') skillsName.value = 15;
			else skillsName.value = 0;

			// console.log(JSON.stringify(skillsName.degree) + skillsName.value);
		}
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const data = super.getRollData();

		// Prepare character roll data.
		this._getAgentRollData(data);

		return data;
	}

	/**
	 * Preparação do dados dos agentes.
	 */
	_getAgentRollData(data) {
		if (this.data.type !== 'agent') return;

		// Copy the skills scores to the top level, so that rolls can use
		// formulas like `@iniciativa.value + 4`.
		// TODO: criar acesso rapido de variavel para outras linguagens
		if (data.skills) {
			for (const [k, v] of Object.entries(data.skills)) {
				data[k] = foundry.utils.deepClone(v);
				// data[k] = game.i18n.localize('ordemparanormal.skills.' + k);
			}
		}

		// Copy the attributes to the top level, so that rolls can use
		// formulas like `@dex.value`.
		if(data.attributes) {
			for (const [k, v] of Object.entries(data.attributes)) {
				data[k] = foundry.utils.deepClone(v);
			}
		}

		if(data.attributes && data.skills) {
			data.rollInitiative = ((data.attributes.dex.value == 0) ? 2 : data.attributes.dex.value) + 'd20' +
			 ((data.attributes.dex.value == 0) ? 'kl' : 'kh') + '+' + data.skills.initiative.value;
		}

		// Add level for easier access, or fall back to 0.
		if (data.NEX) {
			data.nex = data.NEX.value ?? 0;
		}
	}
}
