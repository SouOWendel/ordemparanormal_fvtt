import { describe, it, expect } from "vitest";
import { OrdemItem } from "../../../module/documents/item.mjs";

function makeItem() {
	return new OrdemItem({ name: "Test", type: "armament" }, {});
}

function makeActor(defenseValue) {
	return {
		uuid: "Actor.test-uuid",
		system: { defense: { value: defenseValue } },
	};
}

describe("OrdemItem._compareWithDefense", () => {
	it("retorna null quando targetActor é null", () => {
		const item = makeItem();
		expect(item._compareWithDefense(null, 15, { isCritical: false })).toBeNull();
	});

	it("retorna null quando targetActor é undefined", () => {
		const item = makeItem();
		expect(item._compareWithDefense(undefined, 15, { isCritical: false })).toBeNull();
	});

	it("hit = true quando rollTotal >= defense", () => {
		const item = makeItem();
		const result = item._compareWithDefense(makeActor(10), 10, { isCritical: false });
		expect(result.hit).toBe(true);
		expect(result.targetDefense).toBe(10);
	});

	it("hit = true quando rollTotal > defense", () => {
		const item = makeItem();
		const result = item._compareWithDefense(makeActor(10), 15, { isCritical: false });
		expect(result.hit).toBe(true);
	});

	it("hit = false quando rollTotal < defense", () => {
		const item = makeItem();
		const result = item._compareWithDefense(makeActor(10), 9, { isCritical: false });
		expect(result.hit).toBe(false);
		expect(result.targetDefense).toBe(10);
	});

	it("defense ausente (undefined) usa 0 — sempre acerta", () => {
		const item = makeItem();
		const actor = { uuid: "Actor.x", system: { defense: {} } };
		const result = item._compareWithDefense(actor, 1, { isCritical: false });
		expect(result.hit).toBe(true);
		expect(result.targetDefense).toBe(0);
	});

	it("isCritical propagado no resultado", () => {
		const item = makeItem();
		const result = item._compareWithDefense(makeActor(10), 20, { isCritical: true });
		expect(result.isCritical).toBe(true);
	});

	it("isCritical = false quando criticalStatus não tem isCritical", () => {
		const item = makeItem();
		const result = item._compareWithDefense(makeActor(10), 15, {});
		expect(result.isCritical).toBe(false);
	});

	it("actorUuid incluído no resultado", () => {
		const item = makeItem();
		const result = item._compareWithDefense(makeActor(10), 15, { isCritical: false });
		expect(result.actorUuid).toBe("Actor.test-uuid");
	});

	it("subtrai a penalidade de Defesa da condição ativa (desprevenido: -5)", () => {
		const item = makeItem();
		const actor = { ...makeActor(10), _activeConditionIds: () => new Set(["desprevenido"]) };
		const result = item._compareWithDefense(actor, 6, { isCritical: false });
		expect(result.targetDefense).toBe(5);
		expect(result.hit).toBe(true);
	});
});
