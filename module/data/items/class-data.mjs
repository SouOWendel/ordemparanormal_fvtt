export class ClassData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			description: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			chatDescription: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			hpInitial: new fields.NumberField({ integer: true, initial: 0 }),
			hpPerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			peInitial: new fields.NumberField({ integer: true, initial: 0 }),
			pePerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			pdInitial: new fields.NumberField({ integer: true, initial: 0 }),
			pdPerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			sanInitial: new fields.NumberField({ integer: true, initial: 0 }),
			sanPerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			skillCount: new fields.NumberField({ integer: true, initial: 0 }),
			grantedSkills: new fields.StringField({ initial: "" }),
			proficiencies: new fields.StringField({ initial: "" }),
			abilities: new fields.HTMLField({ initial: "Your text here." }),
			isSurvivor: new fields.BooleanField({ initial: false }),
		};
	}

	static get metadata() {
		return {
			singleton: true,
		};
	}

	// Dentro do seu arquivo base do Actor (ex: mySystemActor.js)
	async _preCreateItem(item, data, options, userId) {
		// Roda o comportamento nativo primeiro
		await super._preCreateItem(item, data, options, userId);

		// Puxa o DataModel referente ao tipo de item que o jogador está tentando criar
		const dataModel = CONFIG.Item.dataModels[item.type];

		// Checa se a marcação "singleton" existe no modelo e é verdadeira
		const isSingleton = dataModel?.metadata?.singleton ?? false;

		// Se for um item restrito E o ator já possuir pelo menos 1 item desse mesmo tipo...
		if (isSingleton && this.itemTypes[item.type].length > 0) {
			ui.notifications.error(`Você já possui um item do tipo ${item.type} na sua ficha! Remova o antigo primeiro.`);
			// Retornar false cancela a gravação no banco de dados instantaneamente
			return false;
		}
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
