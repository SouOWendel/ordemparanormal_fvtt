import { describe, it, expect } from "vitest";
import { listCounterAttackWeapons } from "../../../module/helpers/reactions.mjs";

function makeWeapon({ id, name = "Weapon", equipped = true, melee = true } = {}) {
	return {
		id,
		name,
		type: "armament",
		system: {
			using: { state: equipped },
			types: { rangeType: { name: melee ? "melee" : "ranged" } },
			formulas: { attack: { skill: melee ? "fighting" : "aim" } },
		},
	};
}

function makeNonArmament(id) {
	return { id, type: "generalEquipment", system: { using: { state: true } } };
}

function makeDefender(items) {
	return { items: { contents: items } };
}

describe("listCounterAttackWeapons", () => {
	it("retorna apenas armamentos equipados corpo a corpo", () => {
		const w1 = makeWeapon({ id: "1", name: "Faca" });
		const w2 = makeWeapon({ id: "2", name: "Espada" });
		const ranged = makeWeapon({ id: "3", name: "Pistola", melee: false });
		const unequipped = makeWeapon({ id: "4", name: "Machado", equipped: false });
		const equip = makeNonArmament("5");

		const result = listCounterAttackWeapons(makeDefender([w1, w2, ranged, unequipped, equip]));
		expect(result.map((w) => w.id)).toEqual(["1", "2"]);
	});

	it("retorna lista vazia quando defensor não tem armas elegíveis", () => {
		const ranged = makeWeapon({ id: "1", melee: false });
		expect(listCounterAttackWeapons(makeDefender([ranged]))).toEqual([]);
	});

	it("retorna vazio quando defender é null/undefined", () => {
		expect(listCounterAttackWeapons(null)).toEqual([]);
		expect(listCounterAttackWeapons(undefined)).toEqual([]);
	});

	it("aceita defender.items como array (não Collection)", () => {
		const w = makeWeapon({ id: "1" });
		expect(listCounterAttackWeapons({ items: [w] }).map((x) => x.id)).toEqual(["1"]);
	});

	it("usa fallback de skill='fighting' quando rangeType está vazio", () => {
		const w = {
			id: "x",
			type: "armament",
			system: {
				using: { state: true },
				types: { rangeType: { name: "" } },
				formulas: { attack: { skill: "fighting" } },
			},
		};
		expect(listCounterAttackWeapons(makeDefender([w])).map((i) => i.id)).toEqual(["x"]);
	});
});
