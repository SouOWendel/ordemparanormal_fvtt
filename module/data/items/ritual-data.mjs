export class RitualData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.HTMLField({ initial: "A descrição do seu ritual aqui." }),
			circle: new fields.NumberField({ required: true, integer: true, initial: 1 }),
			element: new fields.StringField({ initial: "" }),
			target: new fields.StringField({ initial: "" }),
			execution: new fields.StringField({ initial: "" }),
			range: new fields.StringField({ initial: "" }),
			area: new fields.SchemaField({
				name: new fields.StringField({ initial: "" }),
				size: new fields.StringField({ initial: "" }),
				type: new fields.StringField({ initial: "" }),
			}),
			duration: new fields.StringField({ initial: "" }),
			resistance: new fields.StringField({ initial: "" }),
			skillResis: new fields.StringField({ initial: "" }),
			targetQtd: new fields.StringField({ initial: "" }),
			studentForm: new fields.BooleanField({ initial: false }),
			trueForm: new fields.BooleanField({ initial: false }),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
