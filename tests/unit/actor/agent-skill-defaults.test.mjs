import { describe, it, expect, beforeAll } from "vitest";

let AgentData;
beforeAll(async () => {
	await import("../../setup/foundry-mocks.mjs");
	({ AgentData } = await import("../../../module/data/actors/agent-data.mjs"));
});

// Canonical skill → attribute mapping from the system rules.
const expected = {
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

function getSkillsSchema() {
	const schema = AgentData.defineSchema();
	return schema.skills.fields;
}

describe("AgentData skill schema defaults", () => {
	it("every skill defines an attr default", () => {
		const skills = getSkillsSchema();
		for (const key of Object.keys(expected)) {
			expect(skills[key], `missing skill: ${key}`).toBeDefined();
		}
	});

	it("each skill defaults to its canonical attribute", () => {
		const skills = getSkillsSchema();
		for (const [key, attr] of Object.entries(expected)) {
			const initial = skills[key].fields.attr.initial;
			expect(initial, `${key} default attr`).toEqual([attr]);
		}
	});
});

describe("AgentData.migrateData skill attribute healing", () => {
	it("rewrites legacy ['dex'] to canonical attr for non-dex skills", () => {
		const data = {
			skills: {
				investigation: { attr: ["dex"] },
				medicine: { attr: ["dex"] },
				religion: { attr: ["dex"] },
				fighting: { attr: ["dex"] },
				perception: { attr: ["dex"] },
			},
		};
		AgentData.migrateData(data);
		expect(data.skills.investigation.attr).toEqual(["int"]);
		expect(data.skills.medicine.attr).toEqual(["int"]);
		expect(data.skills.religion.attr).toEqual(["pre"]);
		expect(data.skills.fighting.attr).toEqual(["str"]);
		expect(data.skills.perception.attr).toEqual(["pre"]);
	});

	it("preserves ['dex'] for skills whose canonical attr is dex", () => {
		const data = {
			skills: {
				acrobatics: { attr: ["dex"] },
				aim: { attr: ["dex"] },
				crime: { attr: ["dex"] },
				reflexes: { attr: ["dex"] },
				stealth: { attr: ["dex"] },
				initiative: { attr: ["dex"] },
				driving: { attr: ["dex"] },
			},
		};
		AgentData.migrateData(data);
		expect(data.skills.acrobatics.attr).toEqual(["dex"]);
		expect(data.skills.aim.attr).toEqual(["dex"]);
		expect(data.skills.crime.attr).toEqual(["dex"]);
		expect(data.skills.reflexes.attr).toEqual(["dex"]);
		expect(data.skills.stealth.attr).toEqual(["dex"]);
		expect(data.skills.initiative.attr).toEqual(["dex"]);
		expect(data.skills.driving.attr).toEqual(["dex"]);
	});

	it("preserves explicit non-dex user choices", () => {
		const data = {
			skills: {
				investigation: { attr: ["pre"] },
				medicine: { attr: ["vit"] },
			},
		};
		AgentData.migrateData(data);
		expect(data.skills.investigation.attr).toEqual(["pre"]);
		expect(data.skills.medicine.attr).toEqual(["vit"]);
	});

	it("skips skills with multi-attr arrays", () => {
		const data = {
			skills: {
				investigation: { attr: ["dex", "int"] },
			},
		};
		AgentData.migrateData(data);
		expect(data.skills.investigation.attr).toEqual(["dex", "int"]);
	});

	it("handles missing skills object", () => {
		expect(() => AgentData.migrateData({})).not.toThrow();
		expect(() => AgentData.migrateData(null)).not.toThrow();
		expect(() => AgentData.migrateData(undefined)).not.toThrow();
	});

	it("handles skills without attr field", () => {
		const data = { skills: { investigation: {} } };
		expect(() => AgentData.migrateData(data)).not.toThrow();
		expect(data.skills.investigation.attr).toBeUndefined();
	});

	it("does not touch unknown skill keys", () => {
		const data = { skills: { customSkill: { attr: ["dex"] } } };
		AgentData.migrateData(data);
		expect(data.skills.customSkill.attr).toEqual(["dex"]);
	});
});
