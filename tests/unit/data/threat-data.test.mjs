import { describe, it, expect } from "vitest";
import { ThreatData } from "../../../module/data/actors/threat-data.mjs";

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

	it("details schema exposes description, fearRiddle, and creatureType", () => {
		const schema = ThreatData.defineSchema();
		const detailsKeys = Object.keys(schema.details.fields);
		expect(detailsKeys).toContain("description");
		expect(detailsKeys).toContain("fearRiddle");
		expect(detailsKeys).toContain("creatureType");
	});

	it("size is declared top-level and NOT inside details (ghost-field regression)", () => {
		const schema = ThreatData.defineSchema();
		expect(Object.keys(schema)).toContain("size");
		expect(Object.keys(schema.details.fields)).not.toContain("size");
	});

	it("resistances schema does NOT contain damageDamage legacy field", () => {
		const schema = ThreatData.defineSchema();
		expect(Object.keys(schema.resistances.fields)).not.toContain("damageDamage");
	});
});

describe("ThreatData.migrateData()", () => {
	it("returns the same reference (mutation in place)", () => {
		const data = { size: "large" };
		expect(ThreatData.migrateData(data)).toBe(data);
	});

	it("lifts legacy details.size into top-level size when size is empty", () => {
		const data = { details: { size: "large" }, size: "" };
		const out = ThreatData.migrateData(data);
		expect(out.size).toBe("large");
		expect(out.details.size).toBeUndefined();
	});

	it("preserves existing top-level size when both paths are set", () => {
		const data = { details: { size: "small" }, size: "huge" };
		const out = ThreatData.migrateData(data);
		expect(out.size).toBe("huge");
		expect(out.details.size).toBeUndefined();
	});

	it("removes empty-string details.size without overwriting size", () => {
		const data = { details: { size: "" }, size: "medium" };
		const out = ThreatData.migrateData(data);
		expect(out.size).toBe("medium");
		expect(out.details.size).toBeUndefined();
	});

	it("is idempotent (running twice produces the same result)", () => {
		const data = { details: { size: "large" }, size: "" };
		const once = ThreatData.migrateData(data);
		const snapshot = { size: once.size, details: { ...once.details } };
		ThreatData.migrateData(once);
		expect(once.size).toBe(snapshot.size);
		expect(once.details).toEqual(snapshot.details);
	});

	it("leaves data untouched when details.size is absent", () => {
		const data = { size: "medium", details: { description: "x" } };
		const out = ThreatData.migrateData(data);
		expect(out.size).toBe("medium");
		expect(out.details).toEqual({ description: "x" });
	});

	it("handles missing details object without throwing", () => {
		const data = { size: "" };
		expect(() => ThreatData.migrateData(data)).not.toThrow();
	});
});

describe("ThreatData._prepareBaseSkills()", () => {
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

	it("derives threat-exclusive degree labels (master/alfa/gama/delta)", () => {
		const threat = makeThreat({
			skills: {
				fighting: { value: 0, attr: ["str"], degree: { label: "master", value: 0 } },
				aim: { value: 0, attr: ["dex"], degree: { label: "alfa", value: 0 } },
				resilience: { value: 0, attr: ["vit"], degree: { label: "gama", value: 0 } },
				reflexes: { value: 0, attr: ["dex"], degree: { label: "delta", value: 0 } },
				will: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0 } },
				initiative: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0 } },
				perception: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0 } },
				freeSkill: { value: 0, name: "X", attr: ["int"], degree: { label: "untrained", value: 0 } },
			},
		});
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.degree.value).toBe(20);
		expect(td.skills.aim.degree.value).toBe(25);
		expect(td.skills.resilience.degree.value).toBe(30);
		expect(td.skills.reflexes.degree.value).toBe(35);
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

	// Review round 2 — degree.override (homebrew / non-standard stat blocks)
	it("degree.override (positive int) wins over label-derived value", () => {
		const threat = makeThreat({
			skills: {
				fighting: { value: 0, attr: ["str"], degree: { label: "trained", value: 0, override: 17 } },
				aim: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				resilience: { value: 0, attr: ["vit"], degree: { label: "untrained", value: 0, override: null } },
				reflexes: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				will: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0, override: null } },
				initiative: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				perception: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0, override: null } },
				freeSkill: {
					value: 0,
					name: "X",
					attr: ["int"],
					degree: { label: "untrained", value: 0, override: null },
				},
			},
		});
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.degree.value).toBe(17); // override
		expect(td.skills.aim.degree.value).toBe(0); // derived (override is null)
	});

	it("degree.override = 0 (explicit) wins over a 'trained' label that would derive 5", () => {
		const threat = makeThreat({
			skills: {
				fighting: { value: 0, attr: ["str"], degree: { label: "trained", value: 0, override: 0 } },
				aim: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				resilience: { value: 0, attr: ["vit"], degree: { label: "untrained", value: 0, override: null } },
				reflexes: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				will: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0, override: null } },
				initiative: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				perception: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0, override: null } },
				freeSkill: {
					value: 0,
					name: "X",
					attr: ["int"],
					degree: { label: "untrained", value: 0, override: null },
				},
			},
		});
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.degree.value).toBe(0); // 0 ≠ null → override wins
	});

	it("degree.override = NaN falls back to label-derived (defensive)", () => {
		const threat = makeThreat({
			skills: {
				fighting: { value: 0, attr: ["str"], degree: { label: "veteran", value: 0, override: Number.NaN } },
				aim: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				resilience: { value: 0, attr: ["vit"], degree: { label: "untrained", value: 0, override: null } },
				reflexes: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				will: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0, override: null } },
				initiative: { value: 0, attr: ["dex"], degree: { label: "untrained", value: 0, override: null } },
				perception: { value: 0, attr: ["pre"], degree: { label: "untrained", value: 0, override: null } },
				freeSkill: {
					value: 0,
					name: "X",
					attr: ["int"],
					degree: { label: "untrained", value: 0, override: null },
				},
			},
		});
		const td = new ThreatData(threat);
		td._prepareBaseSkills();
		expect(td.skills.fighting.degree.value).toBe(10); // veteran derived (NaN guard)
	});
});
