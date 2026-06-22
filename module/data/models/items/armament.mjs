const { StringField, NumberField, SchemaField, BooleanField, ArrayField, ObjectField } = foundry.data.fields;
import { BaseItemData } from "./base-item.mjs";

export class ArmamentData extends BaseItemData {
	static defineSchema() {
		const baseSchema = super.defineSchema();
		return {
			...baseSchema,
			quantity: new NumberField({ initial: 1, integer: true }),
			proficiency: new NumberField({ initial: 0, integer: true }),
			types: new SchemaField({
				rangeType: new SchemaField({
					name: new StringField({ initial: "" }),
					subRangeType: new StringField({ initial: "" }),
				}),
				ammunitionType: new StringField({ initial: "" }),
				gripType: new StringField({ initial: "" }),
			}),
			critical: new StringField({ initial: "" }),
			range: new StringField({ initial: "" }),
			formulas: new SchemaField({
				attack: new SchemaField({
					formula: new StringField({ initial: "1d4" }),
					attr: new StringField({ initial: "" }),
					skill: new StringField({ initial: "" }),
					bonus: new StringField({ initial: "" }),
				}),
				damage: new SchemaField({
					formula: new StringField({ initial: "1d4" }),
					attr: new StringField({ initial: "" }),
					bonus: new StringField({ initial: "" }),
					type: new StringField({ initial: "" }),
					parts: new ArrayField(new ObjectField(), { initial: [] }),
				}),
				extraFormula: new StringField({ initial: "1d4" }),
			}),
			penalty: new StringField({ initial: "" }),
			conditions: new SchemaField({
				improvised: new BooleanField({ initial: false }),
				throwable: new BooleanField({ initial: false }),
				agile: new BooleanField({ initial: false }),
				automatic: new BooleanField({ initial: false }),
				adaptableGrip: new BooleanField({ initial: false }),
				pistolBlow: new BooleanField({ initial: false }),
			}),
		};
	}
}
