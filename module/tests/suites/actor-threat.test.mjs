import { installBatchGuards } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.threat",
		(context) => {
			const { describe, it, assert, before, after } = context;
			installBatchGuards(context, { prefix: "[Quench]" });


			describe("ThreatData._prepareBaseSkills() — degree value", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test Threat Skills",
						type: "threat",
						system: {
							attributes: { str: { value: 4 }, dex: { value: 2 }, vit: { value: 1 }, pre: { value: 1 }, int: { value: 1 } },
							skills: {
								fighting: { value: 0, attr: ["str", 1], degree: { label: "trained", value: 0 } },
								aim: { value: 0, attr: ["dex", 1], degree: { label: "veteran", value: 0 } },
								freeSkill: { value: 0, name: "Instinto", attr: ["int", 1], degree: { label: "expert", value: 0 } },
							},
						},
					});
				});

				after(async () => {
					await actor?.delete();
				});

				it("fighting degree 'trained' → degree.value = 5", () => {
					assert.equal(actor.system.skills.fighting.degree.value, 5);
				});

				it("aim degree 'veteran' → degree.value = 10", () => {
					assert.equal(actor.system.skills.aim.degree.value, 10);
				});

				it("freeSkill degree 'expert' → degree.value = 15", () => {
					assert.equal(actor.system.skills.freeSkill.degree.value, 15);
				});

				it("fighting attr[0] is 'str'", () => {
					assert.equal(actor.system.skills.fighting.attr[0], "str");
				});

				it("freeSkill.name used as label", () => {
					assert.equal(actor.system.skills.freeSkill.label, "Instinto");
				});
			});

			describe("ThreatData — resistances persistence", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test Threat Resistances",
						type: "threat",
						system: {
							resistances: {
								fireDamage: { value: 5, vulnerable: false, immune: false },
								coldDamage: { value: 0, vulnerable: true, immune: false },
								energyDamage: { value: 0, vulnerable: false, immune: true },
							},
						},
					});
				});

				after(async () => {
					await actor?.delete();
				});

				it("fireDamage.value persists as 5", () => {
					assert.equal(actor.system.resistances.fireDamage.value, 5);
				});

				it("coldDamage.vulnerable persists as true", () => {
					assert.isTrue(actor.system.resistances.coldDamage.vulnerable);
				});

				it("energyDamage.immune persists as true", () => {
					assert.isTrue(actor.system.resistances.energyDamage.immune);
				});

				it("update resistance and reread", async () => {
					await actor.update({ "system.resistances.fireDamage.value": 10 });
					assert.equal(actor.system.resistances.fireDamage.value, 10);
				});
			});

			describe("ThreatData — traits", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test Threat Traits",
						type: "threat",
						system: {
							traits: { smell: true, darkvision: true },
						},
					});
				});

				after(async () => {
					await actor?.delete();
				});

				it("smell trait persists as true", () => {
					assert.isTrue(actor.system.traits.smell);
				});

				it("darkvision trait persists as true", () => {
					assert.isTrue(actor.system.traits.darkvision);
				});

				it("unset traits default to false", () => {
					assert.isFalse(actor.system.traits.incorporeal);
				});
			});
		},
		{ displayName: "OP | Threat Actor: prepareDerivedData" }
	);
});
