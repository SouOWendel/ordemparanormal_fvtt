const { TypeDataModel } = foundry.abstract;
const { StringField, NumberField, HTMLField } = foundry.data.fields;

export class AbilityData extends TypeDataModel {
	static defineSchema() {
		return {
			id: new NumberField({ initial: 0, integer: true }),
			abilityType: new StringField({ initial: "" }),
			preRequisite: new StringField({ initial: "" }),
			description: new HTMLField({ initial: "Your text here." }),
			activation: new StringField({ initial: "" }),
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
