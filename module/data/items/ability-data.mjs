export class AbilityData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			description: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			chatDescription: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			abilityType: new fields.StringField({ initial: "" }),
			cost: new fields.NumberField({ integer: true, initial: 0 }),
			preRequisite: new fields.StringField({ initial: "" }),
			activation: new fields.StringField({ initial: "" }),
			costType: new fields.StringField({ initial: "PE" }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
