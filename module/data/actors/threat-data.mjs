import { calculateSkillProficiency } from "../../helpers/actor-calculations.mjs";

const defaultAttrs = {
	fighting: "str",
	aim: "dex",
	resilience: "vit",
	reflexes: "dex",
	will: "pre",
	initiative: "dex",
	perception: "pre",
	freeSkill: "int",
};

function skillField() {
	const fields = foundry.data.fields;
	return new fields.SchemaField({
		value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
		attr: new fields.ArrayField(new fields.StringField(), { initial: ["dex"] }),
		degree: new fields.SchemaField({
			label: new fields.StringField({ initial: "untrained" }),
			value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
		}),
	});
}

function freeSkillField() {
	const fields = foundry.data.fields;
	return new fields.SchemaField({
		value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
		name: new fields.StringField({ initial: "" }),
		attr: new fields.ArrayField(new fields.StringField(), { initial: ["int"] }),
		degree: new fields.SchemaField({
			label: new fields.StringField({ initial: "untrained" }),
			value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
		}),
	});
}

function resistanceField() {
	const fields = foundry.data.fields;
	return new fields.SchemaField({
		value: new fields.NumberField({ integer: true, initial: 0 }),
		vulnerable: new fields.BooleanField({ initial: false }),
		immune: new fields.BooleanField({ initial: false }),
	});
}

export class ThreatData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			attributes: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({ required: true, integer: true, initial: 10 }),
					max: new fields.NumberField({ required: true, integer: true, initial: 10 }),
				}),
				dex: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
				int: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
				pre: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
				str: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
				vit: new fields.SchemaField({ value: new fields.NumberField({ integer: true, initial: 1 }) }),
				movement: new fields.SchemaField({
					walk: new fields.NumberField({ integer: true, initial: 0 }),
					unit: new fields.StringField({ initial: "m" }),
					squares: new fields.NumberField({ integer: true, initial: 0 }),
				}),
				vd: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0 }),
				}),
			}),
			attacks: new fields.ObjectField({ initial: {} }),
			skills: new fields.SchemaField({
				fighting: skillField(),
				aim: skillField(),
				resilience: skillField(),
				reflexes: skillField(),
				will: skillField(),
				initiative: skillField(),
				perception: skillField(),
				freeSkill: freeSkillField(),
			}),
			elements: new fields.SchemaField({
				main: new fields.StringField({ initial: "" }),
				others: new fields.StringField({ initial: "" }),
			}),
			abilities: new fields.ArrayField(new fields.ObjectField()),
			size: new fields.StringField({ initial: "" }),
			disturbingPresence: new fields.SchemaField({
				dt: new fields.NumberField({ integer: true, initial: 0 }),
				mentalDamage: new fields.StringField({ initial: "" }),
				immuneNex: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			senses: new fields.ArrayField(new fields.StringField()),
			defense: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				skillResistances: new fields.ArrayField(new fields.StringField()),
				damageResistances: new fields.StringField({ initial: "" }),
			}),
			vulnerabilities: new fields.StringField({ initial: "" }),
			actions: new fields.ArrayField(new fields.ObjectField()),
			details: new fields.SchemaField({
				description: new fields.HTMLField({ initial: "" }),
				fearRiddle: new fields.HTMLField({ initial: "" }),
				creatureType: new fields.StringField({ initial: "" }),
			}),
			temporary: new fields.SchemaField({
				abilities: new fields.StringField({ initial: "" }),
				senses: new fields.StringField({ initial: "" }),
				defense: new fields.SchemaField({
					skillResistances: new fields.StringField({ initial: "" }),
					damageResistances: new fields.StringField({ initial: "" }),
				}),
				vulnerabilities: new fields.StringField({ initial: "" }),
				actions: new fields.StringField({ initial: "" }),
				characteristics: new fields.StringField({ initial: "" }),
			}),
			resistances: new fields.SchemaField({
				cuttingDamage: resistanceField(),
				impactDamage: resistanceField(),
				piercingDamage: resistanceField(),
				ballisticDamage: resistanceField(),
				fireDamage: resistanceField(),
				eletricDamage: resistanceField(),
				coldDamage: resistanceField(),
				chemicalDamage: resistanceField(),
				mentalDamage: resistanceField(),
				bloodDamage: resistanceField(),
				deathDamage: resistanceField(),
				knowledgeDamage: resistanceField(),
				energyDamage: resistanceField(),
			}),
			traits: new fields.SchemaField({
				smell: new fields.BooleanField({ initial: false }),
				acceleratedHealing: new fields.BooleanField({ initial: false }),
				incorporeal: new fields.BooleanField({ initial: false }),
				blindsight: new fields.BooleanField({ initial: false }),
				lowLightVision: new fields.BooleanField({ initial: false }),
				darkvision: new fields.BooleanField({ initial: false }),
			}),
		};
	}

	prepareDerivedData() {
		this._prepareBaseSkills();
	}

	_prepareBaseSkills() {
		const attributes = this.attributes;
		const skills = this.skills;

		for (const [keySkill, skill] of Object.entries(skills)) {
			if (!skill.attr || skill.attr.length === 0) {
				const def = defaultAttrs[keySkill];
				if (def) skill.attr = [def];
			}
			if (skill && Array.isArray(skill.attr) && skill.attr.length > 0) {
				const requiredAttrKey = skill.attr[0];
				if (!Object.prototype.hasOwnProperty.call(attributes, requiredAttrKey)) {
					console.warn(
						`Atributo '${requiredAttrKey}' necessário para a perícia '${keySkill}' não foi encontrado em system.attributes.`
					);
				}

				if (!skill.degree) skill.degree = { value: 0, label: "untrained" };

				skill.degree.value = calculateSkillProficiency(skill.degree.label);

				if (keySkill === "freeSkill" && skill.name) {
					skill.label = skill.name;
				} else {
					const labelKey = CONFIG.op.skills[keySkill] || keySkill;
					skill.label = game.i18n.localize(labelKey) ?? keySkill;
				}
			}
		}
	}

	static migrateData(data) {
		// Legacy threats wrote "Tamanho" to system.details.size (ghost path), but
		// the schema only exposes size at top level. Lift the value back and drop
		// the orphan key so cleanData stops discarding it on every save.
		if (data?.details?.size && !data.size) {
			data.size = data.details.size;
		}
		if (data?.details && data.details.size !== undefined) {
			delete data.details.size;
		}
		return super.migrateData(data);
	}
}
