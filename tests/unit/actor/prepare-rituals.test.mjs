import { describe, it, expect } from "vitest";
import { calculateRitualDT } from "../../../module/helpers/actor-calculations.mjs";

describe("calculateRitualDT", () => {
	it("non-survivor NEX=50 PRE=3: DT = 10 + 10 + 3 = 23", () => {
		expect(calculateRitualDT(false, 50, 3)).toBe(23);
	});

	it("non-survivor NEX=99 PRE=3: DT = 10 + 20 + 3 = 33 (NEX clamped at 99)", () => {
		expect(calculateRitualDT(false, 99, 3)).toBe(33);
	});

	it("non-survivor NEX=0 PRE=0: DT = 10", () => {
		expect(calculateRitualDT(false, 0, 0)).toBe(10);
	});

	it("survivor NEX=50 PRE=3: DT = 10 + 3 = 13 (ignores NEX)", () => {
		expect(calculateRitualDT(true, 50, 3)).toBe(13);
	});
});
