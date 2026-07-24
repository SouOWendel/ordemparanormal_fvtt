import { describe, it, expect } from "vitest";
import { AgentData } from "../../../module/data/actors/agent-data.mjs";

describe("AgentData.defineSchema()", () => {
	it("returns all resource keys", () => {
		const schema = AgentData.defineSchema();
		expect(Object.keys(schema)).toContain("disableCalculations");
		expect(Object.keys(schema)).toContain("PV");
		expect(Object.keys(schema)).toContain("SAN");
		expect(Object.keys(schema)).toContain("PE");
		expect(Object.keys(schema)).toContain("PD");
		expect(Object.keys(schema)).toContain("NEX");
		expect(Object.keys(schema)).toContain("stage");
		expect(Object.keys(schema)).toContain("nivel");
	});

	it("returns defense, desloc, spaces", () => {
		const schema = AgentData.defineSchema();
		expect(Object.keys(schema)).toContain("defense");
		expect(Object.keys(schema)).toContain("desloc");
		expect(Object.keys(schema)).toContain("spaces");
	});

	it("returns identity fields", () => {
		const schema = AgentData.defineSchema();
		expect(Object.keys(schema)).toContain("class");
		expect(Object.keys(schema)).toContain("origin");
		expect(Object.keys(schema)).toContain("trilha");
		expect(Object.keys(schema)).toContain("patent");
	});

	it("attributes schema has all 5 attributes", () => {
		const schema = AgentData.defineSchema();
		const attrKeys = Object.keys(schema.attributes.fields);
		expect(attrKeys).toContain("dex");
		expect(attrKeys).toContain("int");
		expect(attrKeys).toContain("vit");
		expect(attrKeys).toContain("pre");
		expect(attrKeys).toContain("str");
	});

	it("skills schema has all 28 agent skills", () => {
		const schema = AgentData.defineSchema();
		const skillKeys = Object.keys(schema.skills.fields);
		const expected = [
			"acrobatics",
			"animal",
			"arts",
			"athleticism",
			"relevance",
			"sciences",
			"crime",
			"diplomacy",
			"deception",
			"resilience",
			"stealth",
			"initiative",
			"intimidation",
			"intuition",
			"investigation",
			"fighting",
			"medicine",
			"occultism",
			"perception",
			"driving",
			"aim",
			"reflexes",
			"religion",
			"survival",
			"tactics",
			"technology",
			"will",
			"freeSkill",
		];
		for (const skill of expected) {
			expect(skillKeys).toContain(skill);
		}
	});

	it("freeSkill has extra name and open condition fields", () => {
		const schema = AgentData.defineSchema();
		const freeSkillKeys = Object.keys(schema.skills.fields.freeSkill.fields);
		expect(freeSkillKeys).toContain("name");
		expect(freeSkillKeys).toContain("conditions");
		const condKeys = Object.keys(schema.skills.fields.freeSkill.fields.conditions.fields);
		expect(condKeys).toContain("open");
	});

	it("resources schema has res1, res2, res3", () => {
		const schema = AgentData.defineSchema();
		const resKeys = Object.keys(schema.resources.fields);
		expect(resKeys).toContain("res1");
		expect(resKeys).toContain("res2");
		expect(resKeys).toContain("res3");
	});

	it("returns biography and goals HTML fields", () => {
		const schema = AgentData.defineSchema();
		expect(Object.keys(schema)).toContain("biography");
		expect(Object.keys(schema)).toContain("goals");
	});

	it("returns ritual field", () => {
		const schema = AgentData.defineSchema();
		expect(Object.keys(schema)).toContain("ritual");
		expect(Object.keys(schema.ritual.fields)).toContain("DT");
	});

	it("migrateData returns data unchanged", () => {
		const data = { class: "fighter" };
		expect(AgentData.migrateData(data)).toBe(data);
	});
});

