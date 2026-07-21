import { installBatchGuards } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.activeEffects",
		(context) => {
			const { describe, it, assert, before, after } = context;
			installBatchGuards(context, { prefix: "[Quench]" });

			// Re-fetch the actor to avoid stale references after database writes.
			function refetch(actor) {
				return game.actors.get(actor.id);
			}

			// ----------------------------------------------------------------
			// Direct field effects without derived class calculations
			// ----------------------------------------------------------------
			describe("applyActiveEffects() — direct field effects without class calculations", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test AE Actor",
						type: "agent",
						system: {
							class: "fighter",
							attributes: {
								vit: { value: 1 },
								pre: { value: 1 },
								dex: { value: 3 },
								str: { value: 1 },
								int: { value: 1 },
							},
							NEX: { value: 50 },
						},
					});

					actor = refetch(actor);
				});

				after(async () => {
					await actor?.delete();
				});

				it("@NEX.value resolves and adds 50 to PV.max when class calculations are inactive", async () => {
					const basePV = actor.system.PV.max;

					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE @NEX",
							changes: [
								{
									key: "system.PV.max",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: "@NEX.value",
								},
							],
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV + 50);
				});

				it("@attributes.dex.value resolves and adds 3 to PV.max when class calculations are inactive", async () => {
					const basePV = actor.system.PV.max;

					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE @dex",
							changes: [
								{
									key: "system.PV.max",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: "@attributes.dex.value",
								},
							],
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV + 3);
				});

				it("disabled AE has no effect", async () => {
					const basePV = actor.system.PV.max;

					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE Disabled",
							disabled: true,
							changes: [
								{
									key: "system.PV.max",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: "999",
								},
							],
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV);
				});

				it("two ADD effects on the same key stack — PE.max increases by 5+3", async () => {
					const basePE = actor.system.PE.max;

					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE Stack 1",
							changes: [
								{
									key: "system.PE.max",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: "5",
								},
							],
						},
						{
							name: "[Quench] AE Stack 2",
							changes: [
								{
									key: "system.PE.max",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: "3",
								},
							],
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PE.max, basePE + 8);
				});
			});

			// ----------------------------------------------------------------
			// Derived status bonuses with class calculations
			// ----------------------------------------------------------------
			describe("applyActiveEffects() — derived status bonuses with class calculations", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test AE Derived Status",
						type: "agent",
						system: {
							class: "fighter",
							attributes: {
								vit: { value: 3 },
								pre: { value: 1 },
								dex: { value: 1 },
								str: { value: 1 },
								int: { value: 1 },
							},
							NEX: { value: 15 },
						},
					});

					await actor.createEmbeddedDocuments("Item", [
						{
							name: "[Quench] Test Class",
							type: "class",
							system: {
								hpInitial: 20,
								hpPerLevel: 4,
								peInitial: 2,
								pePerLevel: 2,
								sanInitial: 12,
								sanPerLevel: 3,
								disableCalculations: false,
							},
						},
					]);

					actor = refetch(actor);
				});

				after(async () => {
					await actor?.delete();
				});

				it("PV.bonus AE increases derived PV.max and responds to disabled state", async () => {
					const basePV = actor.system.PV.max;

					const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE Derived PV Bonus",
							changes: [
								{
									key: "system.PV.bonus",
									mode: CONST.ACTIVE_EFFECT_MODES.ADD,
									value: "5",
								},
							],
						},
					]);

					const effectId = effect.id;

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV + 5, "PV.bonus must be included in the derived PV.max calculation");

					await actor.updateEmbeddedDocuments("ActiveEffect", [
						{
							_id: effectId,
							disabled: true,
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV, "Disabling the effect must remove its contribution from PV.max");

					await actor.updateEmbeddedDocuments("ActiveEffect", [
						{
							_id: effectId,
							disabled: false,
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV + 5, "Re-enabling the effect must restore its contribution to PV.max");
				});
			});

			// ----------------------------------------------------------------
			// Item-transferred AE
			// ----------------------------------------------------------------
			describe("applyActiveEffects() — item-transferred AE", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test AE Item Transfer",
						type: "agent",
						system: {
							class: "fighter",
							attributes: {
								vit: { value: 1 },
								pre: { value: 1 },
								dex: { value: 1 },
								str: { value: 1 },
								int: { value: 1 },
							},
						},
					});

					actor = refetch(actor);
				});

				after(async () => {
					await actor?.delete();
				});

				it("item with transfer:true AE modifies actor stat via allApplicableEffects()", async () => {
					const basePV = actor.system.PV.max;

					await actor.createEmbeddedDocuments("Item", [
						{
							name: "[Quench] Item with AE",
							type: "armament",
							system: {
								using: { state: true },
							},
							effects: [
								{
									name: "[Quench] Transfer AE",
									transfer: true,
									changes: [
										{
											key: "system.PV.max",
											mode: CONST.ACTIVE_EFFECT_MODES.ADD,
											value: "7",
										},
									],
								},
							],
						},
					]);

					actor = refetch(actor);

					assert.equal(actor.system.PV.max, basePV + 7);
				});

				it("allApplicableEffects() returns more effects than actor.effects when items have AEs", () => {
					const directEffects = actor.effects.size;
					const applicableEffects = Array.from(actor.allApplicableEffects()).length;

					assert.isAbove(applicableEffects, directEffects, "allApplicableEffects() must include item-transferred effects");
				});
			});
		},
		{ displayName: "OP | Actor: Active Effects" }
	);
});
