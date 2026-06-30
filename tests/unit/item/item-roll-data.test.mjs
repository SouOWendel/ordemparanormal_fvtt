import { describe, it, expect } from "vitest";
import { OrdemItem } from "../../../module/documents/item.mjs";

function makeItem(actorOverride = null, systemOverride = {}) {
	const item = new OrdemItem({}, {});
	item.actor = actorOverride;
	item.system = systemOverride;
	return item;
}

// ─── getRollData ─────────────────────────────────────────────────────────────

describe("OrdemItem.getRollData — sem ator", () => {
	it("não lança exceção quando actor é null", () => {
		const item = makeItem(null);
		expect(() => item.getRollData()).not.toThrow();
	});

	it("retorna objeto (resultado de super.getRollData) quando actor é null", () => {
		const item = makeItem(null);
		const data = item.getRollData();
		expect(typeof data).toBe("object");
		expect(data).not.toBeNull();
	});
});

describe("OrdemItem.getRollData — com ator mockado", () => {
	it("inclui rollData do ator no retorno", () => {
		const mockActor = {
			getRollData: () => ({ attributes: { str: { value: 3 } }, NEX: { value: 25 } }),
		};
		const item = makeItem(mockActor, { description: "espada" });
		const data = item.getRollData();
		expect(data.attributes).toEqual({ str: { value: 3 } });
		expect(data.NEX).toEqual({ value: 25 });
	});

	it("inclui sistema do item sob a chave 'item'", () => {
		const mockActor = { getRollData: () => ({}) };
		const system = { damage: { formula: "1d8" }, weight: 2 };
		const item = makeItem(mockActor, system);
		const data = item.getRollData();
		expect(data.item).toEqual(system);
	});

	it("item é deepClone — mutação do retorno não afeta this.system", () => {
		const mockActor = { getRollData: () => ({}) };
		const system = { damage: { formula: "1d8" } };
		const item = makeItem(mockActor, system);
		const data = item.getRollData();
		data.item.damage.formula = "99d99";
		expect(item.system.damage.formula).toBe("1d8");
	});
});

// ─── isCritical — edge cases não cobertos pelo teste existente ────────────────

describe("OrdemItem.isCritical — edge cases", () => {
	it("fórmula vazia: usa defaults — multiplier = 2, margin = 20, isCritical = true para roll 20", () => {
		const item = makeItem();
		const critical = { isCritical: false, crtalFormula: "", roll: { result: "20" } };
		item.isCritical(critical);
		expect(critical.multiplier).toBe(2);
		expect(critical.margin).toBe(20);
		expect(critical.isCritical).toBe(true);
	});

	it("fórmula vazia: isCritical = false para roll abaixo de 20", () => {
		const item = makeItem();
		const critical = { isCritical: false, crtalFormula: "", roll: { result: "15" } };
		item.isCritical(critical);
		expect(critical.isCritical).toBe(false);
	});

	it("fórmula null: não lança exceção (guarda de null)", () => {
		const item = makeItem();
		const critical = { isCritical: false, crtalFormula: null, roll: { result: "20" } };
		expect(() => item.isCritical(critical)).not.toThrow();
	});

	it("fórmula null: usa defaults — multiplier = 2, margin = 20", () => {
		const item = makeItem();
		const critical = { isCritical: false, crtalFormula: null, roll: { result: "20" } };
		item.isCritical(critical);
		expect(critical.multiplier).toBe(2);
		expect(critical.margin).toBe(20);
	});

	it("roll.result = '20' com margem default 20: isCritical = true", () => {
		const item = makeItem();
		const critical = { isCritical: false, crtalFormula: "20", roll: { result: "20" } };
		item.isCritical(critical);
		expect(critical.isCritical).toBe(true);
	});

	it("roll.result = '19' com margem 20: isCritical = false", () => {
		const item = makeItem();
		const critical = { isCritical: false, crtalFormula: "20", roll: { result: "19" } };
		item.isCritical(critical);
		expect(critical.isCritical).toBe(false);
	});
});
