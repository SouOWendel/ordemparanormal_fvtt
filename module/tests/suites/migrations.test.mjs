import { migrateActorData } from "../../migrations.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.migrations",
		(context) => {
			const { describe, it, assert } = context;

			function fakeActor(systemOverrides = {}, version = "6.0.0", items = []) {
				return {
					items,
					_stats: { systemVersion: version },
					system: {
						class: "",
						skills: {},
						...systemOverrides,
					},
				};
			}

			// ----------------------------------------------------------------
			// Gate < 6.3.1 — class name localisation
			// ----------------------------------------------------------------
			describe("migrateActorData < 6.3.1 — class names", () => {
				const cases = [
					{ from: "Combatente", to: "fighter" },
					{ from: "Especialista", to: "specialist" },
					{ from: "Ocultista", to: "occultist" },
				];

				for (const { from, to } of cases) {
					it(`"${from}" → "${to}"`, async () => {
						const actor = fakeActor({ class: from }, "6.0.0");
						const update = await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
						assert.equal(update["system.class"], to);
					});
				}

				it("already 'fighter' at 6.3.1 — no update", async () => {
					const actor = fakeActor({ class: "fighter" }, "6.3.1");
					const update = await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.notProperty(update, "system.class");
				});

				it("bypassVersionCheck=true forces migration even at current version", async () => {
					const actor = fakeActor({ class: "Combatente" }, "7.3.3");
					// bypassVersionCheck is flags (4th arg), not migrationData (3rd arg)
					const update = await migrateActorData(
						actor,
						{ system: actor.system, _stats: actor._stats },
						{},
						{ bypassVersionCheck: true }
					);
					assert.equal(update["system.class"], "fighter");
				});
			});

			// ----------------------------------------------------------------
			// Gate < 6.9.2 — degree string → object
			// ----------------------------------------------------------------
			describe("migrateActorData < 6.9.2 — degree migration", () => {
				it("degree as plain string → degree.label", async () => {
					const actor = fakeActor({ skills: { fighting: { degree: "trained" } } }, "6.5.0");
					const update = await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.equal(update["system.skills.fighting.degree.label"], "trained");
				});

				it("degree already an object at 6.9.2 — no update", async () => {
					const actor = fakeActor({ skills: { fighting: { degree: { label: "trained", value: 5 } } } }, "6.9.2");
					const update = await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.notProperty(update, "system.skills.fighting.degree.label");
				});

				it("multiple skills all get their degree migrated", async () => {
					const actor = fakeActor(
						{
							skills: {
								fighting: { degree: "trained" },
								aim: { degree: "veteran" },
							},
						},
						"6.0.0"
					);
					const update = await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.equal(update["system.skills.fighting.degree.label"], "trained");
					assert.equal(update["system.skills.aim.degree.label"], "veteran");
				});
			});

			// ----------------------------------------------------------------
			// Gate < 7.3.0 — image path normalisation
			// ----------------------------------------------------------------
			describe("migrateActorData < 7.3.0 — image path normalisation", () => {
				it("item with 'general%20equipments' path → normalised path (non-protection)", async () => {
					const fakeItem = {
						type: "generalEquipment",
						name: "Test Item",
						img: "systems/ordemparanormal/media/icons/general%20equipments/Faca.png",
						system: {},
						update: async (data) => {
							Object.assign(fakeItem, data);
						},
					};
					const actor = fakeActor({}, "7.0.0", [fakeItem]);
					await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.notInclude(fakeItem.img ?? "", "%20", "URL encoding should be removed");
				});

				it("protection item in 'general%20equipments' → moved to 'protections' path", async () => {
					const fakeItem = {
						type: "protection",
						name: "Test Armor",
						img: "systems/ordemparanormal/media/icons/general%20equipments/Colete.png",
						system: {},
						update: async (data) => {
							Object.assign(fakeItem, data);
						},
					};
					const actor = fakeActor({}, "7.0.0", [fakeItem]);
					await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.include(fakeItem.img ?? "", "protections", "protection item should move to protections folder");
				});

				it("accent in filename is removed and lowercased", async () => {
					const fakeItem = {
						type: "armament",
						name: "Test Weapon",
						img: "systems/ordemparanormal/media/icons/armaments/Espada Ã Lâmina.png",
						system: {},
						update: async (data) => {
							Object.assign(fakeItem, data);
						},
					};
					const actor = fakeActor({}, "7.0.0", [fakeItem]);
					await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					const img = fakeItem.img ?? "";
					assert.notMatch(img, /[A-Z]/, "filename should be lowercased");
					assert.notMatch(img, /[À-ÿ]/, "accented characters should be removed");
				});

				it("item with already-normalised path at 7.3.0 — no update", async () => {
					const originalImg = "systems/ordemparanormal/media/icons/armaments/sword.png";
					const fakeItem = {
						type: "armament",
						name: "Clean Item",
						img: originalImg,
						system: {},
						update: async () => {
							assert.fail("update should not be called");
						},
					};
					const actor = fakeActor({}, "7.3.0", [fakeItem]);
					await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
				});
			});

			// ----------------------------------------------------------------
			// Idempotency
			// ----------------------------------------------------------------
			describe("migrateActorData — idempotency", () => {
				it("running migration twice produces same result (no double-apply)", async () => {
					const actor = fakeActor({ class: "Combatente" }, "6.0.0");
					await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					actor.system.class = "fighter";
					actor._stats.systemVersion = "6.3.2";
					const update2 = await migrateActorData(actor, { system: actor.system, _stats: actor._stats }, {}, {});
					assert.notProperty(update2, "system.class");
				});
			});
		},
		{ displayName: "OP | Migrations: migrateActorData version gates" }
	);
});
