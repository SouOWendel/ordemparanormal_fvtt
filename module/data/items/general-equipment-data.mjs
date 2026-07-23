export class GeneralEquipmentData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			chatDescription: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			weight: new fields.NumberField({ required: true, integer: false, initial: 1 }),
			category: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			using: new fields.SchemaField({
				state: new fields.BooleanField({ initial: true }),
				class: new fields.StringField({ initial: "fas" }),
			}),
			type: new fields.StringField({ initial: "" }),
			quantity: new fields.NumberField({ required: true, integer: true, initial: 1 }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
