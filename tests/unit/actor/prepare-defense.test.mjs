import { describe, it, expect } from "vitest";
import { calculateDefense } from "../../../module/helpers/actor-calculations.mjs";

describe("calculateDefense", () => {
	it("base=10 AGI=3 degree=5 mod=2: value=13 dodge=20", () => {
		expect(calculateDefense(10, 3, 5, 2)).toEqual({ value: 13, dodge: 20 });
	});

	it("base=10 AGI=0 degree=0 mod=0: value=10 dodge=10", () => {
		expect(calculateDefense(10, 0, 0, 0)).toEqual({ value: 10, dodge: 10 });
	});

	it("uses default mod=0 when not provided", () => {
		expect(calculateDefense(10, 3, 5)).toEqual({ value: 13, dodge: 18 });
	});
});
