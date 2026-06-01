export class PathData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			description: new fields.HTMLField({ initial: "Your text here." }),
			preRequisite: new fields.StringField({ initial: "" }),
			abilities: new fields.HTMLField({ initial: "Your text here." }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
