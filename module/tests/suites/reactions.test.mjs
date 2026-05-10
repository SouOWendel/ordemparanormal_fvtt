/**
 * Quench integration tests for the defender reaction system (Esquiva, Bloqueio,
 * Contra-ataque).
 *
 * These exercise the full Foundry pipeline (Actor.create, Item.rollAttack, flag
 * mutations, socket dispatch) — things the Node-only unit tests can't cover.
 */
Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.reactions",
		(context) => {
			const { describe, it, assert, before, after } = context;

			// ------------------------------------------------------------
			// Helpers
			// ------------------------------------------------------------
			async function createAgent({ trained = {}, systemOverrides = {} } = {}) {
				const skill = (trainedKey) => ({
					degree: { label: trained[trainedKey] ? "trained" : "untrained", value: trained[trainedKey] ? 5 : 0 },
					value: 0,
					mod: 0,
					attr: [],
				});
				return Actor.create({
					name: "[Quench] Reaction Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: {
							vit: { value: 2 },
							pre: { value: 2 },
							dex: { value: 3 },
							str: { value: 3 },
							int: { value: 1 },
						},
						NEX: { value: 5 },
						defense: { value: 12, bonus: 0, dodge: 0 },
						skills: {
							reflexes: skill("reflexes"),
							resilience: skill("resilience"),
							fighting: skill("fighting"),
						},
						resistances: {
							cuttingDamage: { value: 2, vulnerable: false, immune: false },
						},
						...systemOverrides,
					},
				});
			}

			async function createThreat() {
				return Actor.create({
					name: "[Quench] Reaction Threat",
					type: "threat",
					system: {
						attributes: {
							hp: { value: 30, max: 30 },
							dex: { value: 2 },
							str: { value: 4 },
							vit: { value: 3 },
							pre: { value: 1 },
							int: { value: 1 },
						},
						skills: {
							fighting: { degree: { label: "trained", value: 5 }, value: 0, attr: ["str"] },
						},
						defense: { value: 14 },
					},
				});
			}

			async function giveMelee(actor, name = "[Quench] Sword") {
				const [item] = await actor.createEmbeddedDocuments("Item", [
					{
						name,
						type: "armament",
						system: {
							formulas: {
								attack: { attr: "str", skill: "fighting", bonus: 0 },
								damage: { formula: "1d6", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
							},
							critical: "20",
							types: { rangeType: { name: "melee" } },
							using: { state: true },
							quantity: 1,
							weight: 1,
						},
					},
				]);
				return item;
			}

			async function deleteAttackMessages() {
				const toDelete = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "reactionPending"));
				for (const m of toDelete) await m.delete();
			}

			function targetTokenFor(actor) {
				// Quench runs without a scene by default — fabricate a minimal token-like
				// object that the rollAttack code can read .actor from.
				return { name: actor.name, actor };
			}

			/**
			 * Create an active Combat with the given actors as combatants and start it
			 * so `game.combat.round === 1`. Required for tests that depend on the
			 * one-reaction-per-round tracker — when round is 0 (no combat) the tracker
			 * is intentionally a no-op (reactionUsedRound has no meaning out of combat).
			 *
			 * @param {Actor[]} actors
			 * @returns {Promise<Combat>}
			 */
			async function startCombatWith(actors) {
				const combat = await Combat.create({});
				await combat.createEmbeddedDocuments(
					"Combatant",
					actors.map((a) => ({ actorId: a.id, initiative: 1 }))
				);
				await combat.activate();
				await combat.startCombat();
				return combat;
			}

			// ------------------------------------------------------------
			// applyDamage extraRD — Bloqueio behavior
			// Agents do not have an intrinsic `resistances` schema field (only Threats
			// do), so for the agent path extraRD acts as the sole damage reduction.
			// We also cover the threat path to verify base RD + extraRD stacking.
			// ------------------------------------------------------------
			describe("applyDamage — extraRD do Bloqueio", () => {
				let agent;
				let threat;

				before(async () => {
					// Agents default to PV.value=5/PV.max=10 — bump to 30 so we can
					// exercise the math without bumping into the floor=0 clamp.
					agent = await createAgent({ systemOverrides: { PV: { value: 30, max: 30 } } });
					threat = await createThreat();
				});

				after(async () => {
					await agent?.delete();
					await threat?.delete();
				});

				it("agente: extraRD reduz dano (sem RD intrínseca no schema)", async () => {
					const pvBefore = agent.system.PV.value;
					const result = await agent.applyDamage(10, { damageType: "cuttingDamage", extraRD: 3 });
					assert.equal(result.blocked, 3, "blocked = 3 (apenas extraRD, agente sem RD intrínseca)");
					assert.equal(result.finalDamage, 7, "finalDamage = 10 - 3");
					assert.equal(agent.system.PV.value, pvBefore - 7);
				});

				it("threat: extraRD soma à RD intrínseca", async () => {
					// Threat schema includes resistances; cuttingDamage default is 0, so set it.
					await threat.update({ "system.resistances.cuttingDamage.value": 2 });
					const hpBefore = threat.system.attributes.hp.value;
					const result = await threat.applyDamage(10, { damageType: "cuttingDamage", extraRD: 3 });
					assert.equal(result.blocked, 5, "blocked = 2 (RD) + 3 (extraRD)");
					assert.equal(result.finalDamage, 5);
					assert.equal(threat.system.attributes.hp.value, hpBefore - 5);
				});

				it("extraRD nunca produz dano negativo", async () => {
					const pvBefore = agent.system.PV.value;
					const result = await agent.applyDamage(2, { damageType: "cuttingDamage", extraRD: 999 });
					assert.equal(result.finalDamage, 0);
					assert.equal(agent.system.PV.value, pvBefore);
				});
			});

			// ------------------------------------------------------------
			// rollAttack — reactionPending flag
			// ------------------------------------------------------------
			describe("rollAttack — flag reactionPending", () => {
				let attacker;
				let agentDefender;
				let threatDefender;
				let sword;

				before(async () => {
					attacker = await createThreat();
					agentDefender = await createAgent({ trained: { reflexes: true, resilience: true, fighting: true } });
					threatDefender = await createThreat();
					sword = await giveMelee(attacker, "[Quench] Threat Sword");
				});

				after(async () => {
					await deleteAttackMessages();
					await attacker?.delete();
					await agentDefender?.delete();
					await threatDefender?.delete();
				});

				it("cria reactionPending quando alvo é Agente treinado", async () => {
					const original = game.user.targets;
					game.user.targets = new Set([targetTokenFor(agentDefender)]);
					try {
						await sword.rollAttack({});
					} finally {
						game.user.targets = original;
					}
					const msg = [...game.messages].reverse().find((m) => m.getFlag("ordemparanormal", "reactionPending"));
					assert.exists(msg, "Attack message com reactionPending deve existir");
					const pending = msg.getFlag("ordemparanormal", "reactionPending");
					assert.equal(pending.defenderUuid, agentDefender.uuid);
					assert.equal(pending.attackerUuid, attacker.uuid);
					assert.exists(pending.itemUuid);
					assert.isTrue(pending.isMelee);
					// hitResult should NOT yet be revealed
					const hit = msg.getFlag("ordemparanormal", "hitResult");
					assert.exists(hit);
					assert.isFalse(hit.revealed, "revealed=false até reagir");
					assert.equal(hit.baseDefense, hit.targetDefense, "baseDefense = targetDefense pré-reação");
				});

				it("NÃO cria reactionPending quando alvo é Threat", async () => {
					await deleteAttackMessages();
					const original = game.user.targets;
					game.user.targets = new Set([targetTokenFor(threatDefender)]);
					try {
						await sword.rollAttack({});
					} finally {
						game.user.targets = original;
					}
					const msg = [...game.messages].reverse().find((m) => m.getFlag("ordemparanormal", "reactionPending"));
					assert.notExists(msg, "Threat alvo: nenhum reactionPending");
				});

				it("NÃO cria reactionPending quando defender é o próprio atacante (auto-target)", async () => {
					await deleteAttackMessages();
					const agentSword = await giveMelee(agentDefender, "[Quench] Self Sword");
					const original = game.user.targets;
					game.user.targets = new Set([targetTokenFor(agentDefender)]);
					try {
						await agentSword.rollAttack({});
					} finally {
						game.user.targets = original;
					}
					const msg = [...game.messages].reverse().find((m) => m.getFlag("ordemparanormal", "reactionPending"));
					assert.notExists(msg, "Auto-target: nenhum reactionPending");
					await agentSword.delete();
				});

				it("NÃO cria reactionPending quando defender já usou reação nesta rodada", async () => {
					// Round-tracking is intentionally a no-op outside combat — start one
					// so the reactionUsedRound flag actually matches a real round number.
					const combat = await startCombatWith([attacker, agentDefender]);
					try {
						await deleteAttackMessages();
						await agentDefender.setFlag("ordemparanormal", "reactionUsedRound", game.combat.round);
						const original = game.user.targets;
						game.user.targets = new Set([targetTokenFor(agentDefender)]);
						try {
							await sword.rollAttack({});
						} finally {
							game.user.targets = original;
						}
						const msg = [...game.messages].reverse().find((m) => m.getFlag("ordemparanormal", "reactionPending"));
						assert.notExists(msg, "Reação já usada: nenhum reactionPending");
					} finally {
						await agentDefender.unsetFlag("ordemparanormal", "reactionUsedRound");
						await combat.delete();
					}
				});
			});

			// ------------------------------------------------------------
			// handleReaction — dodge / block / skip / counter-attack
			// ------------------------------------------------------------
			describe("handleReaction — fluxo via socket handler", () => {
				let attacker;
				let defender;
				let sword;
				let handleReaction;

				before(async () => {
					// Lazy-import to avoid loading the helper before the system is ready
					handleReaction = (await import("/systems/ordemparanormal/module/helpers/reactions.mjs")).handleReaction;
					attacker = await createThreat();
					defender = await createAgent({ trained: { reflexes: true, resilience: true, fighting: true } });
					sword = await giveMelee(attacker, "[Quench] Reaction Sword");
				});

				after(async () => {
					await deleteAttackMessages();
					await attacker?.delete();
					await defender?.delete();
				});

				async function rollAndGetMsg() {
					await deleteAttackMessages();
					await defender.unsetFlag("ordemparanormal", "reactionUsedRound");
					const original = game.user.targets;
					game.user.targets = new Set([targetTokenFor(defender)]);
					try {
						await sword.rollAttack({});
					} finally {
						game.user.targets = original;
					}
					return [...game.messages].reverse().find((m) => m.getFlag("ordemparanormal", "reactionPending"));
				}

				it("dodge: revela hit, marca dodged, consome reação", async () => {
					const msg = await rollAndGetMsg();
					assert.exists(msg, "Setup: msg de ataque criada");
					const hitBefore = msg.getFlag("ordemparanormal", "hitResult");

					await handleReaction({
						sender: game.user,
						payload: {
							type: "dodge",
							messageId: msg.id,
							defenderUuid: defender.uuid,
							attackerUuid: attacker.uuid,
							itemUuid: sword.uuid,
						},
					});

					const hitAfter = msg.getFlag("ordemparanormal", "hitResult");
					assert.isTrue(hitAfter.revealed, "revealed=true após dodge");
					assert.isTrue(hitAfter.dodged, "dodged=true");
					assert.isAbove(hitAfter.targetDefense, hitBefore.targetDefense, "Defense subiu pelo bônus de Reflexos");

					const applied = msg.getFlag("ordemparanormal", "reactionApplied");
					assert.equal(applied.type, "dodge");

					assert.equal(
						defender.getFlag("ordemparanormal", "reactionUsedRound"),
						game.combat?.round ?? 0,
						"reactionUsedRound marcado"
					);
				});

				it("block: persiste damageBlock flag e consome reação", async () => {
					const msg = await rollAndGetMsg();

					await handleReaction({
						sender: game.user,
						payload: {
							type: "block",
							messageId: msg.id,
							defenderUuid: defender.uuid,
							attackerUuid: attacker.uuid,
							itemUuid: sword.uuid,
						},
					});

					const block = msg.getFlag("ordemparanormal", "damageBlock");
					assert.exists(block, "damageBlock flag presente");
					assert.isAbove(block.amount, 0, "block.amount > 0");
					assert.equal(block.defenderUuid, defender.uuid);

					const applied = msg.getFlag("ordemparanormal", "reactionApplied");
					assert.equal(applied.type, "block");
				});

				it("skip primeiro click: revela mas NÃO consome reação", async () => {
					const msg = await rollAndGetMsg();

					await handleReaction({
						sender: game.user,
						payload: { type: "skip", messageId: msg.id, defenderUuid: defender.uuid },
					});

					const hit = msg.getFlag("ordemparanormal", "hitResult");
					assert.isTrue(hit.revealed, "revealed=true após primeiro skip");
					assert.notExists(msg.getFlag("ordemparanormal", "reactionApplied"), "reactionApplied NÃO setado no primeiro skip");
					assert.notExists(
						defender.getFlag("ordemparanormal", "reactionUsedRound"),
						"reaction NÃO consumida no primeiro skip"
					);
				});

				it("skip segundo click: marca reactionApplied", async () => {
					const msg = await rollAndGetMsg();
					// First skip — reveals
					await handleReaction({
						sender: game.user,
						payload: { type: "skip", messageId: msg.id, defenderUuid: defender.uuid },
					});
					// Second skip — locks
					await handleReaction({
						sender: game.user,
						payload: { type: "skip", messageId: msg.id, defenderUuid: defender.uuid },
					});

					const applied = msg.getFlag("ordemparanormal", "reactionApplied");
					assert.exists(applied, "reactionApplied setado no segundo skip");
					assert.equal(applied.type, "skip");
				});

				it("rejeita reação quando defender não-owner e não-GM", async () => {
					const msg = await rollAndGetMsg();
					const fakeUser = { isGM: false, id: "fake-non-owner" };
					await handleReaction({
						sender: fakeUser,
						payload: {
							type: "dodge",
							messageId: msg.id,
							defenderUuid: defender.uuid,
							attackerUuid: attacker.uuid,
							itemUuid: sword.uuid,
						},
					});
					const hit = msg.getFlag("ordemparanormal", "hitResult");
					assert.isFalse(hit.revealed, "revealed continua false (request rejected)");
					assert.notExists(msg.getFlag("ordemparanormal", "reactionApplied"));
				});

				it("counter-attack: rola um ataque, marca reação usada, mensagem narrativa", async () => {
					// Counter-attack só é válido após o atacante revelar e ter errado,
					// por isso forçamos hitResult.hit=false antes do dispatch.
					const msg = await rollAndGetMsg();
					assert.exists(msg, "Setup: msg de ataque criada");

					// Construct flags directly: tests run without a Scene, so the
					// attackerTokenUuid path can't resolve a real token. Drop the field
					// entirely to exercise the legacy fallback (resolveAttackerToken)
					// which we then back with a stubbed getActiveTokens on the attacker.
					const oldPending = msg.getFlag("ordemparanormal", "reactionPending");
					await msg.update({
						flags: {
							ordemparanormal: {
								hitResult: { ...msg.getFlag("ordemparanormal", "hitResult"), hit: false, revealed: true },
								"-=reactionPending": null,
							},
						},
					});
					await msg.setFlag("ordemparanormal", "reactionPending", {
						defenderUuid: oldPending.defenderUuid,
						attackerUuid: oldPending.attackerUuid,
						// no attackerTokenUuid → legacy path
						itemUuid: oldPending.itemUuid,
						isMelee: true,
						round: oldPending.round,
					});

					// Defender precisa ter pelo menos uma arma melee equipada para o
					// validador de weaponUuid passar.
					const defenderSword = await giveMelee(defender, "[Quench] Counter Sword");

					// Stub: attacker has no canvas token in tests, so spoof getActiveTokens
					// to return a minimal token-shaped object. weapon.rollAttack only reads
					// `_forcedTarget.actor` from it, so { actor } is sufficient.
					const fakeAttackerToken = { actor: attacker, name: attacker.name };
					const origGetActiveTokens = attacker.getActiveTokens;
					attacker.getActiveTokens = () => [fakeAttackerToken];

					// Stub o rollAttack do contra-ataque para evitar dependência da
					// pipeline completa de dano (queremos só validar que disparou).
					let counterRolled = null;
					const originalRollAttack = defenderSword.rollAttack;
					defenderSword.rollAttack = function (opts) {
						counterRolled = { forcedTarget: opts?._forcedTarget };
						return Promise.resolve({ roll: { total: 0 }, criticalStatus: { isCritical: false }, hitResult: null });
					};

					try {
						await handleReaction({
							sender: game.user,
							payload: {
								type: "counterAttack",
								messageId: msg.id,
								defenderUuid: defender.uuid,
								attackerUuid: attacker.uuid,
								itemUuid: sword.uuid,
								weaponUuid: defenderSword.uuid,
							},
						});
					} finally {
						defenderSword.rollAttack = originalRollAttack;
						attacker.getActiveTokens = origGetActiveTokens;
						await defenderSword.delete();
					}

					assert.exists(counterRolled, "weapon.rollAttack foi chamado");
					assert.equal(counterRolled.forcedTarget?.actor?.uuid, attacker.uuid, "alvo é o atacante");
					const applied = msg.getFlag("ordemparanormal", "reactionApplied");
					assert.exists(applied);
					assert.equal(applied.type, "counterAttack");
					assert.equal(
						defender.getFlag("ordemparanormal", "reactionUsedRound"),
						game.combat?.round ?? 0,
						"reação consumida"
					);
				});

				it("counter-attack: aborta sem consumir reação se weaponUuid inválido", async () => {
					const msg = await rollAndGetMsg();
					await msg.update({
						flags: {
							ordemparanormal: { hitResult: { ...msg.getFlag("ordemparanormal", "hitResult"), hit: false, revealed: true } },
						},
					});

					const reactionBefore = defender.getFlag("ordemparanormal", "reactionUsedRound");
					await handleReaction({
						sender: game.user,
						payload: {
							type: "counterAttack",
							messageId: msg.id,
							defenderUuid: defender.uuid,
							attackerUuid: attacker.uuid,
							itemUuid: sword.uuid,
							// weapon UUID que não pertence ao defender
							weaponUuid: sword.uuid,
						},
					});

					// _autoResolveStale lock the panel, mas reação NÃO deve ser consumida
					assert.equal(
						defender.getFlag("ordemparanormal", "reactionUsedRound") ?? null,
						reactionBefore ?? null,
						"reação NÃO consumida quando weapon é inválida"
					);
					const applied = msg.getFlag("ordemparanormal", "reactionApplied");
					assert.equal(applied?.type, "skip", "auto-resolved como skip");
					assert.isTrue(applied?.stale, "marcado como stale");
				});

				it("auto-resolve quando ineligible (defender já reagiu nesta rodada)", async () => {
					// Out-of-combat the round tracker is a no-op (round=0 → reaction always
					// available), so we need an active combat for "ineligible" to mean anything.
					const combat = await startCombatWith([attacker, defender]);
					try {
						const msg = await rollAndGetMsg();
						await defender.setFlag("ordemparanormal", "reactionUsedRound", game.combat.round);

						await handleReaction({
							sender: game.user,
							payload: {
								type: "dodge",
								messageId: msg.id,
								defenderUuid: defender.uuid,
								attackerUuid: attacker.uuid,
								itemUuid: sword.uuid,
							},
						});

						const applied = msg.getFlag("ordemparanormal", "reactionApplied");
						assert.exists(applied, "auto-resolve marca reactionApplied");
						assert.equal(applied.type, "skip");
						assert.isTrue(applied.stale, "marcado como stale");
					} finally {
						await combat.delete();
					}
				});
			});

			// ------------------------------------------------------------
			// deleteCombat hook — limpa reactionUsedRound flags
			// ------------------------------------------------------------
			describe("deleteCombat — limpa reactionUsedRound", () => {
				let agent;
				let combat;

				before(async () => {
					agent = await createAgent({ trained: { reflexes: true } });
					combat = await Combat.create({});
					await combat.createEmbeddedDocuments("Combatant", [{ actorId: agent.id }]);
					await agent.setFlag("ordemparanormal", "reactionUsedRound", 1);
				});

				after(async () => {
					await agent?.delete();
				});

				it("ao deletar o combat, flag é unset do agente", async () => {
					assert.equal(agent.getFlag("ordemparanormal", "reactionUsedRound"), 1);
					await combat.delete();
					await new Promise((r) => setTimeout(r, 100));
					assert.notExists(
						agent.getFlag("ordemparanormal", "reactionUsedRound"),
						"flag deve ter sido removida pelo hook deleteCombat"
					);
				});
			});
		},
		{ displayName: "OP | Reações Defensivas: Esquiva / Bloqueio / Contra-ataque" }
	);
});
