import { describe, it, expect } from "vitest";
import { calculateSpaces } from "../../../module/helpers/actor-calculations.mjs";

describe("calculateSpaces", () => {
	it("weight=0 FOR=5 no bonus: value=0 max=25 pct=0 not overweight", () => {
		const result = calculateSpaces(0, 5);
		expect(result.value).toBe(0);
		expect(result.max).toBe(25);
		expect(result.pct).toBe(0);
		expect(result.isOverweight).toBe(false);
		expect(result.isDoubleOverweight).toBe(false);
	});

	it("weight=25 FOR=5: value=25 pct=100 not overweight", () => {
		const result = calculateSpaces(25, 5);
		expect(result.value).toBe(25);
		expect(result.pct).toBe(100);
		expect(result.isOverweight).toBe(false);
	});

	it("weight=26 FOR=5: isOverweight=true over=1", () => {
		const result = calculateSpaces(26, 5);
		expect(result.isOverweight).toBe(true);
		expect(result.isDoubleOverweight).toBe(false);
		expect(result.over).toBe(1);
	});

	it("weight=51 FOR=5: isDoubleOverweight=true", () => {
		const result = calculateSpaces(51, 5);
		expect(result.isDoubleOverweight).toBe(true);
	});

	it("FOR=0: max=2", () => {
		expect(calculateSpaces(0, 0).max).toBe(2);
	});

	it("bonus increases value and max", () => {
		const result = calculateSpaces(0, 0, { value: 2, max: 3 });
		expect(result.value).toBe(2);
		expect(result.max).toBe(5);
	});
});
