const { StringField, NumberField } = foundry.data.fields;
import { BaseItemData } from "./base-item.mjs";

export class ProtectionData extends BaseItemData {
	static defineSchema() {
		const baseSchema = super.defineSchema();
		return {
			...baseSchema,
			defense: new NumberField({ initial: 0, integer: true }),
			penalty: new StringField({ initial: "" }),
			quantity: new NumberField({ initial: 1, integer: true }),
		};
	}
}
