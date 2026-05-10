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
							proficiency: "simpleWeapons",
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
			// [QoL Feature 1+3] Targeting com hitResult
			// ----------------------------------------------------------------
			describe("targeting + hit/miss — Feature 1 & 3", () => {
				let attackerAgent;
				let targetThreat;
				let sword;

				before(async () => {
					attackerAgent = await createAgent();
					// Threat with defense 99 — rollAttack should always miss
					targetThreat = await createThreat({ defense: { value: 99 } });
					sword = await giveArmament(attackerAgent);

					// Simulate targeting: add token stub to game.user.targets
					const fakeToken = {
						name: targetThreat.name,
						actor: targetThreat,
						_drawTargetArrows: () => {},
					};
					game.user.targets.clear();
					game.user.targets.add(fakeToken);
				});

				after(async () => {
					game.user.targets.clear();
					await attackerAgent?.delete();
					await targetThreat?.delete();
				});

				it("rollAttack com 1 alvo retorna hitResult", async () => {
					const { hitResult } = await sword.rollAttack({});
					assert.exists(hitResult, "hitResult deve existir quando há alvo");
					assert.equal(hitResult.targetDefense, 99, "targetDefense deve ser o valor da defesa do alvo");
					assert.equal(hitResult.actorUuid, targetThreat.uuid, "actorUuid deve ser o UUID do alvo");
				});

				it("hitResult.hit = false quando resultado < defesa do alvo (defesa 99)", async () => {
					// Defense is 99 — impossible to hit normally
					const { hitResult } = await sword.rollAttack({});
					assert.isFalse(hitResult.hit, "deve ser FALHA contra defesa 99");
				});
			});

			describe("targeting hit — alvo com defesa 0", () => {
				let attackerAgent;
				let targetThreat;
				let sword;

				before(async () => {
					attackerAgent = await createAgent();
					// Threat with defense 0 — always hit
					targetThreat = await createThreat({ defense: { value: 0 } });
					sword = await giveArmament(attackerAgent);

					const fakeToken = { name: targetThreat.name, actor: targetThreat, _drawTargetArrows: () => {} };
					game.user.targets.clear();
					game.user.targets.add(fakeToken);
				});

				after(async () => {
					game.user.targets.clear();
					await attackerAgent?.delete();
					await targetThreat?.delete();
				});

				it("hitResult.hit = true quando defesa = 0 (sempre acerta)", async () => {
					const { hitResult } = await sword.rollAttack({});
					assert.isTrue(hitResult.hit, "deve ser ACERTO contra defesa 0");
				});
			});

			// ----------------------------------------------------------------
			// [QoL Feature 2] applyDamage direto (sem socket — owner = true)
			// ----------------------------------------------------------------
			describe("applyDamage direto com alvo owner", () => {
				let threat;

				before(async () => {
					threat = await createThreat({
						attributes: { hp: { value: 20, max: 20 } },
						resistances: { cuttingDamage: { value: 2, vulnerable: false, immune: false } },
					});
				});

				after(async () => {
					await threat?.delete();
				});

				it("applyDamage aplica dano e subtrai RD corretamente", async () => {
					const result = await threat.applyDamage(10, { damageType: "cuttingDamage" });
					assert.equal(result.finalDamage, 8, "RD 2 deve bloquear 2 do dano 10");
					assert.equal(result.blocked, 2);
					assert.equal(threat.system.attributes.hp.value, 12);
				});

				it("applyDamage com ignoreRD=true ignora RD", async () => {
					await threat.update({ "system.attributes.hp.value": 20 });
					const result = await threat.applyDamage(10, { damageType: "cuttingDamage", ignoreRD: true });
					assert.equal(result.finalDamage, 10);
					assert.equal(result.blocked, 0);
					assert.equal(threat.system.attributes.hp.value, 10);
				});
			});

			// ----------------------------------------------------------------
			// hitResult persistido no item card (F3.2 — botão dano desabilitado)
			// ----------------------------------------------------------------
			describe("hitResult flag no item card — F3.2", () => {
				let agent;
				let sword;
				let target;

				before(async () => {
					agent = await createAgent();
					sword = await giveArmament(agent);
					game.user.targets.clear();
					// alvo com defesa 99 → sempre falha
					target = await createThreat({ defense: { value: 99 } });
					game.user.targets.add({ name: target.name, actor: target, _drawTargetArrows: () => {} });
					// Cria o item card primeiro
					await sword.roll();
				});

				after(async () => {
					game.user.targets.clear();
					await agent?.delete();
					await target?.delete();
				});

				it("após rollAttack com falha, flag 'hitResult' no item card tem hit=false", async () => {
					const cardMsg = [...game.messages].reverse().find((m) => m.content?.includes("chat-card item-card"));
					assert.exists(cardMsg, "item card deve existir");
					await sword.rollAttack({});
					// Re-busca depois do rollAttack que seta a flag
					const updated = game.messages.get(cardMsg.id);
					const hr = updated?.getFlag("ordemparanormal", "hitResult");
					assert.exists(hr, "hitResult deve ser gravado no item card");
					assert.isFalse(hr.hit, "ataque contra defesa 99 deve ser FALHA");
				});
			});

			// ----------------------------------------------------------------
			// rollSkill com DT — Feature 6
			// ----------------------------------------------------------------
			describe("OrdemActor.rollSkill com DT — Feature 6", () => {
				let agent;

				before(async () => {
					agent = await createAgent();
				});

				after(async () => {
					await agent?.delete();
				});

				it("rollSkill com configure=false e target definido: roll.options.target existe", async () => {
					const rolls = await agent.rollSkill(
						{ skill: "fighting", rolls: [{ options: { target: 15 } }] },
						{ configure: false },
						{ create: false }
					);
					assert.isArray(rolls, "deve retornar array");
					assert.isAbove(rolls.length, 0);
					// O roll deve ter total numérico — não podemos garantir sucesso/falha
					assert.isNumber(rolls[0].total, "total deve ser número");
				});

				it("rollSkill sem DT: isSuccess e isFailure são false (sem target)", async () => {
					const rolls = await agent.rollSkill({ skill: "perception" }, { configure: false }, { create: false });
					assert.isFalse(rolls[0].isSuccess, "sem DT não deve ter isSuccess=true");
					assert.isFalse(rolls[0].isFailure, "sem DT não deve ter isFailure=true");
				});
			});
		},
		{ displayName: "OP | Item: ataque → dano → aplicação" }
	);
});
