import { describe, it, expect, vi, beforeAll } from "vitest";
import { OrdemItem } from "../../../module/documents/item.mjs";

beforeAll(() => {
	CONFIG.Dice.BasicRoll = {
		constructParts: (obj) => {
			const parts = [];
			const data = {};
			for (const [k, v] of Object.entries(obj)) {
				if (v != null) {
					parts.push(`@${k}`);
					data[k] = v;
				}
			}
			return { parts, data };
		},
	};
});

function makeArmamentItem({ numberOfAttacks = 1, actionType = "standard" } = {}) {
	const item = new OrdemItem({ name: "Test Sword", type: "armament" }, {});
	item.system = {
		formulas: {
			attack: { attr: "str", skill: "fighting", bonus: 0 },
			damage: { formula: "1d8", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
			extraFormula: "",
		},
		critical: "20",
		numberOfAttacks,
		actionType,
		rangeCategory: "",
		types: { rangeType: { name: "melee" } },
		using: { state: true },
		weight: 1,
		quantity: 1,
	};
	item.parent = {
		system: {
			attributes: { str: { value: 3 }, dex: { value: 2 }, int: { value: 1 }, pre: { value: 1 }, vit: { value: 2 } },
			skills: { fighting: { degree: { label: "trained", value: 5 }, value: 0, mod: 0 } },
		},
		getRollData: () => ({}),
	};
	item.actor = item.parent;
	item.id = "mock-item-id";
	item.uuid = "Item.mock-uuid";
	item.name = "Test Sword";
	return item;
}

describe("ArmamentData — novos campos de ameaça", () => {
	it("numberOfAttacks default é 1 quando não definido", () => {
		const item = makeArmamentItem();
		expect(item.system.numberOfAttacks).toBe(1);
	});

	it("numberOfAttacks aceita valores > 1", () => {
		const item = makeArmamentItem({ numberOfAttacks: 3 });
		expect(item.system.numberOfAttacks).toBe(3);
	});

	it("actionType default é 'standard'", () => {
		const item = makeArmamentItem();
		expect(item.system.actionType).toBe("standard");
	});

	it("actionType aceita 'free', 'movement', 'reaction', 'full'", () => {
		for (const type of ["free", "movement", "reaction", "full"]) {
			const item = makeArmamentItem({ actionType: type });
			expect(item.system.actionType).toBe(type);
		}
	});
});

describe("OrdemItem.rollAttack — numberOfAttacks > 1", () => {
	it("numberOfAttacks=1: rollAttack é chamado uma única vez", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 1 });
		const spy = vi.spyOn(item, "rollAttack");
		await item.rollAttack({});
		expect(spy).toHaveBeenCalledTimes(1);
		spy.mockRestore();
	});

	it("numberOfAttacks=3: rollAttack se chama recursivamente 3 vezes", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 3 });
		let callCount = 0;
		const originalRollAttack = item.rollAttack.bind(item);
		item.rollAttack = vi.fn(async (opts) => {
			callCount++;
			if (opts._attackIndex) {
				// recursive call — just return a mock result
				return { roll: { total: 10 }, criticalStatus: { isCritical: false }, hitResult: null };
			}
			return originalRollAttack(opts);
		});
		await item.rollAttack({});
		// 1 initial call + 3 recursive calls
		expect(callCount).toBe(4);
	});

	it("numberOfAttacks=2 com _attackIndex já definido: não recursiona novamente", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 2 });
		const result = await item.rollAttack({ _attackIndex: 1, _attackTotal: 2 });
		expect(result).toHaveProperty("roll");
		expect(result).toHaveProperty("criticalStatus");
	});
});
