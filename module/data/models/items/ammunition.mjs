const { StringField, NumberField } = foundry.data.fields;
import { BaseItemData } from "./base-item.mjs";

export class AmmunitionData extends BaseItemData {
	static defineSchema() {
		const baseSchema = super.defineSchema();
		return {
			...baseSchema,
			type: new StringField({ initial: "" }),
			defense: new NumberField({ initial: 0, integer: true }),
			quantity: new NumberField({ initial: 1, integer: true }),
		};
	}
}
