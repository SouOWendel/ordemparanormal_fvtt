export class AbilityData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			abilityType: new fields.StringField({ initial: "" }),
			cost: new fields.NumberField({ integer: true, initial: 0 }),
			preRequisite: new fields.StringField({ initial: "" }),
			description: new fields.HTMLField({ initial: "Your text here." }),
			activation: new fields.StringField({ initial: "" }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
