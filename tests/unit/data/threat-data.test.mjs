import { describe, it, expect } from "vitest";
import { ThreatData } from "../../../module/data/models/actors/threat.mjs";

describe("ThreatData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = ThreatData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("attributes");
		expect(keys).toContain("attacks");
		expect(keys).toContain("skills");
		expect(keys).toContain("elements");
		expect(keys).toContain("abilities");
		expect(keys).toContain("size");
		expect(keys).toContain("disturbingPresence");
		expect(keys).toContain("senses");
		expect(keys).toContain("defense");
		expect(keys).toContain("vulnerabilities");
		expect(keys).toContain("actions");
		expect(keys).toContain("details");
		expect(keys).toContain("temporary");
		expect(keys).toContain("resistances");
		expect(keys).toContain("traits");
	});

	it("attributes schema has hp, dex, int, pre, str, vit, movement, vd", () => {
		const schema = ThreatData.defineSchema();
		const attrKeys = Object.keys(schema.attributes.fields);
		expect(attrKeys).toContain("hp");
		expect(attrKeys).toContain("dex");
		expect(attrKeys).toContain("int");
		expect(attrKeys).toContain("pre");
		expect(attrKeys).toContain("str");
		expect(attrKeys).toContain("vit");
		expect(attrKeys).toContain("movement");
		expect(attrKeys).toContain("vd");
	});

	it("skills schema has all 8 threat skills", () => {
		const schema = ThreatData.defineSchema();
		const skillKeys = Object.keys(schema.skills.fields);
		expect(skillKeys).toContain("fighting");
		expect(skillKeys).toContain("aim");
		expect(skillKeys).toContain("resilience");
		expect(skillKeys).toContain("reflexes");
		expect(skillKeys).toContain("will");
		expect(skillKeys).toContain("initiative");
		expect(skillKeys).toContain("perception");
		expect(skillKeys).toContain("freeSkill");
	});

	it("resistances schema has all 13 damage types", () => {
		const schema = ThreatData.defineSchema();
		const resKeys = Object.keys(schema.resistances.fields);
		expect(resKeys).toContain("cuttingDamage");
		expect(resKeys).toContain("impactDamage");
		expect(resKeys).toContain("piercingDamage");
		expect(resKeys).toContain("ballisticDamage");
		expect(resKeys).toContain("fireDamage");
		expect(resKeys).toContain("eletricDamage");
		expect(resKeys).toContain("coldDamage");
		expect(resKeys).toContain("chemicalDamage");
		expect(resKeys).toContain("mentalDamage");
		expect(resKeys).toContain("bloodDamage");
		expect(resKeys).toContain("deathDamage");
		expect(resKeys).toContain("knowledgeDamage");
		expect(resKeys).toContain("energyDamage");
	});

	it("traits schema has all 6 boolean flags", () => {
		const schema = ThreatData.defineSchema();
		const traitKeys = Object.keys(schema.traits.fields);
		expect(traitKeys).toContain("smell");
		expect(traitKeys).toContain("acceleratedHealing");
		expect(traitKeys).toContain("incorporeal");
		expect(traitKeys).toContain("blindsight");
		expect(traitKeys).toContain("lowLightVision");
		expect(traitKeys).toContain("darkvision");
	});

	it("freeSkill has a name field", () => {
		const schema = ThreatData.defineSchema();
		const freeSkillKeys = Object.keys(schema.skills.fields.freeSkill.fields);
		expect(freeSkillKeys).toContain("name");
	});

	it("migrateData returns data unchanged", () => {
		const data = { size: "large" };
		expect(ThreatData.migrateData(data)).toBe(data);
	});
});

// TODO (Fase 3 - Tarefa 3.1): Reativar quando `_prepareBaseSkills` for implementada oficialmente no TypeDataModel da Ameaça
describe.skip("ThreatData._prepareBaseSkills()", () => {
	function makeThreat(overrides = {}) {
		return Object.assign(
			{
				attributes: {
					dex: { value: 2 },
					str: { value: 3 },
					vit: { value: 2 },
					pre: { value: 1 },
					int: { value: 1 },
				},
				skills: {
					fighting: { value: 0, attr: ["str", 1], degree: { label: "trained", value: 0 } },
					aim: { value: 0, attr: ["dex", 1], degree: { label: "untrained", value: 0 } },
					resilience: { value: 0, attr: ["vit", 1], degree: { label: "untrained", value: 0 } },
					reflexes: { value: 0, attr: ["dex", 1], degree: { label: "untrained", value: 0 } },
					will: { value: 0, attr: ["pre", 1], degree: { label: "untrained", value: 0 } },
					initiative: { value: 0, attr: ["dex", 1], degree: { label: "untrained", value: 0 } },
					perception: { value: 0, attr: ["pre", 1], degree: { label: "untrained", value: 0 } },
					freeSkill: { value: 0, name: "Instinto", attr: ["int", 1], degree: { label: "veteran", value: 0 } },
				},
			},
			overrides
		);
	}

	it("keeps skill.attr[0] as the attribute key", () => {
		const threat = makeThreat();
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.attr[0]).toBe("str");
		expect(td.skills.aim.attr[0]).toBe("dex");
	});

	it("calculates skill.degree.value from degree.label", () => {
		const threat = makeThreat();
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.degree.value).toBe(5); // trained = 5
		expect(td.skills.aim.degree.value).toBe(0); // untrained = 0
		expect(td.skills.freeSkill.degree.value).toBe(10); // veteran = 10
	});

	it("uses freeSkill.name as label when name is set", () => {
		const threat = makeThreat();
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.freeSkill.label).toBe("Instinto");
	});

	it("uses i18n key as label for regular skills", () => {
		const threat = makeThreat();
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		// game.i18n.localize returns the key unchanged in mocks
		expect(typeof td.skills.fighting.label).toBe("string");
		expect(td.skills.fighting.label.length).toBeGreaterThan(0);
	});

	it("fills in missing attr from defaultAttrs map", () => {
		const threat = makeThreat();
		threat.skills.fighting.attr = [];
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.attr[0]).toBe("str");
	});
});
