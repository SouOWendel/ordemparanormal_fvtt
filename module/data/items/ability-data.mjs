export class AbilityData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			abilityType: new fields.StringField({ initial: "" }),
			preRequisite: new fields.StringField({ initial: "" }),
			description: new fields.HTMLField({ initial: "Your text here." }),
			activation: new fields.StringField({ initial: "" }),
			cost: new fields.StringField({ initial: "" }),
			costType: new fields.StringField({ initial: "PE" }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
