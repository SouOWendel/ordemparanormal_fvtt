import { installBatchGuards } from "../helpers/fixtures.mjs";
import { applyCondition, getDicePenalty, isConditionActive, CONDITION_IDS } from "../../helpers/conditions.mjs";

// NOTE: this system's OrdemActor prep does not keep `actor.statuses` populated
// (Foundry v13 resets it after prepareDerivedData, and prepareBaseData currently
// throws on agents — see actor.mjs), so condition state is read from applied
// effects via `isConditionActive` / `actor._activeConditionIds()`. Defense
// penalties are applied at attack resolution (`_compareWithDefense`).

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.conditions",
		(context) => {
			const { describe, it, assert, before, after } = context;
			installBatchGuards(context, { prefix: "[Quench]" });

			const refetch = (actor) => game.actors.get(actor.id);

			async function makeAgent(name, system = {}) {
				const actor = await Actor.create({
					name: `[Quench] ${name}`,
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 2 }, pre: { value: 1 }, dex: { value: 3 }, str: { value: 2 }, int: { value: 1 } },
						NEX: { value: 10 },
						...system,
					},
				});
				return refetch(actor);
			}

			describe("CONFIG.statusEffects registration", () => {
				it("registers all 39 conditions on the Token HUD", () => {
					const ids = CONFIG.statusEffects.map((e) => e.id);
					for (const id of CONDITION_IDS) assert.include(ids, id, `missing condition: ${id}`);
					assert.equal(CONFIG.statusEffects.length, 39);
				});

				it("morto is an overlay and is the DEFEATED special status", () => {
					const morto = CONFIG.statusEffects.find((e) => e.id === "morto");
					assert.isTrue(morto.overlay);
					assert.equal(CONFIG.specialStatusEffects.DEFEATED, "morto");
				});

				it("condition names resolve via i18n (op.conditions.*)", () => {
					assert.notEqual(game.i18n.localize("op.conditions.abalado"), "op.conditions.abalado");
				});
			});

			describe("toggleStatusEffect + isConditionActive", () => {
				let actor;
				before(async () => (actor = await makeAgent("Toggle")));
				after(async () => await actor?.delete());

				it("toggling a condition reflects in isConditionActive / _activeConditionIds", async () => {
					await actor.toggleStatusEffect("vulneravel", { active: true });
					actor = refetch(actor);
					assert.isTrue(isConditionActive(actor, "vulneravel"));
					assert.include([...actor._activeConditionIds()], "vulneravel");
					await actor.toggleStatusEffect("vulneravel", { active: false });
					actor = refetch(actor);
					assert.isFalse(isConditionActive(actor, "vulneravel"));
				});
			});

			describe("Defense penalty (attack resolution, MAX-stacked)", () => {
				let target;
				let attacker;
				let weapon;
				before(async () => {
					target = await makeAgent("Def Target");
					attacker = await makeAgent("Def Attacker");
					await attacker.createEmbeddedDocuments("Item", [
						{
							name: "[Quench] Faca",
							type: "armament",
							system: {
								formulas: {
									attack: { attr: "str", skill: "fighting", bonus: 0 },
									damage: { formula: "1d6", type: "cuttingDamage" },
								},
								types: { rangeType: { name: "melee" } },
								using: { state: true },
							},
						},
					]);
					weapon = refetch(attacker).items.find((i) => i.type === "armament");
				});
				after(async () => {
					await target?.delete();
					await attacker?.delete();
				});

				it("desprevenido lowers effective Defense by 5", async () => {
					const base = weapon._compareWithDefense(refetch(target), 100, {}).targetDefense;
					await target.toggleStatusEffect("desprevenido", { active: true });
					const after = weapon._compareWithDefense(refetch(target), 100, {}).targetDefense;
					assert.equal(after, base - 5);
					await target.toggleStatusEffect("desprevenido", { active: false });
				});

				it("desprevenido + vulneravel = -5 (most severe, not -7)", async () => {
					const base = weapon._compareWithDefense(refetch(target), 100, {}).targetDefense;
					await target.toggleStatusEffect("desprevenido", { active: true });
					await target.toggleStatusEffect("vulneravel", { active: true });
					const after = weapon._compareWithDefense(refetch(target), 100, {}).targetDefense;
					assert.equal(after, base - 5);
					await target.toggleStatusEffect("desprevenido", { active: false });
					await target.toggleStatusEffect("vulneravel", { active: false });
				});
			});

			describe("Dice penalty", () => {
				let actor;
				before(async () => (actor = await makeAgent("Dice")));
				after(async () => await actor?.delete());

				it("fraco -> -1d on DEX-based skill, 0 on INT-based", async () => {
					await actor.toggleStatusEffect("fraco", { active: true });
					actor = refetch(actor);
					assert.equal(
						getDicePenalty(actor._activeConditionIds(), { kind: "skill", attribute: "dex", skill: "acrobatics" }),
						1
					);
					assert.equal(
						getDicePenalty(actor._activeConditionIds(), { kind: "skill", attribute: "int", skill: "occultism" }),
						0
					);
					await actor.toggleStatusEffect("fraco", { active: false });
				});

				it("D20Roll subtracts options.dicePenalty from the pool (3 -> 2); below 1 -> 2d20kl", async () => {
					const r1 = new CONFIG.Dice.D20Roll(
						"3d20kh",
						{ attributes: { dex: { value: 3 } }, attributeId: "dex" },
						{ dicePenalty: 1 }
					);
					await r1.evaluate();
					assert.equal(r1.d20.number, 2);
					const r2 = new CONFIG.Dice.D20Roll(
						"1d20",
						{ attributes: { dex: { value: 1 } }, attributeId: "dex" },
						{ dicePenalty: 2 }
					);
					await r2.evaluate();
					assert.equal(r2.d20.number, 2);
					assert.isTrue(r2.terms[0].modifiers.includes("kl"));
				});
			});

			describe("Escalation (applyCondition)", () => {
				let actor;
				before(async () => (actor = await makeAgent("Escalation")));
				after(async () => await actor?.delete());

				it("abalado reapplied becomes apavorado", async () => {
					await applyCondition(actor, "abalado");
					assert.isTrue(isConditionActive(refetch(actor), "abalado"));
					await applyCondition(actor, "abalado");
					actor = refetch(actor);
					assert.isFalse(isConditionActive(actor, "abalado"));
					assert.isTrue(isConditionActive(actor, "apavorado"));
					await actor.toggleStatusEffect("apavorado", { active: false });
				});

				it("fraco -> debilitado -> inconsciente chain", async () => {
					await applyCondition(actor, "fraco");
					await applyCondition(actor, "fraco");
					assert.isTrue(isConditionActive(refetch(actor), "debilitado"));
					await applyCondition(actor, "debilitado");
					assert.isTrue(isConditionActive(refetch(actor), "inconsciente"));
					await refetch(actor).toggleStatusEffect("inconsciente", { active: false });
				});
			});

			describe("Health conditions (morrendo/machucado)", () => {
				let actor;
				before(async () => (actor = await makeAgent("Health")));
				after(async () => await actor?.delete());

				it("PV 0 -> morrendo + machucado; heal -> removed", async () => {
					await actor.update({ "system.PV.value": 0 });
					await actor.reconcileHealthConditions();
					actor = refetch(actor);
					assert.isTrue(isConditionActive(actor, "morrendo"));
					assert.isTrue(isConditionActive(actor, "machucado"));
					await actor.update({ "system.PV.value": actor.system.PV.max });
					await actor.reconcileHealthConditions();
					actor = refetch(actor);
					assert.isFalse(isConditionActive(actor, "morrendo"));
					assert.isFalse(isConditionActive(actor, "machucado"));
				});
			});
		},
		{ displayName: "OP | Conditions (P1)" }
	);
});
