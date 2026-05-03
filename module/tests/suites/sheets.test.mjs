Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.sheets",
		(context) => {
			const { describe, it, assert } = context;

			describe("Sheet registration — correct class per actor type", () => {
				it("default sheet for 'agent' type is OrdemActorSheet", () => {
					const sheets = CONFIG.Actor.sheetClasses?.agent ?? {};
					const defaultSheet = Object.values(sheets).find((s) => s.default);
					assert.ok(defaultSheet, "no default sheet found for agent");
					assert.ok(defaultSheet.id.includes("OrdemActorSheet"), `expected OrdemActorSheet, got ${defaultSheet.id}`);
				});

				it("default sheet for 'threat' type is OrdemThreatSheet", () => {
					const sheets = CONFIG.Actor.sheetClasses?.threat ?? {};
					const defaultSheet = Object.values(sheets).find((s) => s.default);
					assert.ok(defaultSheet, "no default sheet found for threat");
					assert.ok(defaultSheet.id.includes("OrdemThreatSheet"), `expected OrdemThreatSheet, got ${defaultSheet.id}`);
				});

				it("default sheet for item type 'armament' is OrdemItemSheet", () => {
					const sheets = CONFIG.Item.sheetClasses?.armament ?? {};
					const defaultSheet = Object.values(sheets).find((s) => s.default);
					assert.ok(defaultSheet, "no default sheet found for armament");
					assert.ok(defaultSheet.id.includes("OrdemItemSheet"), `expected OrdemItemSheet, got ${defaultSheet.id}`);
				});

				it("CONFIG.Actor.dataModels.agent is AgentData", () => {
					assert.ok(CONFIG.Actor.dataModels.agent, "AgentData not registered");
					assert.equal(CONFIG.Actor.dataModels.agent.name, "AgentData");
				});

				it("CONFIG.Actor.dataModels.threat is ThreatData", () => {
					assert.ok(CONFIG.Actor.dataModels.threat, "ThreatData not registered");
					assert.equal(CONFIG.Actor.dataModels.threat.name, "ThreatData");
				});

				it("all 6 item types are registered in CONFIG.Item.dataModels", () => {
					const expected = ["ammunition", "armament", "generalEquipment", "protection", "ability", "ritual"];
					for (const type of expected) {
						assert.ok(CONFIG.Item.dataModels[type], `${type} not registered`);
					}
				});

				it("CONFIG.ActiveEffect.legacyTransferral is false (v13 critical — allApplicableEffects required)", () => {
					assert.isFalse(CONFIG.ActiveEffect.legacyTransferral);
				});
			});
		},
		{ displayName: "OP | Sheets: registration & dataModels" }
	);
});
