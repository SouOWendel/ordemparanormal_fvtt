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

describe("OrdemItem.rollVolleyDamage — dano por-ataque (multi-ataque)", () => {
	it("rola uma vez por ataque que ACERTOU; dobra só os que critaram; pula miss e pendente", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 4 });
		item.system.critical = "20"; // x2
		const calls = [];
		item.rollDamage = vi.fn(async (opts) => {
			calls.push(opts);
			return { formula: `mock${calls.length}` };
		});
		const attackResults = [
			{ hit: true, isCritical: true, revealed: true, actorUuid: "uuidA", attackMessageId: "m1", attackIndex: 1 },
			{ hit: true, isCritical: false, revealed: true, actorUuid: "uuidA", attackMessageId: "m2", attackIndex: 2 },
			{ hit: false, isCritical: true, revealed: true, actorUuid: "uuidA", attackMessageId: "m3", attackIndex: 3 }, // miss → pula
			{ hit: true, isCritical: false, revealed: false, actorUuid: "uuidA", attackMessageId: "m4", attackIndex: 4 }, // pendente → pula
		];
		const rolls = await item.rollVolleyDamage(attackResults, { event: {} });
		expect(rolls).toHaveLength(2); // só os 2 hits revelados
		expect(calls).toHaveLength(2);
		// ataque #1: crítico → multiplier vem da fórmula
		expect(calls[0].critical).toEqual({ isCritical: true, multiplier: 2 });
		expect(calls[0].hitResult.actorUuid).toBe("uuidA");
		expect(calls[0].hitResult.attackMessageId).toBe("m1");
		expect(calls[0].lastId).toBe(true);
		// ataque #2: normal → sem multiplicação
		expect(calls[1].critical).toBe(false);
		expect(calls[1].hitResult.actorUuid).toBe("uuidA");
	});

	it("um crítico em x4 dobra SÓ aquele ataque (1 crit + 3 normais)", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 4 });
		item.system.critical = "20";
		const crits = [];
		item.rollDamage = vi.fn(async (opts) => {
			crits.push(opts.critical?.isCritical === true);
			return {};
		});
		const attackResults = [
			{ hit: true, isCritical: true, revealed: true, actorUuid: "a" },
			{ hit: true, isCritical: false, revealed: true, actorUuid: "a" },
			{ hit: true, isCritical: false, revealed: true, actorUuid: "a" },
			{ hit: true, isCritical: false, revealed: true, actorUuid: "a" },
		];
		await item.rollVolleyDamage(attackResults, { event: {} });
		expect(crits).toEqual([true, false, false, false]);
	});

	it("recupera multiplicador x3/x4 da fórmula de crítico", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 2 });
		item.system.critical = "19/x3";
		const calls = [];
		item.rollDamage = vi.fn(async (opts) => {
			calls.push(opts);
			return {};
		});
		await item.rollVolleyDamage([{ hit: true, isCritical: true, revealed: true, actorUuid: "a" }], { event: {} });
		expect(calls[0].critical).toEqual({ isCritical: true, multiplier: 3 });
	});

	it("nenhum acerto → nenhuma rolagem", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 2 });
		item.rollDamage = vi.fn(async () => ({}));
		const rolls = await item.rollVolleyDamage([{ hit: false, isCritical: true, revealed: true }], { event: {} });
		expect(rolls).toHaveLength(0);
		expect(item.rollDamage).not.toHaveBeenCalled();
	});

	it("attackResults vazio/undefined → sem rolagem e sem crash", async () => {
		const item = makeArmamentItem();
		item.rollDamage = vi.fn(async () => ({}));
		expect(await item.rollVolleyDamage(undefined, {})).toEqual([]);
		expect(await item.rollVolleyDamage([], {})).toEqual([]);
		expect(item.rollDamage).not.toHaveBeenCalled();
	});

	it("roteia cada ataque para o alvo que ele acertou (multi-alvo)", async () => {
		const item = makeArmamentItem({ numberOfAttacks: 2 });
		item.system.critical = "20";
		const targets = [];
		item.rollDamage = vi.fn(async (opts) => {
			targets.push(opts.hitResult.actorUuid);
			return {};
		});
		await item.rollVolleyDamage(
			[
				{ hit: true, isCritical: false, revealed: true, actorUuid: "alvoA" },
				{ hit: true, isCritical: false, revealed: true, actorUuid: "alvoB" },
			],
			{ event: {} }
		);
		expect(targets).toEqual(["alvoA", "alvoB"]);
	});
});
