const { TypeDataModel } = foundry.abstract;
const { StringField, NumberField, SchemaField, BooleanField, HTMLField } = foundry.data.fields;

export class RitualData extends TypeDataModel {
	static defineSchema() {
		return {
			description: new HTMLField({ initial: "A descrição do seu ritual aqui." }),
			circle: new NumberField({ initial: 1, integer: true }),
			element: new StringField({ initial: "" }),
			target: new StringField({ initial: "" }),
			execution: new StringField({ initial: "" }),
			range: new StringField({ initial: "" }),
			area: new SchemaField({
				name: new StringField({ initial: "" }),
				size: new StringField({ initial: "" }),
				type: new StringField({ initial: "" }),
			}),
			duration: new StringField({ initial: "" }),
			resistance: new StringField({ initial: "" }),
			studentForm: new BooleanField({ initial: false }),
			trueForm: new BooleanField({ initial: false }),
		};
	}

	static migrateData(source) {
		if (source.data) {
			foundry.utils.mergeObject(source, source.data);
			delete source.data;
		}
		return super.migrateData(source);
	}
}