// Helper — builds a minimal agent system data object for prepareDerivedData tests
function makeAgent(overrides = {}) {
	const base = {
		class: "fighter",
		origin: "",
		trilha: "",
		NEX: { value: 5 },
		nivel: { value: 1 },
		stage: { value: 1 },
		PV: { value: 5, max: 0, perRound: 1 },
		PE: { value: 5, max: 0, perRound: 1 },
		PD: { value: 5, max: 0, perRound: 1 },
		SAN: { value: 5, max: 0, perRound: 1 },
		defense: { value: 10, bonus: 0, dodge: 0 },
		desloc: { value: 9, bonus: 0 },
		spaces: { bonus: { value: 0, max: 0 } },
		ritual: { DT: 0 },
		patent: {
			name: "",
			prestigePoints: 30,
			creditLimit: "",
			itemLimit1: null,
			itemLimit2: null,
			itemLimit3: null,
			itemLimit4: null,
		},
		attributes: {
			dex: { value: 2, bonus: 0 },
			int: { value: 1, bonus: 0 },
			vit: { value: 3, bonus: 0 },
			pre: { value: 2, bonus: 0 },
			str: { value: 2, bonus: 0 },
		},
		skills: {
			acrobatics: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			animal: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			arts: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			athleticism: {
				value: 0,
				attr: ["str", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			relevance: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			sciences: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			crime: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: true, trained: true },
			},
			diplomacy: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			deception: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			resilience: {
				value: 0,
				attr: ["vit", 1],
				degree: { label: "trained", value: 0 },
				conditions: { load: false, trained: false },
			},
			stealth: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: true, trained: false },
			},
			initiative: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			intimidation: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			intuition: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			investigation: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			fighting: {
				value: 0,
				attr: ["str", 1],
				degree: { label: "veteran", value: 0 },
				conditions: { load: false, trained: false },
			},
			medicine: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			occultism: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: true },
			},
			perception: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			driving: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: true },
			},
			aim: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			reflexes: {
				value: 0,
				attr: ["dex", 1],
				degree: { label: "untrained", value: 0 },
				mod: 0,
				conditions: { load: false, trained: false },
			},
			religion: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: true },
			},
			survival: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			tactics: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: true },
			},
			technology: {
				value: 0,
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: true },
			},
			will: {
				value: 0,
				attr: ["pre", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false },
			},
			freeSkill: {
				value: 0,
				name: "",
				attr: ["int", 1],
				degree: { label: "untrained", value: 0 },
				conditions: { load: false, trained: false, open: true },
			},
		},
		resources: {
			res1: { value: 0, max: 0, label: "" },
			res2: { value: 0, max: 0, label: "" },
			res3: { value: 0, max: 0, label: "" },
		},
		biography: "",
		goals: "",
	};
	return Object.assign({}, base, overrides);
}

function attachClassItemParent(agent, classSystemOverrides = {}) {
	agent.parent = {
		itemTypes: {
			class: [
				{
					system: {
						isSurvivor: false,
						...classSystemOverrides,
					},
				},
			],
		},
	};
	return agent;
}

describe("AgentData.prepareBaseData() — progress and resources", () => {
	it("calculates progress from NEX and assigns PE.perRound", () => {
		const agent = attachClassItemParent(
			new AgentData(
				makeAgent({
					NEX: { value: 15 },
				})
			)
		);

		agent.prepareBaseData();

		expect(agent._progress).toBe(3);
		expect(agent._isSurvivor).toBe(false);
		expect(agent._withoutSanity).toBe(false);
		expect(agent.PE.perRound).toBe(3);
	});

	it("calculates progress from nivel when nivel rule is enabled", () => {
		const originalSettingsGet = game.settings.get;
		game.settings.get = (module, key) => {
			if (key === "globalProgressRules") return 2;
			return originalSettingsGet(module, key);
		};

		try {
			const agent = attachClassItemParent(
				new AgentData(
					makeAgent({
						NEX: { value: 5 },
						nivel: { value: 7 },
					})
				)
			);

			agent.prepareBaseData();

			expect(agent._progress).toBe(7);
			expect(agent._isSurvivor).toBe(false);
			expect(agent.PE.perRound).toBe(7);
		} finally {
			game.settings.get = originalSettingsGet;
		}
	});

	it("uses stage as progress and assigns PD.perRound for survivor", () => {
		const agent = attachClassItemParent(
			new AgentData(
				makeAgent({
					stage: { value: 4 },
				})
			),
			{ isSurvivor: true }
		);

		agent.prepareBaseData();

		expect(agent._progress).toBe(4);
		expect(agent._isSurvivor).toBe(true);
		expect(agent.PD.perRound).toBe(1);
	});

	it("leaves status maxima unchanged because OrdemActor calculates them", () => {
		const agent = attachClassItemParent(
			new AgentData(
				makeAgent({
					PV: { value: 5, max: 23, perRound: 1 },
					PE: { value: 5, max: 4, perRound: 1 },
					PD: { value: 5, max: 0, perRound: 1 },
					SAN: { value: 5, max: 12, perRound: 1 },
				})
			)
		);

		agent.prepareBaseData();

		expect(agent.PV.max).toBe(23);
		expect(agent.PE.max).toBe(4);
		expect(agent.PD.max).toBe(0);
		expect(agent.SAN.max).toBe(12);
	});
});

