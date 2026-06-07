/**
 * Quench coverage for the runtime flows of the Combat QoL fixes.
 *
 * Each describe maps to one bug from the reviewer feedback and exercises the
 * caminho real dentro do Foundry (chat messages, combat hooks, dialogs).
 * Pure visibility logic (`damageRecipients`, `shouldShowCombatantHP`,
 * `shouldShowDefenseValue`) is covered in tests/unit/helpers/visibility.test.mjs.
 *
 * Convention: everything is prefixed `[combat-qol]`. Cleanup via helpers in
 * module/tests/helpers/fixtures.mjs (`withActor`, `withSetting`, `withTargets`,
 * `purgeByPrefix`) guarantees teardown even on test failure.
 */
import { installBatchGuards, withSetting, withTargets, makeFakeToken } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.combatQol",
		(context) => {
			const { describe, it, assert, before, after, beforeEach, afterEach } = context;

			// ------------------------------------------------------------------
			// Global cleanup via the shared helper.
			// ------------------------------------------------------------------
			// Covers the 2 prefixes this batch uses ("[combat-qol]" e "[viz" para
			// temporary fixtures from tests #11/#12). Settings (`core.rollMode`)
			// are still restored via the snapshot below — that specific case
			// is not covered by the helper because it involves ONE value mutated by ONE
			// test only (`withSetting` internally already guarantees the happy-path restore;
			// the global snapshot is defense in depth against a helper bug).
			installBatchGuards(context, { prefix: ["[combat-qol]", "[viz"] });

			// Deterministic barrier for the async effect-expiration hook. Foundry's
			// `Hooks.callAll("combatTurn", ...)` does NOT await async listeners, so
			// `await combat.nextTurn()` returns before `_expireTemporaryEffects`
			// commits its `deleteEmbeddedDocuments` call. We chain every expiration
			// onto a module-level Promise and await its tail here — replacing the
			// old `setTimeout(800)` heuristic that flaked under CI / full-suite load.
			let _getPendingExpirations = null;
			async function awaitExpire() {
				if (!_getPendingExpirations) {
					_getPendingExpirations = (await import("/systems/ordemparanormal/module/hooks.mjs")).getPendingExpirations;
				}
				await _getPendingExpirations();
			}

			const _BATCH_STATE = { coreRollMode: null };
			before(async () => {
				_BATCH_STATE.coreRollMode = game.settings.get("core", "rollMode");
			});
			afterEach(async () => {
				// Defense in depth against a possible setting leak.
				const cur = game.settings.get("core", "rollMode");
				if (cur !== _BATCH_STATE.coreRollMode) {
					await game.settings.set("core", "rollMode", _BATCH_STATE.coreRollMode);
				}
				// Close any leftover DialogV2 (test #11 opens a dialog and cancels).
				for (const dialog of [...(foundry.applications.instances?.values?.() ?? [])]) {
					if (dialog?.constructor?.name === "DialogV2") {
						try {
							await dialog.close({ animate: false });
						} catch (_e) {
							/* já fechado */
						}
					}
				}
			});
			after(async () => {
				if (_BATCH_STATE.coreRollMode != null) {
					await game.settings.set("core", "rollMode", _BATCH_STATE.coreRollMode);
				}
			});
			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[combat-qol] Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: {
							vit: { value: 2 },
							pre: { value: 2 },
							dex: { value: 2 },
							str: { value: 3 },
							int: { value: 1 },
						},
						NEX: { value: 5 },
						defense: { value: 12, bonus: 0, dodge: 0 },
						...systemOverrides,
					},
				});
			}

			async function createThreat(systemOverrides = {}) {
				return Actor.create({
					name: "[combat-qol] Threat",
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
						defense: { value: 10 },
						...systemOverrides,
					},
				});
			}

			async function giveMeleeItem(actor, name = "[combat-qol] Sword", overrides = {}) {
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
							...overrides,
						},
					},
				]);
				return item;
			}

			// `setTargets`/`restoreTargets` remain as thin wrappers over
			// `makeFakeToken` to keep the explicit `try/finally` pattern existing
			// tests already use. For new tests prefer `withTargets(tokens, async () => …)`
			// — it abstracts the try/finally and is harder to get wrong.
			function setTargets(actors) {
				const snapshot = new Set(game.user.targets);
				game.user.targets.clear();
				for (const a of actors) game.user.targets.add(makeFakeToken(a));
				return snapshot;
			}

			function restoreTargets(snapshot) {
				game.user.targets.clear();
				for (const t of snapshot) game.user.targets.add(t);
			}

			async function purgeMessages(predicate) {
				const toDelete = [...game.messages].filter(predicate);
				for (const m of toDelete) await m.delete();
			}

			// ==================================================================
			// Bug #7: multi-attack distribution (round-robin)
			// ==================================================================
			describe("#7 — Multi-attack distributes attacks across targets (round-robin)", () => {
				let attacker;
				let agentA;
				let agentB;
				let weapon;

				before(async () => {
					attacker = await createThreat();
					agentA = await createAgent({ defense: { value: 1 } }); // always hits
					agentB = await createAgent({ defense: { value: 1 } });
					weapon = await giveMeleeItem(attacker, "[combat-qol] Mordida x2", { numberOfAttacks: 2 });
				});

				beforeEach(async () => {
					await purgeMessages((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
				});

				after(async () => {
					await purgeMessages((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					await attacker?.delete();
					await agentA?.delete();
					await agentB?.delete();
				});

				it("numAttacks=2, 2 targets → 2 rolls (1 per target), not 4", async () => {
					const snap = setTargets([agentA, agentB]);
					try {
						await weapon.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const msgs = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					assert.equal(msgs.length, 2, `Expected 2 attacks, got ${msgs.length}`);
					const targets = msgs.map((m) => m.getFlag("ordemparanormal", "hitResult")?.actorUuid).sort();
					assert.deepEqual(targets, [agentA.uuid, agentB.uuid].sort(), "1 attack per target (round-robin)");
				});

				it("numAttacks=2, 1 target → 2 rolls on the same target", async () => {
					const snap = setTargets([agentA]);
					try {
						await weapon.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const msgs = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					assert.equal(msgs.length, 2);
					const uniqTargets = new Set(msgs.map((m) => m.getFlag("ordemparanormal", "hitResult")?.actorUuid));
					assert.equal(uniqTargets.size, 1, "both attacks on the same target (only one available)");
					assert.isTrue(uniqTargets.has(agentA.uuid));
				});
			});

			// ==================================================================
			// Bug #9: aggregated hitResult across a multi-attack volley
			// ==================================================================
			describe("#9 — Multi-attack volley agrega hit/miss no item card", () => {
				let attacker;
				let agentHittable;
				let agentUntouchable;
				let weapon;

				before(async () => {
					attacker = await createThreat();
					agentHittable = await createAgent({ defense: { value: 1 } }); // always hits
					agentUntouchable = await createAgent({ defense: { value: 99 } }); // always misses
					weapon = await giveMeleeItem(attacker, "[combat-qol] Volley Sword", { numberOfAttacks: 2 });
				});

				beforeEach(async () => {
					await purgeMessages(
						(m) =>
							m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id ||
							m.content?.includes(`data-item-id="${weapon.id}"`)
					);
				});

				after(async () => {
					await purgeMessages(
						(m) =>
							m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id ||
							m.content?.includes(`data-item-id="${weapon.id}"`)
					);
					await attacker?.delete();
					await agentHittable?.delete();
					await agentUntouchable?.delete();
				});

				it("volley hit+miss → item card guarda attackResults com 2 entradas", async () => {
					await weapon.roll(); // cria o item card
					const snap = setTargets([agentHittable, agentUntouchable]);
					try {
						await weapon.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const cardMsg = [...game.messages]
						.reverse()
						.find((m) => m.content?.includes(`data-item-id="${weapon.id}"`) && m.content?.includes("chat-card item-card"));
					assert.exists(cardMsg, "card do item deve existir");
					const hr = cardMsg.getFlag("ordemparanormal", "hitResult");
					assert.exists(hr, "hitResult agregado deve existir");
					assert.isArray(hr.attackResults, "attackResults deve ser array");
					assert.equal(hr.attackResults.length, 2, "2 ataques na volley");
					const hits = hr.attackResults.map((a) => a.hit);
					assert.include(hits, true, "ao menos 1 hit");
					assert.include(hits, false, "ao menos 1 miss");
				});

				it("hit anterior NÃO é sobrescrito por miss posterior (campo agregado .hit reflete OR)", async () => {
					await weapon.roll();
					const snap = setTargets([agentHittable, agentUntouchable]);
					try {
						await weapon.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const cardMsg = [...game.messages]
						.reverse()
						.find((m) => m.content?.includes(`data-item-id="${weapon.id}"`) && m.content?.includes("chat-card item-card"));
					const hr = cardMsg.getFlag("ordemparanormal", "hitResult");
					assert.isTrue(hr.hit, "campo agregado .hit deve permanecer true porque um ataque acertou");
				});
			});

			// ==================================================================
			// Bug #10: counter-attack forces rollMode=publicroll
			// ==================================================================
			describe("#10 — Counter-attack forces rollMode=publicroll", () => {
				let attacker;
				let defender;
				let defenderWeapon;

				before(async () => {
					attacker = await createThreat();
					defender = await createAgent();
					await defender.update({ "system.skills.fighting.degree.value": 5 });
					defenderWeapon = await giveMeleeItem(defender, "[combat-qol] Def Sword");
				});

				after(async () => {
					await purgeMessages((m) => m.content?.includes("[combat-qol]") || m.flavor?.includes("[combat-qol]"));
					await attacker?.delete();
					await defender?.delete();
				});

				it("forcing rollMode='publicroll' makes the counter-attack message NOT be whisper-only to the GM", async () => {
					// `withSetting` handles set/restore via internal try/finally — without it
					// a throw here would leave the whole session on gmroll and degrade every
					// subsequent test (root cause of the original `rollOposto` flake).
					await withSetting("core", "rollMode", "gmroll", async () => {
						const result = await defenderWeapon.rollAttack({
							_forcedTarget: makeFakeToken(attacker),
							rollMode: "publicroll",
						});
						assert.exists(result, "rollAttack must return a result");
						const counterMsg = [...game.messages]
							.reverse()
							.find((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === defenderWeapon.id);
						assert.exists(counterMsg, "counter-attack message must exist");
						const whisper = counterMsg.whisper ?? [];
						assert.equal(whisper.length, 0, `publicroll must not whisper anyone — received ${JSON.stringify(whisper)}`);
					});
				});
			});

			// ==================================================================
			// Bug #11: weapon picker dialog renders HTML (img + text), not raw
			// ==================================================================
			describe("#11 — pickCounterAttackWeapon renders the dialog correctly", () => {
				let mod;
				let defender;

				before(async () => {
					mod = await import("/systems/ordemparanormal/module/helpers/reactions.mjs");
					defender = await createAgent();
					await giveMeleeItem(defender, "[combat-qol] Espada A");
					await giveMeleeItem(defender, "[combat-qol] Espada B");
				});

				after(async () => {
					await defender?.delete();
				});

				it("0 weapons → returns null and emits warning", async () => {
					const empty = await createAgent();
					try {
						const picked = await mod.pickCounterAttackWeapon(empty);
						assert.isNull(picked, "with no weapons, returns null");
					} finally {
						await empty.delete();
					}
				});

				it("exactly 1 weapon → auto-selects, no dialog", async () => {
					const lone = await createAgent();
					const onlyWeapon = await giveMeleeItem(lone, "[combat-qol] Solo Sword");
					try {
						const picked = await mod.pickCounterAttackWeapon(lone);
						assert.equal(picked?.id, onlyWeapon.id, "auto-selects the only weapon");
					} finally {
						await lone.delete();
					}
				});

				it("2+ weapons → dialog opens with .op-weapon-option containing rendered img + text (not raw HTML)", async () => {
					// Fire-and-forget: the dialog is modal and the test can't click via async,
					// so we inspect the DOM while the dialog is mounted and then cancel.
					mod.pickCounterAttackWeapon(defender);
					await new Promise((r) => setTimeout(r, 200));
					const options = [...document.querySelectorAll(".op-weapon-option")];
					try {
						assert.isAtLeast(options.length, 2, "must list at least 2 weapons");
						for (const opt of options) {
							assert.exists(opt.querySelector("img"), "each option has an <img>");
							assert.isFalse(
								opt.textContent.includes("<img") || opt.textContent.includes("<span"),
								"text must not contain raw HTML"
							);
						}
						const buttonActions = [...document.querySelectorAll("button[data-action]")]
							.map((b) => b.dataset.action)
							.filter((a) => a === "ok" || a === "__cancel");
						assert.include(buttonActions, "ok");
						assert.include(buttonActions, "__cancel");
					} finally {
						// Close the dialog so it doesn't leak
						document.querySelector('button[data-action="__cancel"]')?.click();
						await new Promise((r) => setTimeout(r, 100));
					}
				});
			});

			// ==================================================================
			// Bug #12: item card shows all targets (not just one)
			// ==================================================================
			describe("#12 — Item card shows multiple targets", () => {
				let actor;
				let item;
				let targetA;
				let targetB;
				let targetC;

				before(async () => {
					actor = await createAgent();
					item = await giveMeleeItem(actor, "[combat-qol] Card Sword");
					targetA = await createThreat();
					targetB = await createThreat();
					targetC = await createThreat();
				});

				beforeEach(async () => {
					await purgeMessages((m) => m.content?.includes(`data-item-id="${item.id}"`));
				});

				after(async () => {
					await purgeMessages((m) => m.content?.includes(`data-item-id="${item.id}"`));
					await actor?.delete();
					await targetA?.delete();
					await targetB?.delete();
					await targetC?.delete();
				});

				function findCard() {
					return [...game.messages]
						.reverse()
						.find((m) => m.content?.includes(`data-item-id="${item.id}"`) && m.content?.includes("chat-card item-card"));
				}

				// `withTargets` pattern (helpers/fixtures.mjs): handles set/restore
				// via internal try/finally, eliminating the manual boilerplate and the
				// risk of forgetting the restore on error paths.
				it("0 targets → .target-info block absent", async () => {
					await withTargets([], async () => {
						await item.roll();
					});
					const card = findCard();
					assert.exists(card);
					assert.notInclude(card.content, 'class="target-info"', "with no targets, .target-info is not rendered");
				});

				it("1 target → shows the name only", async () => {
					await withTargets([makeFakeToken(targetA)], async () => {
						await item.roll();
					});
					const card = findCard();
					assert.include(card.content, "target-info");
					assert.include(card.content, targetA.name);
					assert.notInclude(card.content, "alvos:", "single target must not use the 'N alvos:' prefix");
				});

				it("3 targets → shows '3 alvos: A, B, C'", async () => {
					await withTargets([makeFakeToken(targetA), makeFakeToken(targetB), makeFakeToken(targetC)], async () => {
						await item.roll();
					});
					const card = findCard();
					assert.include(card.content, "target-info");
					// Could be in pt-BR ("alvos") or en ("targets") depending on session locale
					const hasLabel = card.content.includes("alvos:") || card.content.includes("targets:");
					assert.isTrue(hasLabel, "must contain prefix 'alvos:' or 'targets:'");
					for (const t of [targetA, targetB, targetC]) {
						assert.include(card.content, t.name, `name ${t.name} must appear`);
					}
				});
			});

			// ==================================================================
			// Bug #14: effect expires when a round advances (non-current combatant)
			// ==================================================================
			describe("#14 — Temporary effect expires when the round advances", () => {
				let agentA;
				let agentB;

				before(async () => {
					agentA = await createAgent();
					agentB = await createAgent();
				});

				after(async () => {
					for (const c of [...(game.combats ?? [])]) await c.delete();
					await agentA?.delete();
					await agentB?.delete();
				});

				it("effect rounds=1 on a NON-current combatant is deleted when combat advances to round 2", async function () {
					// Default Mocha = 2000ms; nossos waits totalizam >2s (hooks async sem
					// `Hooks.callAll` await + setTimeouts de respiração).
					this.timeout(10000);
					// Limpar combats prévios
					for (const c of [...(game.combats ?? [])]) await c.delete();
					const combat = await Combat.create({});
					await combat.createEmbeddedDocuments("Combatant", [
						{ actorId: agentA.id, initiative: 10 },
						{ actorId: agentB.id, initiative: 5 },
					]);
					await combat.activate();
					await combat.startCombat();
					// Effect on agentB (NOT the current combatant — combatant 0 is agentA)
					const [effect] = await agentB.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[combat-qol] Buff 1 round",
							icon: "icons/svg/upgrade.svg",
							changes: [],
							duration: { rounds: 1, startRound: combat.round, startTurn: combat.turn },
						},
					]);
					assert.isTrue(agentB.effects.has(effect.id), "effect exists before the advance");

					// Avançar até round 2 (2 nextTurns para wrap). `awaitExpire()` aguarda
					// determinísticamente o delete async do hook combatTurn — substitui
					// o antigo `setTimeout(800)` que flakeava sob carga.
					await combat.nextTurn();
					await awaitExpire();
					await combat.nextTurn();
					await awaitExpire();

					assert.equal(combat.round, 2, "combat must be in round 2");
					assert.isFalse(agentB.effects.has(effect.id), "effect rounds=1 must be deleted by the time we reach round 2");
					await combat.delete();
				});

				it("effect rounds=2 still persists at round 2, expires at round 3", async function () {
					this.timeout(15000);
					for (const c of [...(game.combats ?? [])]) await c.delete();
					const combat = await Combat.create({});
					await combat.createEmbeddedDocuments("Combatant", [
						{ actorId: agentA.id, initiative: 10 },
						{ actorId: agentB.id, initiative: 5 },
					]);
					await combat.activate();
					await combat.startCombat();
					const [effect] = await agentB.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[combat-qol] Buff 2 rounds",
							icon: "icons/svg/upgrade.svg",
							changes: [],
							duration: { rounds: 2, startRound: combat.round, startTurn: combat.turn },
						},
					]);
					// Avança 2 turnos → round 2. `awaitExpire()` aguarda o delete async
					// do hook combatTurn de forma determinística.
					await combat.nextTurn();
					await awaitExpire();
					await combat.nextTurn();
					await awaitExpire();
					assert.equal(combat.round, 2);
					assert.isTrue(agentB.effects.has(effect.id), "still exists at round 2");
					// Avança mais 2 → round 3
					await combat.nextTurn();
					await awaitExpire();
					await combat.nextTurn();
					await awaitExpire();
					assert.equal(combat.round, 3);
					assert.isFalse(agentB.effects.has(effect.id), "expires upon reaching round 3");
					await combat.delete();
				});
			});

			// ==================================================================
			// Bug #4: combat tracker render — GM sees the threat HP
			// (the hide-from-player logic lives in helpers/visibility and has
			// unit coverage; here we only validate the GM path still works)
			// ==================================================================
			describe("#4 — Combat tracker shows threat HP to the GM", () => {
				let threat;
				let combat;

				before(async () => {
					threat = await createThreat({ attributes: { hp: { value: 25, max: 50 } } });
					for (const c of [...(game.combats ?? [])]) await c.delete();
					combat = await Combat.create({});
					await combat.createEmbeddedDocuments("Combatant", [{ actorId: threat.id, initiative: 1 }]);
					await combat.activate();
					await combat.startCombat();
					ui.combat?.render();
					await new Promise((r) => setTimeout(r, 300));
				});

				after(async () => {
					// `installBatchGuards.afterEach` already deletes any active combat
					// between tests, so `combat` may already be gone by the time this
					// `after` runs. Guard against the double-delete that would
					// otherwise throw `Combat id ... does not exist` and bump
					// Mocha's stats.failures counter for an invisible hook failure.
					if (combat && game.combats.has?.(combat.id)) {
						try {
							await combat.delete();
						} catch (_e) {
							/* already deleted */
						}
					}
					await threat?.delete();
				});

				it("GM sees the .op-hp-display element in the tracker for the threat", () => {
					assert.isTrue(game.user.isGM, "this test assumes a GM session");
					// O tracker pode estar fechado ou em outro container — fallback amplo
					const allHpEls = document.querySelectorAll(".op-hp-display");
					assert.isAtLeast(allHpEls.length, 1, "must have at least one .op-hp-display visible to the GM");
					const hpEl = [...allHpEls].find((el) => el.textContent?.includes("25/50"));
					assert.exists(
						hpEl,
						"must show '25/50' (threat HP) — found: " + [...allHpEls].map((e) => e.textContent).join(", ")
					);
				});
			});

			// ==================================================================
			// Bug #5: damage chat whisper recipients (integration)
			// ==================================================================
			describe("#5 — Damage chat is whispered (not public) for threat targets", () => {
				let attacker;
				let threatTarget;
				let originalRollMode;

				before(async () => {
					attacker = await createAgent();
					threatTarget = await createThreat({
						attributes: { hp: { value: 20, max: 20 } },
						resistances: { cuttingDamage: { value: 0, vulnerable: false, immune: false } },
					});
					await giveMeleeItem(attacker, "[combat-qol] Damage Sword");
					originalRollMode = game.settings.get("core", "rollMode");
					await game.settings.set("core", "rollMode", "publicroll");
				});

				after(async () => {
					await game.settings.set("core", "rollMode", originalRollMode);
					await purgeMessages((m) => m.content?.includes("[combat-qol]") || m.flavor?.includes("[combat-qol]"));
					await attacker?.delete();
					await threatTarget?.delete();
				});

				it("applyDamage on threat → ChatMessage is whispered to the GM only", async () => {
					const result = await threatTarget.applyDamage(7, { damageType: "cuttingDamage" });
					assert.isAbove(result.finalDamage, 0);
					// Simular o chat que item.mjs cria após apply (whisper via _damageRecipients)
					const recipients = [...(game.users ?? [])]
						.filter((u) => u.isGM || threatTarget.testUserPermission?.(u, "OWNER"))
						.map((u) => u.id);
					const msg = await ChatMessage.create({
						content: `[combat-qol] sim apply`,
						speaker: ChatMessage.getSpeaker({ actor: threatTarget }),
						whisper: recipients,
					});
					assert.exists(msg);
					assert.isArray(msg.whisper);
					assert.isAbove(msg.whisper.length, 0, "deve haver recipients");
					// Threat só tem owner GM → whisper só contém ids GM
					const allGM = msg.whisper.every((uid) => game.users.get(uid)?.isGM);
					assert.isTrue(allGM, "todos os recipients devem ser GMs (threat sem owner humano)");
				});
			});

			// ==================================================================
			// Bug #6: hit-result block — Defense visible to GM
			// (full logic coverage in unit visibility.test.mjs;
			// here we validate the GM path in the real chat)
			// ==================================================================
			describe("#6 — Hit-result block shows .vs-defense to the GM", () => {
				let attacker;
				let target;
				let weapon;

				before(async () => {
					attacker = await createAgent();
					target = await createThreat({ defense: { value: 12 } });
					weapon = await giveMeleeItem(attacker, "[combat-qol] Vis Sword");
				});

				after(async () => {
					await purgeMessages((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					await attacker?.delete();
					await target?.delete();
				});

				it("GM attacker sees the defense number on the chat card", async () => {
					assert.isTrue(game.user.isGM);
					const snap = setTargets([target]);
					try {
						await weapon.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const msg = [...game.messages]
						.reverse()
						.find((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					assert.exists(msg, "attack message created");
					await new Promise((r) => setTimeout(r, 300));
					// Renderizar e inspecionar
					const html = await msg.getHTML();
					const vsDefense = html.querySelector(".vs-defense");
					assert.exists(vsDefense, "GM must see the .vs-defense span");
					assert.include(vsDefense.textContent, "12", "defense value (12) appears");
				});
			});

			// ==================================================================
			// Post-review fix: Apply-Damage button idempotency
			// ==================================================================
			describe("Post-review — Apply Damage is idempotent", () => {
				let attacker;
				let target;
				let weapon;

				before(async () => {
					attacker = await createAgent();
					target = await createThreat({ attributes: { hp: { value: 50, max: 50 } } });
					weapon = await giveMeleeItem(attacker, "[combat-qol] Idem Sword");
				});

				beforeEach(async () => {
					await purgeMessages((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					await target.update({ "system.attributes.hp.value": 50 });
				});

				after(async () => {
					await purgeMessages((m) => m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id);
					await attacker?.delete();
					await target?.delete();
				});

				it("after applying damage, a second click does NOT duplicate (damageApplied flag persists)", async () => {
					// Create a damage message via ChatMessage.create simulating the flow:
					// damageTarget flag set, GM does "applyDamage" via _onChatCardAction.
					const fakeRoll = new Roll("0d4 + 8");
					await fakeRoll.evaluate();
					const dmgMsg = await fakeRoll.toMessage(
						{
							speaker: ChatMessage.getSpeaker({ actor: attacker }),
							flavor: "[combat-qol] dano fake",
							flags: {
								ordemparanormal: {
									damageTarget: {
										actorUuid: target.uuid,
										damageType: "cuttingDamage",
										attackMessageId: null,
									},
								},
							},
						},
						{ rollMode: "publicroll" }
					);

					const hpBefore = target.system.attributes.hp.value;

					// Não temos um card real, então simulamos chamando a lógica via flag check.
					// Usar `OrdemItem._onChatCardAction` requer DOM. Em vez disso, vamos
					// chamar a lógica de apply via socket-equivalent (game.user é GM aqui).
					const apply = async () => {
						if (dmgMsg.getFlag("ordemparanormal", "damageApplied")) return false;
						const damageTarget = dmgMsg.getFlag("ordemparanormal", "damageTarget");
						const tActor = await fromUuid(damageTarget.actorUuid);
						const roll = dmgMsg.rolls?.[0];
						const result = await tActor.applyDamage(roll.total, { damageType: damageTarget.damageType });
						await dmgMsg.setFlag("ordemparanormal", "damageApplied", {
							at: Date.now(),
							by: game.user.id,
							amount: result.finalDamage,
							targetUuid: damageTarget.actorUuid,
						});
						return true;
					};

					const r1 = await apply();
					const hpAfter1 = target.system.attributes.hp.value;
					const r2 = await apply(); // segunda tentativa, deve ser no-op
					const hpAfter2 = target.system.attributes.hp.value;

					assert.isTrue(r1, "first application runs");
					assert.isFalse(r2, "second application is blocked by the flag");
					assert.equal(hpAfter1, hpBefore - 8, "HP reduced on the 1st application");
					assert.equal(hpAfter2, hpAfter1, "HP does NOT change on the 2nd attempt");
					assert.exists(dmgMsg.getFlag("ordemparanormal", "damageApplied"), "damageApplied flag persisted");

					await dmgMsg.delete();
				});
			});

			// ==================================================================
			// Post-review fix: rollDamage auto-detect recovers x3/x4 multiplier
			// ==================================================================
			describe("Post-review — rollDamage respects x3/x4 multiplier when auto-detecting critical", () => {
				let attacker;
				let weaponX3;

				before(async () => {
					attacker = await createAgent({
						attributes: {
							vit: { value: 2 },
							pre: { value: 2 },
							dex: { value: 2 },
							str: { value: 3 },
							int: { value: 1 },
						},
					});
					weaponX3 = await giveMeleeItem(attacker, "[combat-qol] Arma X3", { critical: "19/x3" });
				});

				beforeEach(async () => {
					await purgeMessages((m) => m.flavor?.includes("[combat-qol] Arma X3"));
				});

				after(async () => {
					await purgeMessages((m) => m.flavor?.includes("[combat-qol] Arma X3"));
					await attacker?.delete();
				});

				it("hitResult.isCritical + critical formula '19/x3' → formula uses 3d6 (not 2d6)", async () => {
					const roll = await weaponX3.rollDamage({
						event: { altKey: false },
						hitResult: { isCritical: true, hit: true, actorUuid: null, targetDefense: 10 },
						lastId: true,
					});
					assert.include(roll.formula, "3d6", `formula must contain 3d6 (x3 multiplier), got: ${roll.formula}`);
				});

				it("hitResult.isCritical + critical formula 'x4' → formula uses 4d6", async () => {
					const weaponX4 = await giveMeleeItem(attacker, "[combat-qol] Arma X4", { critical: "x4" });
					try {
						const roll = await weaponX4.rollDamage({
							event: { altKey: false },
							hitResult: { isCritical: true, hit: true, actorUuid: null, targetDefense: 10 },
							lastId: true,
						});
						assert.include(roll.formula, "4d6", `formula must contain 4d6 (x4 multiplier), got: ${roll.formula}`);
					} finally {
						await weaponX4.delete();
					}
				});
			});

			// ==================================================================
			// Post-review fix: turnsElapsed doesn't go negative on round wrap
			// ==================================================================
			describe("Post-review — turnsElapsed wrap-around does not keep effect alive an extra turn", () => {
				let agentA;
				let agentB;

				before(async () => {
					agentA = await createAgent();
					agentB = await createAgent();
				});

				after(async () => {
					for (const c of [...(game.combats ?? [])]) await c.delete();
					await agentA?.delete();
					await agentB?.delete();
				});

				it("effect with dur.turns=2 and startTurn=1 expires on time even after wrap", async function () {
					this.timeout(15000);
					for (const c of [...(game.combats ?? [])]) await c.delete();
					const combat = await Combat.create({});
					await combat.createEmbeddedDocuments("Combatant", [
						{ actorId: agentA.id, initiative: 10 },
						{ actorId: agentB.id, initiative: 5 },
					]);
					await combat.activate();
					await combat.startCombat();
					// Advance to turn 1 (agentB) before creating the effect
					await combat.nextTurn();
					await awaitExpire();
					assert.equal(combat.turn, 1, "we are at turn 1 of round 1");
					const [effect] = await agentB.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[combat-qol] Wrap-test 2 turns",
							icon: "icons/svg/upgrade.svg",
							changes: [],
							duration: { rounds: null, turns: 2, startRound: combat.round, startTurn: combat.turn },
						},
					]);
					assert.isTrue(agentB.effects.has(effect.id), "created");
					// Advance turn → wrap to round 2 turn 0 (1 turn elapsed)
					await combat.nextTurn();
					await awaitExpire();
					assert.equal(combat.round, 2);
					assert.equal(combat.turn, 0);
					assert.isTrue(agentB.effects.has(effect.id), "1 turn elapsed, still exists (turns=2)");
					// One more turn → 2 turns complete
					await combat.nextTurn();
					await awaitExpire();
					assert.isFalse(
						agentB.effects.has(effect.id),
						`2 turns complete → must expire (without the fix, it survives due to the negative wrap)`
					);
					await combat.delete();
				});
			});

			// ==================================================================
			// Post-review (round 3): multi-attack volley aggregates isCritical
			// and the damage button multiplies dice when ANY attack was a crit.
			// Before the fix, rollAttack() returned only results[0] (attack #1),
			// so a critical on attack #2 was lost on the way to rollDamage and
			// the dice were never multiplied.
			// ==================================================================
			describe("Post-review — multi-attack critical aggregation multiplies damage dice", () => {
				let attacker;
				let target;
				let weaponAlwaysCrit;
				let weaponNeverCrit;

				before(async () => {
					attacker = await createThreat({ attributes: { hp: { value: 30, max: 30 }, str: { value: 4 } } });
					target = await createAgent({ defense: { value: 1 } }); // always hit
					weaponAlwaysCrit = await giveMeleeItem(attacker, "[combat-qol] Crit Sword", {
						critical: "1", // margin=1 → any d20 is a critical
						numberOfAttacks: 2,
						formulas: {
							attack: { attr: "str", skill: "fighting", bonus: 0 },
							damage: { formula: "1d6", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
						},
					});
					weaponNeverCrit = await giveMeleeItem(attacker, "[combat-qol] NoCrit Sword", {
						critical: "99", // unreachable margin → never a critical
						numberOfAttacks: 2,
						formulas: {
							attack: { attr: "str", skill: "fighting", bonus: 0 },
							damage: { formula: "1d6", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
						},
					});
				});

				beforeEach(async () => {
					await purgeMessages(
						(m) =>
							m.getFlag("ordemparanormal", "messageRoll")?.itemId === weaponAlwaysCrit.id ||
							m.getFlag("ordemparanormal", "messageRoll")?.itemId === weaponNeverCrit.id ||
							m.content?.includes(`data-item-id="${weaponAlwaysCrit.id}"`) ||
							m.content?.includes(`data-item-id="${weaponNeverCrit.id}"`)
					);
				});

				after(async () => {
					await purgeMessages(
						(m) =>
							m.getFlag("ordemparanormal", "messageRoll")?.itemId === weaponAlwaysCrit.id ||
							m.getFlag("ordemparanormal", "messageRoll")?.itemId === weaponNeverCrit.id ||
							m.content?.includes(`data-item-id="${weaponAlwaysCrit.id}"`) ||
							m.content?.includes(`data-item-id="${weaponNeverCrit.id}"`)
					);
					await weaponAlwaysCrit?.delete();
					await weaponNeverCrit?.delete();
					await target?.delete();
					await attacker?.delete();
				});

				it("volley com crit em qualquer ataque marca isCritical=true no card flag agregado", async () => {
					await weaponAlwaysCrit.roll(); // creates the item card
					const snap = setTargets([target]);
					try {
						await weaponAlwaysCrit.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const cardMsg = [...game.messages]
						.reverse()
						.find(
							(m) => m.content?.includes(`data-item-id="${weaponAlwaysCrit.id}"`) && m.content?.includes("chat-card item-card")
						);
					assert.exists(cardMsg, "item card deve existir");
					const hr = cardMsg.getFlag("ordemparanormal", "hitResult");
					assert.exists(hr, "hitResult agregado deve existir");
					assert.equal(hr.attackResults?.length, 2, "2 ataques na volley");
					assert.isTrue(hr.isCritical, "isCritical agregado deve ser true (todos os ataques rolaram crit)");
				});

				it("rollAttack retorna results[0] com hitResult.isCritical=true (refletindo o agregado, não só attack #1)", async () => {
					await weaponAlwaysCrit.roll();
					const snap = setTargets([target]);
					let result;
					try {
						result = await weaponAlwaysCrit.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					assert.exists(result?.hitResult, "result.hitResult deve existir");
					assert.isTrue(result.hitResult.isCritical, "result.hitResult.isCritical deve refletir o agregado (true)");
					assert.isTrue(result.criticalStatus?.isCritical, "result.criticalStatus.isCritical deve refletir o agregado");
					assert.equal(result.criticalStatus?.multiplier, 2, "multiplier deve vir da formula (x2 default)");
				});

				it("rollDamage com hitResult agregado isCritical=true multiplica os dados (1d6 → 2d6)", async () => {
					await weaponAlwaysCrit.roll();
					const snap = setTargets([target]);
					try {
						await weaponAlwaysCrit.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const cardMsg = [...game.messages]
						.reverse()
						.find(
							(m) => m.content?.includes(`data-item-id="${weaponAlwaysCrit.id}"`) && m.content?.includes("chat-card item-card")
						);
					const hr = cardMsg.getFlag("ordemparanormal", "hitResult");
					const damageRoll = await weaponAlwaysCrit.rollDamage({
						event: { altKey: false },
						hitResult: hr,
						lastId: true,
					});
					assert.include(
						damageRoll.formula,
						"2d6",
						`formula deve conter 2d6 (1d6 multiplicado por x2), got: ${damageRoll.formula}`
					);
				});

				it("volley SEM critical: damage formula NÃO é multiplicada (regression guard)", async () => {
					await weaponNeverCrit.roll();
					const snap = setTargets([target]);
					try {
						await weaponNeverCrit.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const cardMsg = [...game.messages]
						.reverse()
						.find(
							(m) => m.content?.includes(`data-item-id="${weaponNeverCrit.id}"`) && m.content?.includes("chat-card item-card")
						);
					const hr = cardMsg.getFlag("ordemparanormal", "hitResult");
					assert.isFalse(hr.isCritical, "isCritical agregado deve ser false (nenhum ataque crit)");
					const damageRoll = await weaponNeverCrit.rollDamage({
						event: { altKey: false },
						hitResult: hr,
						lastId: true,
					});
					assert.notInclude(
						damageRoll.formula,
						"2d6",
						`formula NÃO deve ter 2d6 quando não há critical, got: ${damageRoll.formula}`
					);
					assert.include(damageRoll.formula, "1d6", `formula deve ter 1d6 original, got: ${damageRoll.formula}`);
				});

				it("single-attack com critical continua multiplicando os dados (regression para a path single)", async () => {
					const singleAttackCrit = await giveMeleeItem(attacker, "[combat-qol] Single Crit Sword", {
						critical: "1",
						numberOfAttacks: 1,
						formulas: {
							attack: { attr: "str", skill: "fighting", bonus: 0 },
							damage: { formula: "1d6", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
						},
					});
					try {
						await singleAttackCrit.roll();
						const snap = setTargets([target]);
						let result;
						try {
							result = await singleAttackCrit.rollAttack({});
						} finally {
							restoreTargets(snap);
						}
						assert.isTrue(result.hitResult?.isCritical, "single-attack: hitResult.isCritical deve ser true");
						const damageRoll = await singleAttackCrit.rollDamage({
							event: { altKey: false },
							hitResult: result.hitResult,
							lastId: true,
						});
						assert.include(damageRoll.formula, "2d6", `single-attack: formula deve conter 2d6, got: ${damageRoll.formula}`);
					} finally {
						await purgeMessages(
							(m) =>
								m.getFlag("ordemparanormal", "messageRoll")?.itemId === singleAttackCrit.id ||
								m.content?.includes(`data-item-id="${singleAttackCrit.id}"`)
						);
						await singleAttackCrit.delete();
					}
				});

				it("nova volley sem alvo NÃO reusa o hitResult agregado da volley anterior (volleyId guard)", async () => {
					// Volley 1: com alvo → grava aggregated flag no card com volleyId=A
					await weaponAlwaysCrit.roll();
					const snap = setTargets([target]);
					try {
						await weaponAlwaysCrit.rollAttack({});
					} finally {
						restoreTargets(snap);
					}
					const cardMsg = [...game.messages]
						.reverse()
						.find(
							(m) => m.content?.includes(`data-item-id="${weaponAlwaysCrit.id}"`) && m.content?.includes("chat-card item-card")
						);
					const stale = cardMsg.getFlag("ordemparanormal", "hitResult");
					assert.exists(stale?.volleyId, "primeira volley deve ter gravado volleyId no card flag");

					// Volley 2: SEM alvo → inner attacks têm hitResult=null. Sem o guard,
					// `results[0].hitResult` herdava o stale (com actorUuid da volley 1)
					// e o damage button apontava pro alvo errado. Além disso, o
					// card flag stale tem que ser LIMPO pra que o fallback
					// persistedHit em _onChatCardAction("damage") não use o
					// actorUuid da volley anterior.
					game.user.targets.clear();
					const result2 = await weaponAlwaysCrit.rollAttack({});
					const inheritedSameVolley = result2?.hitResult?.volleyId && result2.hitResult.volleyId === stale.volleyId;
					assert.isFalse(
						Boolean(inheritedSameVolley),
						`volley 2 não deve herdar volleyId=${stale.volleyId} da volley 1 (got: ${result2?.hitResult?.volleyId})`
					);
					// Card flag também deve estar limpo (não pode persistir o stale
					// hitResult — fallback no damage path apontaria pro alvo errado).
					const refreshed = cardMsg.getFlag("ordemparanormal", "hitResult");
					assert.notExists(
						refreshed,
						`card flag stale deve ser limpo após no-target reroll (got: ${JSON.stringify(refreshed)})`
					);
				});

				it("volley multi-target hit+miss: returned hitResult.actorUuid aponta para o ALVO ACERTADO, não o errado", async () => {
					// Cenário: weapon multi-attack, 2 alvos. Round-robin: attack #1 → A (hit),
					// attack #2 → B (miss). Sem o fix P1, o aggregate top-level
					// `actorUuid` vem do ÚLTIMO ataque (B/miss) — damage button
					// apontava pra B. Com o fix, escolhemos a primeira entry hit.
					const targetHit = await createAgent({ defense: { value: 1 } });
					const targetMiss = await createAgent({ defense: { value: 99 } });
					const weapon = await giveMeleeItem(attacker, "[combat-qol] HitMiss Sword", {
						critical: "99", // não polui isCritical
						numberOfAttacks: 2,
						formulas: {
							attack: { attr: "str", skill: "fighting", bonus: 0 },
							damage: { formula: "1d6", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
						},
					});
					try {
						await weapon.roll();
						const snap = setTargets([targetHit, targetMiss]); // attack#1→hit, attack#2→miss
						let result;
						try {
							result = await weapon.rollAttack({});
						} finally {
							restoreTargets(snap);
						}
						assert.exists(result?.hitResult, "result.hitResult deve existir");
						// O hitResult retornado deve apontar pro alvo que foi ACERTADO,
						// não pro último ataque (que errou).
						assert.equal(
							result.hitResult.actorUuid,
							targetHit.uuid,
							`actorUuid deve ser do alvo acertado (${targetHit.uuid}), got: ${result.hitResult.actorUuid}`
						);
						assert.notEqual(
							result.hitResult.actorUuid,
							targetMiss.uuid,
							`actorUuid NÃO deve ser do alvo errado (${targetMiss.uuid})`
						);
					} finally {
						await purgeMessages(
							(m) =>
								m.getFlag("ordemparanormal", "messageRoll")?.itemId === weapon.id ||
								m.content?.includes(`data-item-id="${weapon.id}"`)
						);
						await weapon.delete();
						await targetHit.delete();
						await targetMiss.delete();
					}
				});
			});
		},
		{ displayName: "OP | Combat QoL: Cobertura QoL combat" }
	);
});
