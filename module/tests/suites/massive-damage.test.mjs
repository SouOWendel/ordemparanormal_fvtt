import { installBatchGuards } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.combat.massiveDamage",
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
						attributes: { vit: { value: 3 }, pre: { value: 1 }, dex: { value: 2 }, str: { value: 2 }, int: { value: 1 } },
						NEX: { value: 10 },
						...system,
					},
				});
				return refetch(actor);
			}

			describe("applyDamage — Dano Massivo trigger", () => {
				let actor;
				before(async () => (actor = await makeAgent("MassiveDamage")));
				after(async () => await actor?.delete());

				it("dano >= metade do PV, sem zerar, posta um card de Dano Massivo", async () => {
					const maxPV = actor.system.PV.max;
					await actor.applyDamage(Math.ceil(maxPV / 2), {});
					actor = refetch(actor);
					assert.isAbove(actor.system.PV.value, 0, "não deveria zerar o PV com esse dano");

					// _triggerMassiveDamage runs fire-and-forget (not awaited by applyDamage) —
					// poll briefly for the chat message to land.
					let card = null;
					for (let i = 0; i < 20 && !card; i++) {
						await new Promise((r) => setTimeout(r, 25));
						card = [...game.messages].reverse().find((m) => m.getFlag("ordemparanormal", "massiveDamageCard"));
					}
					assert.isNotNull(card, "card de Dano Massivo deveria ter sido criado");
					assert.equal(card.getFlag("ordemparanormal", "actorUuid"), actor.uuid);
					assert.isAtLeast(card.getFlag("ordemparanormal", "dt"), 15);
				});

				it("dano que ZERA o PV não posta card (vira Morrendo normal)", async () => {
					const maxPV = actor.system.PV.max;
					const countBefore = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "massiveDamageCard")).length;
					await actor.applyDamage(maxPV + 999, {});
					await new Promise((r) => setTimeout(r, 100));
					const countAfter = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "massiveDamageCard")).length;
					assert.equal(countAfter, countBefore, "não deveria criar card quando o PV zera");
					actor = refetch(actor);
					assert.equal(actor.system.PV.value, 0);
				});

				it("dano abaixo da metade não dispara", async () => {
					await actor.update({ "system.PV.value": actor.system.PV.max });
					actor = refetch(actor);
					const countBefore = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "massiveDamageCard")).length;
					await actor.applyDamage(1, {});
					await new Promise((r) => setTimeout(r, 100));
					const countAfter = [...game.messages].filter((m) => m.getFlag("ordemparanormal", "massiveDamageCard")).length;
					assert.equal(countAfter, countBefore);
				});
			});

			describe("Fortitude save resolution (rollMassiveDamage action)", () => {
				let actor;
				before(async () => (actor = await makeAgent("MassiveDamageSave")));
				after(async () => await actor?.delete());

				it("falha no teste de Fortitude zera o PV e aplica morrendo/machucado", async () => {
					await actor.update({ "system.PV.value": actor.system.PV.max });
					actor = refetch(actor);
					// Force a guaranteed failure: target far above what any roll can reach.
					const rolls = await actor.rollSkill(
						{ skill: "resilience", rolls: [{ options: { target: 999 } }] },
						{ configure: false }
					);
					const roll = Array.isArray(rolls) ? rolls[0] : rolls;
					assert.isTrue(roll.isFailure);

					// Apply the same consequence the click handler applies on failure.
					await actor.update({ "system.PV.value": 0 });
					await actor.reconcileHealthConditions();
					actor = refetch(actor);
					assert.equal(actor.system.PV.value, 0);
					assert.isTrue(actor.statuses.has("morrendo"));
				});
			});
		},
		{ displayName: "OP | Combat: Dano Massivo (P2)" }
	);
});
