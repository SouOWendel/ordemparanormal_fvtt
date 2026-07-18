import { installBatchGuards, withActor } from "../helpers/fixtures.mjs";
import { AgentData } from "../../data/actors/agent-data.mjs";

// Canonical mapping from system rules. Kept here so the test fails loudly if
// someone tweaks the schema defaults without updating the manual mapping.
const expectedDefaults = {
	acrobatics: "dex",
	animal: "pre",
	arts: "pre",
	athleticism: "str",
	relevance: "int",
	sciences: "int",
	crime: "dex",
	diplomacy: "pre",
	deception: "pre",
	resilience: "vit",
	stealth: "dex",
	initiative: "dex",
	intimidation: "pre",
	intuition: "pre",
	investigation: "int",
	fighting: "str",
	medicine: "int",
	occultism: "int",
	perception: "pre",
	driving: "dex",
	aim: "dex",
	reflexes: "dex",
	religion: "pre",
	survival: "int",
	tactics: "int",
	technology: "int",
	will: "pre",
	freeSkill: "int",
};

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.agent.skillDefaults",
		(context) => {
			const { describe, it, assert } = context;
			installBatchGuards(context, { prefix: "[skill-defaults]" });

			// ----------------------------------------------------------------
			// New actors get the canonical attribute per skill
			// ----------------------------------------------------------------
			describe("new agent — every skill defaults to its canonical attribute", () => {
				it("creates an agent and inspects every skill.attr[0]", async () => {
					await withActor(
						{
							name: "[skill-defaults] Fresh Agent",
							type: "agent",
							system: {
								class: "fighter",
								attributes: {
									vit: { value: 3 },
									pre: { value: 2 },
									dex: { value: 2 },
									str: { value: 2 },
									int: { value: 1 },
								},
								NEX: { value: 5 },
							},
						},
						async (actor) => {
							for (const [key, expected] of Object.entries(expectedDefaults)) {
								const skill = actor.system.skills[key];
								assert.isDefined(skill, `skill '${key}' missing from system.skills`);
								assert.equal(
									skill.attr?.[0],
									expected,
									`skill '${key}' default attr: expected '${expected}', got '${skill.attr?.[0]}'`
								);
							}
						}
					);
				});
			});

			// ----------------------------------------------------------------
			// Legacy data healing via migrateData
			// ----------------------------------------------------------------
			describe("migrateData — heals legacy ['dex'] defaults", () => {
				it("rewrites investigation, medicine, religion, fighting, perception", () => {
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
					assert.deepEqual(data.skills.investigation.attr, ["int"]);
					assert.deepEqual(data.skills.medicine.attr, ["int"]);
					assert.deepEqual(data.skills.religion.attr, ["pre"]);
					assert.deepEqual(data.skills.fighting.attr, ["str"]);
					assert.deepEqual(data.skills.perception.attr, ["pre"]);
				});

				it("keeps ['dex'] for skills whose canonical attr is dex", () => {
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
					for (const key of Object.keys(data.skills)) {
						assert.deepEqual(data.skills[key].attr, ["dex"], `${key} should stay dex`);
					}
				});

				it("preserves explicit non-dex user choices", () => {
					const data = {
						skills: {
							investigation: { attr: ["pre"] },
							religion: { attr: ["int"] },
						},
					};
					AgentData.migrateData(data);
					assert.deepEqual(data.skills.investigation.attr, ["pre"]);
					assert.deepEqual(data.skills.religion.attr, ["int"]);
				});
			});

			// ----------------------------------------------------------------
			// Existing actor with legacy data — migrateData runs on load and
			// the actor exposes the corrected attr
			// ----------------------------------------------------------------
			describe("existing actor — load applies migrateData", () => {
				it("creating an actor with legacy ['dex'] yields corrected attr", async () => {
					await withActor(
						{
							name: "[skill-defaults] Legacy Agent",
							type: "agent",
							system: {
								class: "fighter",
								attributes: {
									vit: { value: 3 },
									pre: { value: 2 },
									dex: { value: 2 },
									str: { value: 2 },
									int: { value: 1 },
								},
								NEX: { value: 5 },
								skills: {
									investigation: { attr: ["dex"] },
									religion: { attr: ["dex"] },
									fighting: { attr: ["dex"] },
									acrobatics: { attr: ["dex"] },
								},
							},
						},
						async (actor) => {
							assert.equal(actor.system.skills.investigation.attr[0], "int", "investigation should heal to int");
							assert.equal(actor.system.skills.religion.attr[0], "pre", "religion should heal to pre");
							assert.equal(actor.system.skills.fighting.attr[0], "str", "fighting should heal to str");
							assert.equal(actor.system.skills.acrobatics.attr[0], "dex", "acrobatics canonical is dex");
						}
					);
				});
			});
		},
		{ displayName: "OP | Agent: skill default attributes + legacy healing" }
	);
});
