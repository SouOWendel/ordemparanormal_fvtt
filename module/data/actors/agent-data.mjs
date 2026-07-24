import {
	calculateSkillProficiency,
	calculateProgress,
	calculatePerRound,
	calculatePatent,
	calculateRitualDT,
} from "../../helpers/actor-calculations.mjs";

const defaultAttrs = {
	fighting: "str",
	aim: "dex",
	resilience: "vit",
	reflexes: "dex",
	will: "pre",
	initiative: "dex",
	perception: "pre",
	freeSkill: "int",
	acrobatics: "dex",
	animal: "pre",
	arts: "pre",
	athleticism: "str",
	relevance: "int",
	sciences: "int",
	crime: "dex",
	diplomacy: "pre",
	deception: "pre",
	stealth: "dex",
	intimidation: "pre",
	intuition: "pre",
	investigation: "int",
	medicine: "int",
	occultism: "int",
	driving: "dex",
	religion: "pre",
	survival: "int",
	tactics: "int",
	technology: "int",
};

function resourceField(valueInit, maxInit, extras = {}) {
	const fields = foundry.data.fields;
	return new fields.SchemaField({
		value: new fields.NumberField({ required: true, integer: true, initial: valueInit }),
		max: new fields.NumberField({ required: true, integer: true, initial: maxInit }),
		perRound: new fields.NumberField({ integer: true, initial: 1 }),
		...extras,
	});
}

function attrField() {
	const fields = foundry.data.fields;
	return new fields.SchemaField({
		value: new fields.NumberField({ integer: true, min: 0, initial: 1 }),
		bonus: new fields.NumberField({ integer: true, initial: 0 }),
	});
}

function agentSkillField(defaultAttr = "dex") {
	const fields = foundry.data.fields;
	return new fields.SchemaField({
		value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
		attr: new fields.ArrayField(new fields.StringField(), { initial: [defaultAttr] }),
		degree: new fields.SchemaField({
			label: new fields.StringField({ initial: "untrained" }),
			value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
		}),
		mod: new fields.NumberField({ integer: true, initial: 0, nullable: true }),
		conditions: new fields.SchemaField({
			load: new fields.BooleanField({ initial: false }),
			trained: new fields.BooleanField({ initial: false }),
		}),
	});
}

