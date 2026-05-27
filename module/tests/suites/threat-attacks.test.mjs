import { installBatchGuards } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.threat.attacks",
		(context) => {
			const { describe, it, assert, before, after } = context;
			installBatchGuards(context, { prefix: "[Quench]" });

			async function createThreat(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Threat Attack Test",
					type: "threat",
					system: {
						attributes: {
							hp: { value: 50, max: 50 },
							dex: { value: 3 },
							str: { value: 4 },
							int: { value: 1 },
							pre: { value: 2 },
							vit: { value: 3 },
						},
						skills: {
							fighting: { degree: { label: "trained", value: 5 }, value: 0, attr: ["str"] },
							aim: { degree: { label: "trained", value: 5 }, value: 0, attr: ["dex"] },
						},
						defense: { value: 15 },
						...systemOverrides,
					},
				});
			}

			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Agent Target",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 2 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 2 }, int: { value: 1 } },
						NEX: { value: 5 },
						defense: { value: 12, bonus: 0, dodge: 0 },
						...systemOverrides,
					},
				});
			}

			// ----------------------------------------------------------------
			// Schema: novos campos do armamento
			// ----------------------------------------------------------------
			describe("ArmamentData — campos de ameaça (actionType, numberOfAttacks)", () => {
				let threat;
				let item;

				before(async () => {
					threat = await createThreat();
					[item] = await threat.createEmbeddedDocuments("Item", [
						{
							name: "Mordida",
							type: "armament",
							system: {
								formulas: {
									attack: { attr: "str", skill: "fighting", bonus: 10 },
									damage: { formula: "2d10+10", attr: "", type: "piercingDamage", bonus: 0, parts: [] },
								},
								critical: "20",
								actionType: "standard",
								numberOfAttacks: 2,
								rangeCategory: "",
								types: { rangeType: { name: "melee" } },
								using: { state: true },
								quantity: 1,
								weight: 0,
							},
						},
					]);
				});

				after(async () => {
					await threat?.delete();
				});

				it("item.system.actionType persiste como 'standard'", () => {
					assert.equal(item.system.actionType, "standard");
				});

				it("item.system.numberOfAttacks persiste como 2", () => {
					assert.equal(item.system.numberOfAttacks, 2);
				});

				it("item.system.rangeCategory persiste como string vazia (corpo a corpo)", () => {
					assert.equal(item.system.rangeCategory, "");
				});
			});

			// ----------------------------------------------------------------
			// rollAttack com alvo agente — targeting bidirecional
			// ----------------------------------------------------------------
			describe("Threat rollAttack → alvo agente (targeting bidirecional)", () => {
				let threat;
				let agent;
				let sword;

				before(async () => {
					threat = await createThreat();
					agent = await createAgent();
					[sword] = await threat.createEmbeddedDocuments("Item", [
						{
							name: "Garras",
							type: "armament",
							system: {
								formulas: {
									attack: { attr: "str", skill: "fighting", bonus: 20 },
									damage: { formula: "2d8+10", attr: "", type: "cuttingDamage", bonus: 0, parts: [] },
								},
								critical: "20",
								actionType: "standard",
								numberOfAttacks: 1,
								rangeCategory: "",
								types: { rangeType: { name: "melee" } },
								using: { state: true },
								quantity: 1,
								weight: 0,
							},
						},
					]);

					// Simula targeting do agente
					const fakeToken = { name: agent.name, actor: agent, _drawTargetArrows: () => {} };
					game.user.targets.clear();
					game.user.targets.add(fakeToken);
				});

				after(async () => {
					game.user.targets.clear();
					await threat?.delete();
					await agent?.delete();
				});

				it("rollAttack retorna hitResult com actorUuid do agente alvo", async () => {
					const { hitResult } = await sword.rollAttack({});
					assert.exists(hitResult, "hitResult deve existir com targeting ativo");
					assert.equal(hitResult.actorUuid, agent.uuid, "actorUuid deve ser o UUID do agente");
				});

				it("hitResult.targetDefense reflete a defesa do agente", async () => {
					const { hitResult } = await sword.rollAttack({});
					assert.isNumber(hitResult.targetDefense);
				});
			});

			// ----------------------------------------------------------------
			// applyDamage no agente (não na ameaça) — verifica path PV
			// ----------------------------------------------------------------
			describe("applyDamage em agente (verifica system.PV.value)", () => {
				let agent;

				before(async () => {
					agent = await createAgent();
				});

				after(async () => {
					await agent?.delete();
				});

				it("applyDamage reduz system.PV.value do agente", async () => {
					const pvBefore = agent.system.PV.value;
					await agent.applyDamage(5, { damageType: "cuttingDamage" });
					assert.isBelow(agent.system.PV.value, pvBefore);
				});
			});
		},
		{ displayName: "OP | Threat: ataques nativos, targeting bidirecional, applyDamage" }
	);
});
