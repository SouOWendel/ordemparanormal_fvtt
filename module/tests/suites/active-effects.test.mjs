Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.activeEffects",
		(context) => {
			const { describe, it, assert, before, after } = context;

			// Helper: re-fetch actor from collection to avoid stale reference after DB writes
			// per document-model.md §8 — always operate on the live document instance
			function refetch(actor) {
				return game.actors.get(actor.id);
			}

			// ----------------------------------------------------------------
			// @variable formula resolution
			// ----------------------------------------------------------------
			describe("applyActiveEffects() — @variable formula resolution", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test AE Actor",
						type: "agent",
						system: {
							class: "fighter",
							attributes: { vit: { value: 1 }, pre: { value: 1 }, dex: { value: 3 }, str: { value: 1 }, int: { value: 1 } },
							NEX: { value: 50 },
						},
					});
					actor = refetch(actor);
				});

				after(async () => {
					await actor?.delete();
				});

				it("@NEX.value resolves and adds 50 to PV.max", async () => {
					const base = actor.system.PV.max;
					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE @NEX",
							changes: [{ key: "system.PV.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "@NEX.value" }],
						},
					]);
					actor = refetch(actor);
					assert.equal(actor.system.PV.max, base + 50);
				});

				it("@attributes.dex.value resolves and adds 3 to PV.max", async () => {
					const base = actor.system.PV.max;
					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE @dex",
							changes: [{ key: "system.PV.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "@attributes.dex.value" }],
						},
					]);
					actor = refetch(actor);
					assert.equal(actor.system.PV.max, base + 3);
				});

				it("disabled AE has no effect", async () => {
					const base = actor.system.PV.max;
					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE Disabled",
							disabled: true,
							changes: [{ key: "system.PV.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "999" }],
						},
					]);
					actor = refetch(actor);
					assert.equal(actor.system.PV.max, base);
				});

				it("two ADD effects on the same key stack — PE.max increases by 5+3", async () => {
					const basePE = actor.system.PE.max;
					await actor.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "[Quench] AE Stack 1",
							changes: [{ key: "system.PE.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "5" }],
						},
						{
							name: "[Quench] AE Stack 2",
							changes: [{ key: "system.PE.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "3" }],
						},
					]);
					actor = refetch(actor);
					assert.equal(actor.system.PE.max, basePE + 8);
				});
			});

			// ----------------------------------------------------------------
			// Item-transferred AE (legacyTransferral = false implication)
			// ----------------------------------------------------------------
			describe("applyActiveEffects() — item-transferred AE", () => {
				let actor;

				before(async () => {
					actor = await Actor.create({
						name: "[Quench] Test AE Item Transfer",
						type: "agent",
						system: {
							class: "fighter",
							attributes: { vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, str: { value: 1 }, int: { value: 1 } },
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
							system: { using: { state: true } },
							effects: [
								{
									name: "[Quench] Transfer AE",
									transfer: true,
									changes: [{ key: "system.PV.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "7" }],
								},
							],
						},
					]);
					actor = refetch(actor);
					assert.equal(actor.system.PV.max, basePV + 7);
				});

				it("allApplicableEffects() returns more effects than actor.effects when items have AEs", () => {
					// With CONFIG.ActiveEffect.legacyTransferral = false, actor.effects only contains
					// direct effects. allApplicableEffects() includes item-transferred ones.
					const direct = actor.effects.size;
					const all = Array.from(actor.allApplicableEffects()).length;
					assert.isAbove(all, direct, "allApplicableEffects() must exceed actor.effects when items have AEs");
				});
			});
		},
		{ displayName: "OP | Actor: Active Effects formula resolution" }
	);
});
