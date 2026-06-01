export class ClassData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			description: new fields.HTMLField({ initial: "Your text here." }),
			hpInitial: new fields.NumberField({ integer: true, initial: 0 }),
			hpPerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			peInitial: new fields.NumberField({ integer: true, initial: 0 }),
			pePerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			sanInitial: new fields.NumberField({ integer: true, initial: 0 }),
			sanPerLevel: new fields.NumberField({ integer: true, initial: 0 }),
			skillCount: new fields.NumberField({ integer: true, initial: 0 }),
			grantedSkills: new fields.StringField({ initial: "" }),
			proficiencies: new fields.StringField({ initial: "" }),
			abilities: new fields.HTMLField({ initial: "Your text here." }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