export class AgentData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			disableCalculations: new fields.BooleanField({ initial: false }),
			PV: resourceField(5, 10, { nonLethal: new foundry.data.fields.NumberField({ integer: true, initial: 0 }) }),
			SAN: resourceField(5, 5),
			PE: resourceField(5, 5),
			PD: resourceField(5, 5),
			NEX: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, min: 0, max: 99, initial: 1 }),
			}),
			stage: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, min: 1, initial: 1 }),
			}),
			nivel: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, min: 1, initial: 1 }),
			}),
			defense: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 10 }),
				bonus: new fields.NumberField({ integer: true, initial: 0 }),
				dodge: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			desloc: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 9 }),
				bonus: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			spaces: new fields.SchemaField({
				bonus: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0 }),
					max: new fields.NumberField({ integer: true, initial: 0 }),
				}),
			}),
			class: new fields.StringField({ initial: "" }),
			origin: new fields.StringField({ initial: "" }),
			trilha: new fields.StringField({ initial: "" }),
			patent: new fields.SchemaField({
				name: new fields.StringField({ initial: "" }),
				prestigePoints: new fields.NumberField({ integer: true, min: -999, initial: 0 }),
				creditLimit: new fields.StringField({ initial: "" }),
				itemLimit1: new fields.NumberField({ nullable: true, initial: null }),
				itemLimit2: new fields.NumberField({ nullable: true, initial: null }),
				itemLimit3: new fields.NumberField({ nullable: true, initial: null }),
				itemLimit4: new fields.NumberField({ nullable: true, initial: null }),
			}),
			attributes: new fields.SchemaField({
				dex: attrField(),
				int: attrField(),
				vit: attrField(),
				pre: attrField(),
				str: attrField(),
			}),
			skills: new fields.SchemaField({
				acrobatics: agentSkillField(defaultAttrs.acrobatics),
				animal: agentSkillField(defaultAttrs.animal),
				arts: agentSkillField(defaultAttrs.arts),
				athleticism: agentSkillField(defaultAttrs.athleticism),
				relevance: agentSkillField(defaultAttrs.relevance),
				sciences: agentSkillField(defaultAttrs.sciences),
				crime: agentSkillField(defaultAttrs.crime),
				diplomacy: agentSkillField(defaultAttrs.diplomacy),
				deception: agentSkillField(defaultAttrs.deception),
				resilience: agentSkillField(defaultAttrs.resilience),
				stealth: agentSkillField(defaultAttrs.stealth),
				initiative: agentSkillField(defaultAttrs.initiative),
				intimidation: agentSkillField(defaultAttrs.intimidation),
				intuition: agentSkillField(defaultAttrs.intuition),
				investigation: agentSkillField(defaultAttrs.investigation),
				fighting: agentSkillField(defaultAttrs.fighting),
				medicine: agentSkillField(defaultAttrs.medicine),
				occultism: agentSkillField(defaultAttrs.occultism),
				perception: agentSkillField(defaultAttrs.perception),
				driving: agentSkillField(defaultAttrs.driving),
				aim: agentSkillField(defaultAttrs.aim),
				reflexes: agentSkillField(defaultAttrs.reflexes),
				religion: agentSkillField(defaultAttrs.religion),
				survival: agentSkillField(defaultAttrs.survival),
				tactics: agentSkillField(defaultAttrs.tactics),
				technology: agentSkillField(defaultAttrs.technology),
				will: agentSkillField(defaultAttrs.will),
				freeSkill: new fields.SchemaField({
					value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
					attr: new fields.ArrayField(new fields.StringField(), { initial: ["int"] }),
					degree: new fields.SchemaField({
						label: new fields.StringField({ initial: "untrained" }),
						value: new fields.NumberField({ required: true, integer: true, initial: 0 }),
					}),
					mod: new fields.NumberField({ integer: true, initial: 0, nullable: true }),
					name: new fields.StringField({ initial: "" }),
					conditions: new fields.SchemaField({
						load: new fields.BooleanField({ initial: false }),
						trained: new fields.BooleanField({ initial: false }),
						open: new fields.BooleanField({ initial: true }),
					}),
				}),
			}),
			resources: new fields.SchemaField({
				res1: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0 }),
					max: new fields.NumberField({ integer: true, initial: 0 }),
					label: new fields.StringField({ initial: "" }),
				}),
				res2: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0 }),
					max: new fields.NumberField({ integer: true, initial: 0 }),
					label: new fields.StringField({ initial: "" }),
				}),
				res3: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0 }),
					max: new fields.NumberField({ integer: true, initial: 0 }),
					label: new fields.StringField({ initial: "" }),
				}),
			}),
			biography: new fields.HTMLField({ initial: "A personalidade, aparência e história do seu personagem aqui." }),
			goals: new fields.HTMLField({ initial: "Os seus objetivos aqui." }),
			ritual: new fields.SchemaField({
				DT: new fields.NumberField({ integer: true, initial: 0 }),
			}),
		};
	}

	prepareBaseData() {
		const rule = game.settings.get("ordemparanormal", "globalProgressRules");
		const isSurvivor = this.parent.itemTypes.class[0]?.system?.isSurvivor ?? false;
		const withoutSanity = game.settings.get("ordemparanormal", "globalPlayingWithoutSanity");

		const progress = calculateProgress(isSurvivor, rule, this.NEX.value, this.nivel.value, this.stage.value);
		this._progress = progress;
		this._isSurvivor = isSurvivor;
		this._withoutSanity = withoutSanity;

		// PD / PE per round
		const perRound = calculatePerRound(isSurvivor, progress, withoutSanity);
		if (perRound.PD_perRound !== undefined) this.PD.perRound = perRound.PD_perRound;
		if (perRound.PE_perRound !== undefined) this.PE.perRound = perRound.PE_perRound;

		// Ritual DT
		const PRE = this.attributes.pre.value;
		this.ritual.DT = calculateRitualDT(isSurvivor, progress, PRE);
	}

	prepareDerivedData() {
		// Skills
		this._prepareBaseSkills();

		// Patent
		Object.assign(this.patent, calculatePatent(this.patent.prestigePoints));
		// Defense is calculated in OrdemActor.prepareDerivedData() after item/space
		// mutations so that armor bonuses are included in the dodge value.
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

				const overLoad = skill?.conditions?.load || false;
				const needTraining = skill?.conditions?.trained || false;

				if (!skill.degree) skill.degree = { value: 0, label: "untrained" };

				skill.degree.value = calculateSkillProficiency(skill.degree.label);

				if (keySkill === "freeSkill" && skill.name) {
					skill.label = skill.name + (overLoad ? "+" : needTraining ? "*" : "");
				} else {
					const labelKey = CONFIG.op.skills[keySkill] || keySkill;
					skill.label = (game.i18n.localize(labelKey) ?? keySkill) + (overLoad ? "+" : needTraining ? "*" : "");
				}
			}
		}
	}

	static migrateData(data) {
		// Heal actors created before the per-skill default attribute was wired
		// up. Old schema initialized every skill with attr: ["dex"], so skills
		// like Investigação, Medicina, Religião all showed up as Destreza.
		// Rewrite only when the stored value is exactly the legacy default and
		// the canonical attribute differs. Skills whose canonical attribute is
		// already dex (acrobatics, aim, crime, etc.) stay untouched.
		if (data?.skills && typeof data.skills === "object") {
			for (const [key, skill] of Object.entries(data.skills)) {
				const canonical = defaultAttrs[key];
				if (!canonical || canonical === "dex") continue;
				if (Array.isArray(skill?.attr) && skill.attr.length === 1 && skill.attr[0] === "dex") {
					skill.attr = [canonical];
				}
			}
		}
		return super.migrateData(data);
	}
}
