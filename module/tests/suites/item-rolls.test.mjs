// Use CONFIG.Item.documentClass instead of a direct import so the test
// always targets the registered document class, resilient to class renames.
Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.item.rolls",
		(context) => {
			const { describe, it, assert, before, after } = context;

			describe("OrdemItem.isCritical() — formula parsing", () => {
				let item;

				before(async () => {
					item = await Item.create({ name: "[Quench] Test Armament", type: "armament" });
				});

				after(async () => {
					await item?.delete();
				});

				it("formula '20', result 20 → isCritical: true", () => {
					const result = item.isCritical({ crtalFormula: "20", roll: { result: "20" } });
					assert.isTrue(result.isCritical);
				});

				it("formula '20', result 19 → isCritical: false", () => {
					const result = item.isCritical({ crtalFormula: "20", roll: { result: "19" } });
					assert.isFalse(result.isCritical);
				});

				it("formula '19/x3' → margin=19, multiplier=3", () => {
					const result = item.isCritical({ crtalFormula: "19/x3", roll: { result: "19" } });
					assert.equal(result.margin, 19);
					assert.equal(result.multiplier, 3);
					assert.isTrue(result.isCritical);
				});

				it("formula '19/x3', result 18 → isCritical: false", () => {
					const result = item.isCritical({ crtalFormula: "19/x3", roll: { result: "18" } });
					assert.isFalse(result.isCritical);
				});

				it("formula 'x2' only → multiplier=2, default margin=20", () => {
					const result = item.isCritical({ crtalFormula: "x2", roll: { result: "20" } });
					assert.equal(result.multiplier, 2);
					assert.equal(result.margin, 20);
				});
			});

			describe("OrdemItem.getRollData() — null regression (GAP 6)", () => {
				it("unowned item getRollData() returns object, not null", () => {
					const OrdemItem = CONFIG.Item.documentClass;
					const item = new OrdemItem({ name: "Unowned", type: "armament" });
					const data = item.getRollData();
					assert.isNotNull(data);
					assert.isObject(data);
				});
			});

			describe("OrdemItem.getRollData() — owned item", () => {
				let actor;
				let item;

				before(async () => {
					actor = await Actor.create({ name: "[Quench] Test Actor For Item", type: "agent" });
					const [created] = await actor.createEmbeddedDocuments("Item", [
						{ name: "[Quench] Owned Armament", type: "armament" },
					]);
					item = created;
				});

				after(async () => {
					await actor?.delete();
				});

				it("owned item getRollData() contains item system data", () => {
					const data = item.getRollData();
					assert.isObject(data);
					assert.property(data, "item");
				});
			});
		},
		{ displayName: "OP | Item: isCritical & getRollData" }
	);
});
