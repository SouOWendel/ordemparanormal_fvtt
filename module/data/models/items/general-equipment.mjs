const { StringField, NumberField } = foundry.data.fields;
import { BaseItemData } from "./base-item.mjs";

export class GeneralEquipmentData extends BaseItemData {
	static defineSchema() {
		const baseSchema = super.defineSchema();
		return {
			...baseSchema,
			type: new StringField({ initial: "" }),
			quantity: new NumberField({ initial: 1, integer: true }),
		};
	}
}
