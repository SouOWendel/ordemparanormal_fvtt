/**
 * Quench integration tests for the attack → damage → apply flow.
 *
 * Tests marked with [STUB] run now and verify baseline (no targeting).
 * Tests marked with [QoL Feature N] are filled in when the corresponding
 * feature from PRD-QoL-Combat.md is implemented.
 */
Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.item.attackFlow",
		(context) => {
			const { describe, it, assert, before, after } = context;

			// ----------------------------------------------------------------
			// Helpers
			// ----------------------------------------------------------------
			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Attack Flow Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 3 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 3 }, int: { value: 1 } },
						NEX: { value: 5 },
						defense: { value: 12, bonus: 0, dodge: 0 },
						...systemOverrides,
					},
				});
			}

			async function createThreat(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Attack Flow Threat",
					type: "threat",
					system: {
						attributes: { hp: { value: 20, max: 20 } },
						defense: { value: 10 },
						resistances: {
							cuttingDamage: { value: 0, vulnerable: false, immune: false },
							ballisticDamage: { value: 0, vulnerable: false, immune: false },
						},
						...systemOverrides,
					},
				});
			}

			async function giveArmament(actor) {
				const [item] = await actor.createEmbeddedDocuments("Item", [
					{
						name: "[Quench] Test Sword",
						type: "armament",
						system: {
							proficiency: "simple",
							rangeType: "melee",
							formulas: {
								attack: { attr: "str", skill: "fighting", bonus: 0 },
								damage: { formula: "1d8", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
							},
							critical: "20",
							weight: 1,
							quantity: 1,
							using: { state: true },
						},
					},
				]);
				return item;
			}

			// ----------------------------------------------------------------
			// [STUB] Baseline: rollAttack sem alvo não modifica PV
			// ----------------------------------------------------------------
			describe("rollAttack — sem alvo (baseline)", () => {
				let agent;
				let threat;
				let sword;

				before(async () => {
					agent = await createAgent();
					threat = await createThreat();
					sword = await giveArmament(agent);
					// Garante que não há alvos selecionados
					game.user.targets.clear();
				});

				after(async () => {
					await agent?.delete();
					await threat?.delete();
				});

				it("rollAttack não lança exceção quando não há alvo", async () => {
					// Should complete without error
					const result = await sword.rollAttack({});
					assert.exists(result, "rollAttack deve retornar um resultado");
				});

				it("PV da ameaça permanece inalterado após rollAttack sem alvo", async () => {
					const pvBefore = threat.system.attributes.hp.value;
					await sword.rollAttack({});
					assert.equal(threat.system.attributes.hp.value, pvBefore, "PV não deve mudar sem alvo");
				});

				it("rollAttack produz uma mensagem no chat", async () => {
					const countBefore = game.messages.size;
					await sword.rollAttack({});
					assert.isAbove(game.messages.size, countBefore, "Deve haver uma nova mensagem no chat");
				});
			});

			// ----------------------------------------------------------------
			// [STUB] applyDamage — integração com ator real no Foundry
			// ----------------------------------------------------------------
			describe("OrdemActor.applyDamage — integração Foundry", () => {
				let threat;

				before(async () => {
					threat = await createThreat({ attributes: { hp: { value: 20, max: 20 } } });
				});

				after(async () => {
					await threat?.delete();
				});

				it("applyDamage reduz hp da ameaça corretamente", async () => {
					await threat.applyDamage(8, { damageType: "cuttingDamage" });
					assert.equal(threat.system.attributes.hp.value, 12, "HP deve reduzir para 12");
				});

				it("applyDamage com RD subtrai corretamente", async () => {
					const threatWithRD = await createThreat({
						attributes: { hp: { value: 20, max: 20 } },
						resistances: { cuttingDamage: { value: 3, vulnerable: false, immune: false } },
					});
					await threatWithRD.applyDamage(10, { damageType: "cuttingDamage" });
					assert.equal(threatWithRD.system.attributes.hp.value, 13, "RD 3 deve bloquear 3 do dano 10 → HP 13");
					await threatWithRD.delete();
				});
			});

			// ----------------------------------------------------------------
			// [QoL Feature 1] Targeting — preencher quando Feature 1 existir
			// ----------------------------------------------------------------
			describe.skip("targeting — Feature 1 (não implementada)", () => {
				it("game.user.targets com 1 token: rollAttack usa esse token como alvo", () => {
					assert.fail("Implementar quando Feature 1 (targeting) estiver pronta");
				});

				it("hitResult incluído na chat message quando há alvo", () => {
					assert.fail("Implementar quando Feature 1 (targeting) estiver pronta");
				});
			});

			// ----------------------------------------------------------------
			// [QoL Feature 3] Resolução automática acerto/falha
			// ----------------------------------------------------------------
			describe.skip("resultado de ataque vs defesa — Feature 3 (não implementada)", () => {
				it("result >= defesa do alvo: hitResult.hit = true na chat message", () => {
					assert.fail("Implementar quando Feature 3 estiver pronta");
				});

				it("result < defesa do alvo: hitResult.hit = false na chat message", () => {
					assert.fail("Implementar quando Feature 3 estiver pronta");
				});
			});

			// ----------------------------------------------------------------
			// [QoL Feature 2] Aplicação automática de dano
			// ----------------------------------------------------------------
			describe.skip("aplicação automática de dano — Feature 2 (não implementada)", () => {
				it("após acerto com alvo: PV do alvo reduz automaticamente sem clique manual", () => {
					assert.fail("Implementar quando Feature 2 estiver pronta");
				});

				it("RD do alvo é aplicada antes de subtrair do PV", () => {
					assert.fail("Implementar quando Feature 2 estiver pronta");
				});

				it("token bar do alvo atualiza após aplicação", () => {
					assert.fail("Implementar quando Feature 2 estiver pronta");
				});
			});
		},
		{ displayName: "OP | Item: ataque → dano → aplicação" }
	);
});
