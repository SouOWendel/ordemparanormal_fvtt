import { describe, it, expect, vi } from "vitest";

vi.mock("../../../module/applications/dialog.mjs", () => ({ default: class {} }));

import BasicRoll from "../../../module/dice/basic-roll.mjs";

function makeDie(number, faces, modifiers) {
	return { number, faces, modifiers };
}

describe("BasicRoll.preCalculateTerm", () => {
	it("kh modifier, 3d20: keeps 1 die, max face → 20", () => {
		const die = makeDie(3, 20, ["kh"]);
		expect(BasicRoll.preCalculateTerm(die)).toBe(20);
	});

	it("kl modifier, 2d20, minimize=true: keeps 1 die, min face → 1", () => {
		const die = makeDie(2, 20, ["kl"]);
		expect(BasicRoll.preCalculateTerm(die, { minimize: true })).toBe(1);
	});

	it("kh2 modifier, 5d6: keeps 2 dice, max face → 12", () => {
		const die = makeDie(5, 6, ["kh2"]);
		expect(BasicRoll.preCalculateTerm(die)).toBe(12);
	});

	it("d1 modifier, 3d6, minimize=true: drops 1, keeps 2, min face → 2", () => {
		const die = makeDie(3, 6, ["d1"]);
		expect(BasicRoll.preCalculateTerm(die, { minimize: true })).toBe(2);
	});

	it("max15 modifier: returns 15 * number", () => {
		const die = makeDie(2, 20, ["max15"]);
		expect(BasicRoll.preCalculateTerm(die)).toBe(30);
	});

	it("no modifiers: returns null", () => {
		const die = makeDie(2, 6, []);
		expect(BasicRoll.preCalculateTerm(die)).toBeNull();
	});

	it("empty modifiers array: returns null", () => {
		const die = makeDie(1, 20, []);
		expect(BasicRoll.preCalculateTerm(die)).toBeNull();
	});
});
