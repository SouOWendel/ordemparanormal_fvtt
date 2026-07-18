import { installBatchGuards, withActor } from "../helpers/fixtures.mjs";

/**
 * Quench integration suite for threat persistence — exercises the schema fixes
 * for the "ficha de ameaça reseta" bug. Each test creates a fresh threat actor,
 * mutates a previously-broken field, re-fetches via `game.actors.get` and
 * asserts the value survived the cleanData round-trip.
 *
 * Bugs covered:
 *   1. system.details.size was being silently dropped (schema only had `size`
 *      at top level). Template now writes to `system.size` and migrateData
 *      lifts legacy data.
 *   2. system.details.creatureType was being silently dropped (not in schema).
 *      Schema now declares `details.creatureType`.
 *   3. skill.degree.value was ignored on render (derived from degree.label).
 *      Sheet now writes degree.label and the value is derived.
 *   4. damageDamage was an orphan dropdown entry without schema backing.
 */
Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.threatPersistence",
		(context) => {
			const { describe, it, assert } = context;
			installBatchGuards(context, { prefix: "[Quench]" });

			describe("ThreatData — system.size round-trip", () => {
				it("system.size persists across update + re-fetch", async () => {
					await withActor({ name: "[Quench] size-roundtrip", type: "threat" }, async (actor) => {
						await actor.update({ "system.size": "large" });
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.size, "large");
					});
				});

				it("system.size accepts an empty string back to default", async () => {
					await withActor({ name: "[Quench] size-empty", type: "threat" }, async (actor) => {
						await actor.update({ "system.size": "small" });
						await actor.update({ "system.size": "" });
						assert.equal(game.actors.get(actor.id).system.size, "");
					});
				});
			});

			describe("ThreatData — system.details.creatureType round-trip", () => {
				it("creatureType persists across update + re-fetch", async () => {
					await withActor({ name: "[Quench] creatureType-roundtrip", type: "threat" }, async (actor) => {
						await actor.update({ "system.details.creatureType": "creature" });
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.details.creatureType, "creature");
					});
				});

				it("creatureType can be cleared back to empty string", async () => {
					await withActor({ name: "[Quench] creatureType-empty", type: "threat" }, async (actor) => {
						await actor.update({ "system.details.creatureType": "horror" });
						await actor.update({ "system.details.creatureType": "" });
						assert.equal(game.actors.get(actor.id).system.details.creatureType, "");
					});
				});
			});

			describe("ThreatData — ghost-field regression", () => {
				it("legacy system.details.size update is migrated to top-level system.size", async () => {
					// Update via the deprecated path. migrateData lifts it to the canonical
					// top-level `size` and removes the legacy key — this is the upgrade path
					// for worlds that wrote to details.size before the schema was fixed.
					await withActor({ name: "[Quench] ghost-detailsSize", type: "threat" }, async (actor) => {
						await actor.update({ "system.details.size": "huge" });
						const fresh = game.actors.get(actor.id);
						assert.isUndefined(fresh.system.details?.size, "legacy details.size must be stripped after migrateData");
						assert.equal(fresh.system.size, "huge", "value must land on the canonical system.size");
					});
				});

				it("resistances.damageDamage is not present in schema-validated data", async () => {
					await withActor({ name: "[Quench] ghost-damageDamage", type: "threat" }, async (actor) => {
						await actor.update({ "system.resistances.damageDamage.value": 99 });
						const fresh = game.actors.get(actor.id);
						assert.isUndefined(fresh.system.resistances?.damageDamage);
					});
				});
			});

			describe("ThreatData — skill.degree.label round-trip + derivation", () => {
				it("degree.label persists and degree.value derives from label", async () => {
					await withActor({ name: "[Quench] degree-trained", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.fighting.degree.label": "trained" });
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.skills.fighting.degree.label, "trained");
						assert.equal(fresh.system.skills.fighting.degree.value, 5);
					});
				});

				it("degree label veteran → derived value 10", async () => {
					await withActor({ name: "[Quench] degree-veteran", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.aim.degree.label": "veteran" });
						assert.equal(game.actors.get(actor.id).system.skills.aim.degree.value, 10);
					});
				});

				it("threat-exclusive degree label master → derived value 20", async () => {
					await withActor({ name: "[Quench] degree-master", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.fighting.degree.label": "master" });
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.skills.fighting.degree.label, "master");
						assert.equal(fresh.system.skills.fighting.degree.value, 20);
					});
				});

				it("threat-exclusive degree label alfa → derived value 25", async () => {
					await withActor({ name: "[Quench] degree-alfa", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.aim.degree.label": "alfa" });
						assert.equal(game.actors.get(actor.id).system.skills.aim.degree.value, 25);
					});
				});

				it("threat-exclusive degree label gama → derived value 30", async () => {
					await withActor({ name: "[Quench] degree-gama", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.resilience.degree.label": "gama" });
						assert.equal(game.actors.get(actor.id).system.skills.resilience.degree.value, 30);
					});
				});

				it("threat-exclusive degree label delta → derived value 35", async () => {
					await withActor({ name: "[Quench] degree-delta", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.reflexes.degree.label": "delta" });
						assert.equal(game.actors.get(actor.id).system.skills.reflexes.degree.value, 35);
					});
				});

				it("changing degree label re-derives the value on next render", async () => {
					await withActor({ name: "[Quench] degree-transition", type: "threat" }, async (actor) => {
						await actor.update({ "system.skills.perception.degree.label": "trained" });
						assert.equal(game.actors.get(actor.id).system.skills.perception.degree.value, 5);
						await actor.update({ "system.skills.perception.degree.label": "master" });
						assert.equal(game.actors.get(actor.id).system.skills.perception.degree.value, 20);
					});
				});
			});

			describe("ThreatData — skill.degree.override (homebrew flexibility, review round 2)", () => {
				it("override = 17 overrides the label-derived value", async () => {
					await withActor({ name: "[Quench] override-int", type: "threat" }, async (actor) => {
						await actor.update({
							"system.skills.fighting.degree.label": "trained",
							"system.skills.fighting.degree.override": 17,
						});
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.skills.fighting.degree.override, 17);
						assert.equal(fresh.system.skills.fighting.degree.value, 17, "override wins over derived");
					});
				});

				it("override = null restores the derived value", async () => {
					await withActor({ name: "[Quench] override-clear", type: "threat" }, async (actor) => {
						await actor.update({
							"system.skills.aim.degree.label": "veteran",
							"system.skills.aim.degree.override": 99,
						});
						assert.equal(game.actors.get(actor.id).system.skills.aim.degree.value, 99);
						await actor.update({ "system.skills.aim.degree.override": null });
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.skills.aim.degree.override, null);
						assert.equal(fresh.system.skills.aim.degree.value, 10, "veteran derived (override cleared)");
					});
				});

				it("override = 0 is honored (explicit zero is NOT the same as null)", async () => {
					await withActor({ name: "[Quench] override-zero", type: "threat" }, async (actor) => {
						await actor.update({
							"system.skills.resilience.degree.label": "master",
							"system.skills.resilience.degree.override": 0,
						});
						const fresh = game.actors.get(actor.id);
						assert.equal(fresh.system.skills.resilience.degree.value, 0, "0 is a valid override value");
					});
				});
			});

			describe("ThreatData.migrateData — legacy details.size lift (regression)", () => {
				it("synthetic legacy data with details.size is lifted to top-level size", () => {
					// Calls migrateData directly — Actor.create cannot accept non-schema paths
					// (cleanData strips them at insert), so we exercise the function in isolation
					// to lock the behaviour for worlds upgrading from pre-TypeDataModel saves.
					const ThreatDataClass = CONFIG.Actor.dataModels.threat;
					const data = { details: { size: "large", description: "x" }, size: "" };
					const out = ThreatDataClass.migrateData(data);
					assert.equal(out.size, "large");
					assert.isUndefined(out.details.size);
					assert.equal(out.details.description, "x");
				});

				it("migrateData does not overwrite an already populated top-level size", () => {
					const ThreatDataClass = CONFIG.Actor.dataModels.threat;
					const data = { details: { size: "small" }, size: "huge" };
					const out = ThreatDataClass.migrateData(data);
					assert.equal(out.size, "huge");
					assert.isUndefined(out.details.size);
				});
			});
		},
		{ displayName: "OP | Threat: persistence round-trips (size, creatureType, degree, ghost fields)" }
	);
});
