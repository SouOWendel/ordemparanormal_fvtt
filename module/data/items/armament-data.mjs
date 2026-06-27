export class ArmamentData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.HTMLField({ initial: "A descrição do seu item aqui." }),
			weight: new fields.NumberField({ required: true, integer: false, initial: 1 }),
			category: new fields.NumberField({ required: true, integer: true, initial: 0 }),
			using: new fields.SchemaField({
				state: new fields.BooleanField({ initial: true }),
				class: new fields.StringField({ initial: "fas" }),
			}),
			quantity: new fields.NumberField({ required: true, integer: true, initial: 1 }),
			proficiency: new fields.StringField({ initial: "" }),
			types: new fields.SchemaField({
				rangeType: new fields.SchemaField({
					name: new fields.StringField({ initial: "" }),
					subRangeType: new fields.StringField({ initial: "" }),
				}),
				ammunitionType: new fields.StringField({ initial: "" }),
				gripType: new fields.StringField({ initial: "" }),
			}),
			critical: new fields.StringField({ initial: "" }),
			range: new fields.StringField({ initial: "" }),
			formulas: new fields.SchemaField({
				attack: new fields.SchemaField({
					formula: new fields.StringField({ initial: "1d4" }),
					attr: new fields.StringField({ initial: "" }),
					skill: new fields.StringField({ initial: "" }),
					bonus: new fields.StringField({ initial: "" }),
				}),
				damage: new fields.SchemaField({
					formula: new fields.StringField({ initial: "1d4" }),
					attr: new fields.StringField({ initial: "" }),
					bonus: new fields.StringField({ initial: "" }),
					type: new fields.StringField({ initial: "" }),
					parts: new fields.ArrayField(new fields.ArrayField(new fields.StringField())),
				}),
				extraFormula: new fields.StringField({ initial: "1d4" }),
			}),
			penalty: new fields.StringField({ initial: "" }),
			conditions: new fields.SchemaField({
				improvised: new fields.BooleanField({ initial: false }),
				throwable: new fields.BooleanField({ initial: false }),
				agile: new fields.BooleanField({ initial: false }),
				automatic: new fields.BooleanField({ initial: false }),
				adaptableGrip: new fields.BooleanField({ initial: false }),
				pistolBlow: new fields.BooleanField({ initial: false }),
			}),
		};
	}

	static migrateData(data) {
		return super.migrateData(data);
	}
}
