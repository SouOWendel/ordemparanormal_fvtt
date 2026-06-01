export class ClassData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			classType: new fields.StringField({ initial: "" }),
			preRequisite: new fields.StringField({ initial: "" }),
			description: new fields.HTMLField({ initial: "Your text here." }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
