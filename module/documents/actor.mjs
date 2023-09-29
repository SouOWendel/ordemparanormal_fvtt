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
		const flags = actorData.flags.ordemparanormal_fvtt || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._prepareCharacterData(actorData);
		this._prepareNpcData(actorData);
		this._prepareAgenteData(actorData);
	}

	/**
	 * Preparação dos dados específicos do tipo Agente
	 */
	_prepareAgenteData(actorData) {
		if (actorData.type !== 'Agente') return;

		// Make modifications to data here. For example:
		const data = actorData.data;

		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [keySkill, skillsName] of Object.entries(data.skills)) {
			// Calculate the modifier using d20 rules.
			skillsName.mod = 0;
			/**
			 * Faz um loop de todos os atributos, depois disso, se o atributo
			 * necessário para a perícia for o mesmo que a mesma perícia em que o loop
			 * esta no momento, este valor é atualizado para ser utilizado nas rolagens.
			 */
			for (const [keyAttr, attribute] of Object.entries(data.attributes)) {
				// console.log('keyAttr is ' + keyAttr);
				// console.log('skillsName.attr[0] is ' + skillsName.attr[0]);
				if (skillsName.attr[0] == keyAttr) {
					console.log('attribute.value ' + attribute.value + ' data.skills[keySkill].attr[1] ' + data.skills[keySkill].attr[1]);
					data.skills[keySkill].attr[1] = attribute.value;
				}
			}
		}
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		if (actorData.type !== 'character') return;

		// Make modifications to data here. For example:
		const data = actorData.data;

		// Loop through ability scores, and add their modifiers to our sheet output.
		for (const [key, ability] of Object.entries(data.abilities)) {
			// Calculate the modifier using d20 rules.
			ability.mod = Math.floor((ability.value - 10) / 2);
		}
	}

	/**
	 * Prepare NPC type specific data.
	 */
	_prepareNpcData(actorData) {
		if (actorData.type !== 'npc') return;

		// Make modifications to data here. For example:
		const data = actorData.data;
		data.xp = data.cr * data.cr * 100;
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const data = super.getRollData();

		// Prepare character roll data.
		this._getCharacterRollData(data);
		this._getNpcRollData(data);
		this._getAgenteRollData(data);

		return data;
	}

	/**
	 * Preparação do dados dos agentes.
	 */
	_getAgenteRollData(data) {
		if (this.data.type !== 'Agente') return;

		// Copy the ability scores to the top level, so that rolls can use
		// formulas like `@str.mod + 4`.
		if (data.skills) {
			for (const [k, v] of Object.entries(data.skills)) {
				data[k] = foundry.utils.deepClone(v);
			}
		}

		// Add level for easier access, or fall back to 0.
		if (data.NEX) {
			data.lvl = data.NEX.value ?? 0;
		}
	}

	/**
	 * Prepare character roll data.
	 */
	_getCharacterRollData(data) {
		if (this.data.type !== 'character') return;

		// Copy the ability scores to the top level, so that rolls can use
		// formulas like `@str.mod + 4`.
		if (data.abilities) {
			for (const [k, v] of Object.entries(data.abilities)) {
				data[k] = foundry.utils.deepClone(v);
			}
		}

		// Add level for easier access, or fall back to 0.
		if (data.attributes.level) {
			data.lvl = data.attributes.level.value ?? 0;
		}
	}

	/**
	 * Prepare NPC roll data.
	 */
	_getNpcRollData(data) {
		if (this.data.type !== 'npc') return;

		// Process additional NPC data here.
	}

}
