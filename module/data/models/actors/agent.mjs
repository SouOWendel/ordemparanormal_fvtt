const { TypeDataModel } = foundry.abstract;
const { StringField, NumberField, SchemaField, HTMLField, ArrayField } = foundry.data.fields;
import { DegreeField, SkillConditionsField, AttributeField } from "../../fields/op-fields.mjs";

export class AgentData extends TypeDataModel {
	static defineSchema() {
		return {
			PV: new SchemaField({
				value: new NumberField({ initial: 5, integer: true }),
				max: new NumberField({ initial: 10, integer: true }),
			}),
			SAN: new SchemaField({
				value: new NumberField({ initial: 5, integer: true }),
				max: new NumberField({ initial: 5, integer: true }),
			}),
			PE: new SchemaField({
				value: new NumberField({ initial: 5, integer: true }),
				max: new NumberField({ initial: 5, integer: true }),
				perRound: new NumberField({ initial: 1, integer: true }),
			}),
			PD: new SchemaField({
				value: new NumberField({ initial: 5, integer: true }),
				max: new NumberField({ initial: 5, integer: true }),
				perRound: new NumberField({ initial: 1, integer: true }),
			}),
			NEX: new SchemaField({
				value: new NumberField({ initial: 1, integer: true, min: 0 }),
			}),
			stage: new SchemaField({
				value: new NumberField({ initial: 1, integer: true }),
			}),
			nivel: new SchemaField({
				value: new NumberField({ initial: 1, integer: true }),
			}),
			defense: new SchemaField({
				value: new NumberField({ initial: 10, integer: true }),
				bonus: new NumberField({ initial: 0, integer: true }),
				dodge: new NumberField({ initial: 0, integer: true }),
			}),
			desloc: new SchemaField({
				value: new NumberField({ initial: 9, integer: true }),
				bonus: new NumberField({ initial: 0, integer: true }),
			}),
			spaces: new SchemaField({
				bonus: new SchemaField({
					value: new NumberField({ initial: 0, integer: true }),
					max: new NumberField({ initial: 0, integer: true }),
				}),
			}),
			biography: new HTMLField({ initial: "A personalidade, aparência e história do seu personagem aqui." }),
			goals: new StringField({ initial: "Os seus objetivos aqui." }),

			class: new StringField({ initial: "" }),
			ritual: new SchemaField({
				DT: new NumberField({ initial: 0, integer: true }),
			}),
			origin: new StringField({ initial: "" }),
			trilha: new StringField({ initial: "" }),
			patent: new SchemaField({
				name: new StringField({ initial: "" }),
				prestigePoints: new NumberField({ initial: 0, integer: true }),
				creditLimit: new StringField({ initial: "" }),
				itemLimit1: new NumberField({ nullable: true, initial: null }),
				itemLimit2: new NumberField({ nullable: true, initial: null }),
				itemLimit3: new NumberField({ nullable: true, initial: null }),
				itemLimit4: new NumberField({ nullable: true, initial: null }),
			}),

			attributes: new SchemaField({
				dex: AttributeField(),
				int: AttributeField(),
				vit: AttributeField(),
				pre: AttributeField(),
				str: AttributeField(),
			}),

			skills: new SchemaField({
				acrobatics: this._defineSkillField("dex", true, false),
				animal: this._defineSkillField("pre", false, true),
				arts: this._defineSkillField("pre", false, false),
				athleticism: this._defineSkillField("str", false, false),
				relevance: this._defineSkillField("int", false, false),
				sciences: this._defineSkillField("int", false, false),
				crime: this._defineSkillField("dex", true, true),
				diplomacy: this._defineSkillField("pre", false, false),
				deception: this._defineSkillField("pre", false, false),
				resilience: this._defineSkillField("vit", false, false),
				stealth: this._defineSkillField("dex", true, false),
				initiative: this._defineSkillField("dex", false, false),
				intimidation: this._defineSkillField("pre", false, false),
				intuition: this._defineSkillField("pre", false, false),
				investigation: this._defineSkillField("int", false, false),
				fighting: this._defineSkillField("str", false, false),
				medicine: this._defineSkillField("int", false, false),
				occultism: this._defineSkillField("int", false, true),
				perception: this._defineSkillField("pre", false, false),
				driving: this._defineSkillField("dex", false, true),
				aim: this._defineSkillField("dex", false, false),
				reflexes: this._defineSkillField("dex", false, false),
				religion: this._defineSkillField("pre", false, true),
				survival: this._defineSkillField("int", false, false),
				tactics: this._defineSkillField("int", false, true),
				technology: this._defineSkillField("int", false, true),
				will: this._defineSkillField("pre", false, false),
				freeSkill: new SchemaField({
					value: new NumberField({ initial: 0, integer: true }),
					name: new StringField({ initial: "" }),
					attr: new ArrayField(new StringField(), { initial: ["int", "1"] }),
					degree: DegreeField(),
					conditions: SkillConditionsField({ load: false, trained: false, open: true }),
				}),
			}),

			resources: new SchemaField({
				res1: new SchemaField({
					value: new NumberField({ initial: 0 }),
					max: new NumberField({ initial: 0 }),
					label: new StringField({ initial: "" }),
				}),
				res2: new SchemaField({
					value: new NumberField({ initial: 0 }),
					max: new NumberField({ initial: 0 }),
					label: new StringField({ initial: "" }),
				}),
				res3: new SchemaField({
					value: new NumberField({ initial: 0 }),
					max: new NumberField({ initial: 0 }),
					label: new StringField({ initial: "" }),
				}),
			}),
		};
	}

	static _defineSkillField(defaultAttr, defaultLoad, defaultTrained) {
		return new SchemaField({
			value: new NumberField({ initial: 0, integer: true }),
			attr: new ArrayField(new StringField(), { initial: [defaultAttr, "1"] }),
			degree: DegreeField(),
			conditions: SkillConditionsField({ load: defaultLoad, trained: defaultTrained }),
		});
	}

	static migrateData(source) {
		if (source.data) {
			foundry.utils.mergeObject(source, source.data);
			delete source.data;
		}
		return super.migrateData(source);
	}
}
