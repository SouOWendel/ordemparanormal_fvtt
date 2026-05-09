Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.agent",
		(context) => {
			const { describe, it, assert, before, after } = context;

			// ----------------------------------------------------------------
			// Helpers
			// ----------------------------------------------------------------
			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Test Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 3 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 2 }, int: { value: 1 } },
						NEX: { value: 5 },
						nivel: { value: 1 },
						stage: { value: 1 },
						...systemOverrides,
					},
				});
			}

			// ----------------------------------------------------------------
			// Fighter class — progress=1 (NEX=5)
			// ----------------------------------------------------------------
			describe("fighter — NEX progress rule (progress=1)", () => {
				let actor;
				before(async () => {
					actor = await createAgent({ class: "fighter", NEX: { value: 5 } });
				});
				after(async () => {
					await actor?.delete();
				});

				it("PV.max = 20 + VIG(3) = 23", () => {
					assert.equal(actor.system.PV.max, 23);
				});
				it("PE.max = 2 + PRE(2) = 4", () => {
					assert.equal(actor.system.PE.max, 4);
				});
				it("SAN.max = 12", () => {
					assert.equal(actor.system.SAN.max, 12);
				});
				it("PE.perRound = 1 (progress=1)", () => {
					assert.equal(actor.system.PE.perRound, 1);
				});
			});

			// ----------------------------------------------------------------
			// Fighter class — progress=2 (NEX=10)
			// ----------------------------------------------------------------
			describe("fighter — NEX progress rule (progress=2)", () => {
				let actor;
				before(async () => {
					actor = await createAgent({ class: "fighter", NEX: { value: 10 } });
				});
				after(async () => {
					await actor?.delete();
				});

				it("PV.max = 20+3+(4+3) = 30", () => {
					assert.equal(actor.system.PV.max, 30);
				});
				it("PE.max = 2+2+(2+2) = 8", () => {
					assert.equal(actor.system.PE.max, 8);
				});
				it("SAN.max = 12+3 = 15", () => {
					assert.equal(actor.system.SAN.max, 15);
				});
				it("PE.perRound = 2", () => {
					assert.equal(actor.system.PE.perRound, 2);
				});
			});

			// ----------------------------------------------------------------
			// Specialist class
			// ----------------------------------------------------------------
			describe("specialist — NEX progress rule (progress=1)", () => {
				let actor;
				before(async () => {
					actor = await createAgent({ class: "specialist", NEX: { value: 5 } });
				});
				after(async () => {
					await actor?.delete();
				});

				it("PV.max = 16 + VIG(3) = 19", () => {
					assert.equal(actor.system.PV.max, 19);
				});
				it("PE.max = 3 + PRE(2) = 5", () => {
					assert.equal(actor.system.PE.max, 5);
				});
				it("SAN.max = 16", () => {
					assert.equal(actor.system.SAN.max, 16);
				});
			});

			// ----------------------------------------------------------------
			// Occultist class
			// ----------------------------------------------------------------
			describe("occultist — NEX progress rule (progress=1)", () => {
				let actor;
				before(async () => {
					actor = await createAgent({ class: "occultist", NEX: { value: 5 } });
				});
				after(async () => {
					await actor?.delete();
				});

				it("PV.max = 12 + VIG(3) = 15", () => {
					assert.equal(actor.system.PV.max, 15);
				});
				it("PE.max = 4 + PRE(2) = 6", () => {
					assert.equal(actor.system.PE.max, 6);
				});
				it("SAN.max = 20", () => {
					assert.equal(actor.system.SAN.max, 20);
				});
			});

			// ----------------------------------------------------------------
			// Survivor class (progress = stage.value)
			// ----------------------------------------------------------------
			describe("survivor — stage progress rule", () => {
				let actorS1;
				let actorS2;
				before(async () => {
					actorS1 = await createAgent({ class: "survivor", stage: { value: 1 } });
					actorS2 = await createAgent({ class: "survivor", stage: { value: 2 } });
				});
				after(async () => {
					await actorS1?.delete();
					await actorS2?.delete();
				});

				it("stage=1 (progress=1): PV.max = 8 + VIG(3) = 11", () => {
					assert.equal(actorS1.system.PV.max, 11);
				});
				it("stage=1 (progress=1): PE.max = 2 + PRE(2) = 4", () => {
					assert.equal(actorS1.system.PE.max, 4);
				});
				it("stage=1: PE.perRound = 1 (always 1 for survivor)", () => {
					assert.equal(actorS1.system.PE.perRound, 1);
				});
				it("stage=1: PD.perRound = 1 (always 1 for survivor)", () => {
					assert.equal(actorS1.system.PD.perRound, 1);
				});
				it("stage=2 (progress=2): PV.max = 8+3+2 = 13", () => {
					assert.equal(actorS2.system.PV.max, 13);
				});
				it("stage=2: SAN.max = 8+2 = 10", () => {
					assert.equal(actorS2.system.SAN.max, 10);
				});
				it("stage=2: PE.perRound = 1 (always 1 for survivor)", () => {
					assert.equal(actorS2.system.PE.perRound, 1);
				});
				it("stage=2: PD.perRound = 1 (always 1 for survivor)", () => {
					assert.equal(actorS2.system.PD.perRound, 1);
				});
			});

			// ----------------------------------------------------------------
			// withoutSanity rule — PD.max instead of PE.max
			// ----------------------------------------------------------------
			describe("withoutSanity rule — PD.max replaces PE.max", () => {
				let actor;
				before(async () => {
					// Enable withoutSanity globally for this describe block
					await game.settings.set("ordemparanormal", "globalPlayingWithoutSanity", true);
					actor = await createAgent({ class: "fighter", NEX: { value: 5 } });
				});
				after(async () => {
					await game.settings.set("ordemparanormal", "globalPlayingWithoutSanity", false);
					await actor?.delete();
				});

				it("fighter withoutSanity progress=1: PD.max = 6 + PRE(2) = 8", () => {
					assert.equal(actor.system.PD.max, 8);
				});
				it("fighter withoutSanity progress=1: PD.perRound = 1", () => {
					assert.equal(actor.system.PD.perRound, 1);
				});
				it("PE.max is NOT set when withoutSanity (PD.max is used)", () => {
					// PE.max should be schema initial (5), not the computed PE formula
					assert.equal(actor.system.PE.max, 5);
				});
			});

			// ----------------------------------------------------------------
			// Nivel progression rule (rule=2)
			// ----------------------------------------------------------------
			describe("nivel progression rule (globalProgressRules=2)", () => {
				let actor;
				before(async () => {
					await game.settings.set("ordemparanormal", "globalProgressRules", 2);
					actor = await createAgent({ class: "fighter", nivel: { value: 3 }, NEX: { value: 5 } });
				});
				after(async () => {
					await game.settings.set("ordemparanormal", "globalProgressRules", 1);
					await actor?.delete();
				});

				it("nivel=3 rule=2 (progress=3): PV.max = 20+3+2×(4+3) = 37", () => {
					assert.equal(actor.system.PV.max, 37);
				});
				it("PE.perRound = 3 (progress=3)", () => {
					assert.equal(actor.system.PE.perRound, 3);
				});
			});

			// ----------------------------------------------------------------
			// Defense with armor (protection item equipped)
			// ----------------------------------------------------------------
			describe("defense — protection item adds to defense.value before dodge", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						attributes: { dex: { value: 2 }, vit: { value: 1 }, pre: { value: 1 }, str: { value: 5 }, int: { value: 1 } },
						defense: { value: 10, bonus: 0, dodge: 0 },
					});
					// Add an equipped protection item with defense=3
					await actor.createEmbeddedDocuments("Item", [
						{
							name: "[Quench] Test Armor",
							type: "protection",
							system: { defense: 3, quantity: 1, using: { state: true } },
						},
					]);
				});
				after(async () => {
					await actor?.delete();
				});

				it("defense.value = base(10) + armor(3) + AGI(2) = 15", () => {
					assert.equal(actor.system.defense.value, 15);
				});
				it("defense.dodge = defense.value(15) + reflexes(0) = 15", () => {
					assert.equal(actor.system.defense.dodge, 15);
				});
			});

			// ----------------------------------------------------------------
			// Overweight penalty
			// ----------------------------------------------------------------
			describe("overweight — desloc and defense penalties", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						attributes: { str: { value: 1 }, dex: { value: 2 }, vit: { value: 1 }, pre: { value: 1 }, int: { value: 1 } },
						// str=1 → max spaces = 5; add heavy item (weight=10) to trigger overweight
					});
					// Add an item heavier than str×5 = 5 spaces
					await actor.createEmbeddedDocuments("Item", [
						{
							name: "[Quench] Heavy Item",
							type: "armament",
							system: { weight: 10, quantity: 1, using: { state: true } },
						},
					]);
				});
				after(async () => {
					await actor?.delete();
				});

				it("desloc.value reduced by 3 when overweight", () => {
					// default desloc=9, overweight penalty -3 → 6
					assert.equal(actor.system.desloc.value, 6);
				});
				it("defense.value reduced by 5 when overweight (before AGI)", () => {
					// base defense=10 -5 overweight + AGI(2) = 7
					assert.equal(actor.system.defense.value, 7);
				});
			});

			// ----------------------------------------------------------------
			// Ritual DT — survivor vs non-survivor
			// ----------------------------------------------------------------
			describe("ritual.DT — branches", () => {
				let actorNormal;
				let actorSurvivor;
				before(async () => {
					actorNormal = await createAgent({
						class: "occultist",
						NEX: { value: 10 },
						attributes: { pre: { value: 2 }, vit: { value: 1 }, dex: { value: 1 }, str: { value: 1 }, int: { value: 1 } },
					});
					actorSurvivor = await createAgent({
						class: "survivor",
						NEX: { value: 10 },
						attributes: { pre: { value: 3 }, vit: { value: 1 }, dex: { value: 1 }, str: { value: 1 }, int: { value: 1 } },
					});
				});
				after(async () => {
					await actorNormal?.delete();
					await actorSurvivor?.delete();
				});

				it("non-survivor NEX=10 PRE=2: DT = 10 + 2 + 2 = 14", () => {
					assert.equal(actorNormal.system.ritual.DT, 14);
				});
				it("survivor any-NEX PRE=3: DT = 10 + 3 = 13", () => {
					assert.equal(actorSurvivor.system.ritual.DT, 13);
				});
			});

			// ----------------------------------------------------------------
			// Patent — all 6 tiers
			// ----------------------------------------------------------------
			describe("patent — all tiers", () => {
				const cases = [
					{ pp: -1, name: "Sem Patente", limit1: null },
					{ pp: 0, name: "Recruta", limit1: 2 },
					{ pp: 30, name: "Operador", limit1: 3, limit2: 1 },
					{ pp: 60, name: "Agente Especial", limit1: 3, limit2: 2, limit3: 1 },
					{ pp: 110, name: "Oficial de Operações", limit1: 3, limit2: 3, limit3: 2, limit4: 1 },
					{ pp: 210, name: "Agente de Elite", limit1: 3, limit2: 3, limit3: 3, limit4: 2 },
				];

				for (const { pp, name, limit1, limit2, limit3, limit4 } of cases) {
					it(`prestigePoints=${pp} → name="${name}"`, async () => {
						const actor = await Actor.create({
							name: `[Quench] Patent pp=${pp}`,
							type: "agent",
							system: { patent: { prestigePoints: pp } },
						});
						assert.equal(actor.system.patent.name, name);
						if (limit1 !== undefined) assert.equal(actor.system.patent.itemLimit1, limit1);
						if (limit2 !== undefined) assert.equal(actor.system.patent.itemLimit2, limit2);
						if (limit3 !== undefined) assert.equal(actor.system.patent.itemLimit3, limit3);
						if (limit4 !== undefined) assert.equal(actor.system.patent.itemLimit4, limit4);
						await actor.delete();
					});
				}
			});

			// ----------------------------------------------------------------
			// Edge cases
			// ----------------------------------------------------------------
			describe("edge cases", () => {
				it("empty class: no crash, PV.max is a number", async () => {
					const actor = await Actor.create({ name: "[Quench] No Class", type: "agent", system: { class: "" } });
					assert.isNumber(actor.system.PV.max);
					await actor.delete();
				});

				it("NEX=99 → progress = 20 (cap)", async () => {
					const actor = await Actor.create({
						name: "[Quench] Max NEX",
						type: "agent",
						system: {
							class: "fighter",
							attributes: { vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, str: { value: 1 }, int: { value: 1 } },
							NEX: { value: 99 },
						},
					});
					// progress=20: PV = 20+1 + 19*(4+1) = 21 + 95 = 116
					assert.equal(actor.system.PV.max, 116);
					await actor.delete();
				});
			});
		},
		{ displayName: "OP | Agent Actor: prepareDerivedData" }
	);
});
