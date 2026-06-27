const { TypeDataModel } = foundry.abstract;
const { StringField, NumberField, SchemaField, BooleanField, HTMLField, ArrayField, ObjectField } = foundry.data.fields;
import { DegreeField } from "../../fields/op-fields.mjs";

export class ThreatData extends TypeDataModel {
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
				value: new NumberField({ initial: 0, integer: true }),
				skillResistances: new ArrayField(new StringField(), { initial: [] }),
				damageResistances: new StringField({ initial: "" }),
				bonus: new NumberField({ initial: 0, integer: true }), // For template base mapping
				dodge: new NumberField({ initial: 0, integer: true }), // For template base mapping
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

			attributes: new SchemaField({
				hp: new SchemaField({
					value: new NumberField({ initial: 10, integer: true }),
					max: new NumberField({ initial: 10, integer: true }),
				}),
				dex: new SchemaField({ value: new NumberField({ initial: 1, integer: true }) }),
				int: new SchemaField({ value: new NumberField({ initial: 1, integer: true }) }),
				pre: new SchemaField({ value: new NumberField({ initial: 1, integer: true }) }),
				str: new SchemaField({ value: new NumberField({ initial: 1, integer: true }) }),
				vit: new SchemaField({ value: new NumberField({ initial: 1, integer: true }) }),
				movement: new SchemaField({
					walk: new NumberField({ initial: 0, integer: true }),
					unit: new StringField({ initial: "m" }),
					squares: new NumberField({ initial: 0, integer: true }),
				}),
				vd: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
			}),
			attacks: new ObjectField({ initial: {} }),
			skills: new SchemaField({
				fighting: this._defineSimpleSkillField("str"),
				aim: this._defineSimpleSkillField("dex"),
				resilience: this._defineSimpleSkillField("vit"),
				reflexes: this._defineSimpleSkillField("dex"),
				will: this._defineSimpleSkillField("pre"),
				initiative: this._defineSimpleSkillField("dex"),
				perception: this._defineSimpleSkillField("pre"),
				freeSkill: new SchemaField({
					value: new NumberField({ initial: 0, integer: true }),
					name: new StringField({ initial: "" }),
					attr: new ArrayField(new StringField(), { initial: ["int", "1"] }),
					degree: DegreeField(),
				}),
			}),
			elements: new SchemaField({
				main: new StringField({ initial: "" }),
				others: new StringField({ initial: "" }),
			}),
			abilities: new ArrayField(new ObjectField(), { initial: [] }),
			size: new StringField({ initial: "" }),
			disturbingPresence: new SchemaField({
				dt: new NumberField({ initial: 0, integer: true }),
				mentalDamage: new StringField({ initial: "" }),
				immuneNex: new NumberField({ initial: 0, integer: true }),
			}),
			senses: new ArrayField(new StringField(), { initial: [] }),
			vulnerabilities: new StringField({ initial: "" }),
			actions: new ArrayField(new ObjectField(), { initial: [] }),
			details: new SchemaField({
				description: new HTMLField({ initial: "" }),
				fearRiddle: new StringField({ initial: "" }),
			}),
			temporary: new SchemaField({
				abilities: new StringField({ initial: "" }),
				senses: new StringField({ initial: "" }),
				defense: new SchemaField({
					skillResistances: new StringField({ initial: "" }),
					damageResistances: new StringField({ initial: "" }),
				}),
				vulnerabilities: new StringField({ initial: "" }),
				actions: new StringField({ initial: "" }),
				characteristics: new StringField({ initial: "" }),
			}),
			resistances: new SchemaField({
				cuttingDamage: this._defineResistanceField(),
				impactDamage: this._defineResistanceField(),
				piercingDamage: this._defineResistanceField(),
				ballisticDamage: this._defineResistanceField(),
				fireDamage: this._defineResistanceField(),
				eletricDamage: this._defineResistanceField(),
				coldDamage: this._defineResistanceField(),
				chemicalDamage: this._defineResistanceField(),
				mentalDamage: this._defineResistanceField(),
				damageDamage: this._defineResistanceField(),
				bloodDamage: this._defineResistanceField(),
				deathDamage: this._defineResistanceField(),
				knowledgeDamage: this._defineResistanceField(),
				energyDamage: this._defineResistanceField(),
			}),
			traits: new SchemaField({
				smell: new BooleanField({ initial: false }),
				acceleratedHealing: new BooleanField({ initial: false }),
				incorporeal: new BooleanField({ initial: false }),
				blindsight: new BooleanField({ initial: false }),
				lowLightVision: new BooleanField({ initial: false }),
				darkvision: new BooleanField({ initial: false }),
			}),
		};
	}

	static _defineSimpleSkillField(defaultAttr) {
		return new SchemaField({
			value: new NumberField({ initial: 0, integer: true }),
			attr: new ArrayField(new StringField(), { initial: [defaultAttr, "1"] }),
			degree: DegreeField(),
		});
	}

	static _defineResistanceField() {
		return new SchemaField({
			value: new NumberField({ initial: 0, integer: true }),
			vulnerable: new BooleanField({ initial: false }),
			immune: new BooleanField({ initial: false }),
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
