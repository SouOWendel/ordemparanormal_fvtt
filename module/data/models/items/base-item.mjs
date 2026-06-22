const { TypeDataModel } = foundry.abstract;
const { StringField, NumberField, SchemaField, BooleanField, HTMLField } = foundry.data.fields;

export class BaseItemData extends TypeDataModel {
	static defineSchema() {
		return {
			description: new HTMLField({ initial: "A descrição do seu item aqui." }),
			weight: new NumberField({ initial: 1 }),
			category: new StringField({ initial: "0" }),
			using: new SchemaField({
				state: new BooleanField({ initial: true }),
				class: new StringField({ initial: "fas" }),
			}),
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