describe("AgentData.prepareBaseData() — ritual DT", () => {
	it("writes DT to this.ritual.DT", () => {
		const agent = attachClassItemParent(new AgentData(makeAgent({ NEX: { value: 10 } })));
		agent.prepareBaseData();
		// not survivor, NEX=10 → calcNEX=2, PRE=2 → DT = 10 + 2 + 2 = 14
		expect(agent.ritual.DT).toBe(14);
	});
});

describe("AgentData.prepareDerivedData() — patent", () => {
	it("assigns patent name based on prestigePoints", () => {
		const agent = new AgentData(
			makeAgent({
				patent: {
					name: "",
					prestigePoints: 30,
					creditLimit: "",
					itemLimit1: null,
					itemLimit2: null,
					itemLimit3: null,
					itemLimit4: null,
				},
			})
		);
		agent.prepareDerivedData();
		expect(agent.patent.name).toBe("Operador");
	});
});

describe("AgentData.prepareDerivedData() — defense", () => {
	it("does not mutate defense (delegated to OrdemActor.prepareDerivedData)", () => {
		// Defense is calculated in OrdemActor.prepareDerivedData() after _prepareItemsDerivedData
		// and _prepareActorSpaces, so that armor bonuses are included in dodge.
		// AgentData.prepareDerivedData() must not touch defense.value or defense.dodge.
		const agent = new AgentData(makeAgent());
		agent.prepareDerivedData();
		expect(agent.defense.value).toBe(10); // schema initial — unchanged
		expect(agent.defense.dodge).toBe(0); // schema initial — unchanged
	});
});

describe("AgentData._prepareBaseSkills()", () => {
	it("keeps skill.attr[0] as the attribute key", () => {
		const agent = new AgentData(makeAgent());
		agent._prepareBaseSkills();
		expect(agent.skills.fighting.attr[0]).toBe("str");
		expect(agent.skills.resilience.attr[0]).toBe("vit");
	});

	it("calculates skill.degree.value from degree.label", () => {
		const agent = new AgentData(makeAgent());
		agent._prepareBaseSkills();
		expect(agent.skills.resilience.degree.value).toBe(5); // trained
		expect(agent.skills.fighting.degree.value).toBe(10); // veteran
		expect(agent.skills.aim.degree.value).toBe(0); // untrained
	});

	it("appends + suffix for overLoad skills", () => {
		const agent = new AgentData(makeAgent());
		agent._prepareBaseSkills();
		expect(agent.skills.stealth.label).toMatch(/\+$/);
	});

	it("appends * suffix for needTraining skills", () => {
		const agent = new AgentData(makeAgent());
		agent._prepareBaseSkills();
		expect(agent.skills.occultism.label).toMatch(/\*$/);
	});

	it("uses freeSkill.name as label when name is set", () => {
		const data = makeAgent();
		data.skills.freeSkill.name = "Culinária";
		const agent = new AgentData(data);
		agent._prepareBaseSkills();
		expect(agent.skills.freeSkill.label).toBe("Culinária");
	});

	it("?? fallback: uses i18n key when localize returns empty string", () => {
		// game.i18n.localize returns the key unchanged in mocks (non-empty string)
		// this test confirms label is assigned and is a non-empty string
		const agent = new AgentData(makeAgent());
		agent._prepareBaseSkills();
		expect(agent.skills.fighting.label).toBeTruthy();
	});
});
