import { describe, it, expect } from "vitest";
import { calculateStatusMaxima, calculatePerRound } from "../../../module/helpers/actor-calculations.mjs";

describe("calculateStatusMaxima", () => {
	describe("fighter", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima("fighter", 2, 3, 1, false)).toEqual({
				PV_max: 22,
				PE_max: 5,
				PD_max: 0,
				SAN_max: 12,
			});
		});

		it("returns correct maxima at progress=5", () => {
			expect(calculateStatusMaxima("fighter", 2, 3, 5, false)).toEqual({
				PV_max: 46,
				PE_max: 25,
				PD_max: 0,
				SAN_max: 24,
			});
		});

		it("uses PD_max instead of PE_max when withoutSanity=true", () => {
			const result = calculateStatusMaxima("fighter", 2, 3, 5, true);
			expect(result.PD_max).toBe(33);
			expect(result.PE_max).toBe(0);
		});
	});

	describe("specialist", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima("specialist", 2, 3, 1, false)).toEqual({
				PV_max: 18,
				PE_max: 6,
				PD_max: 0,
				SAN_max: 16,
			});
		});
	});

	describe("occultist", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima("occultist", 2, 3, 1, false)).toEqual({
				PV_max: 14,
				PE_max: 7,
				PD_max: 0,
				SAN_max: 20,
			});
		});
	});

	describe("survivor", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima("survivor", 2, 3, 1, false)).toEqual({
				PV_max: 10,
				PE_max: 5,
				PD_max: 0,
				SAN_max: 8,
			});
		});
	});

	describe("unknown class", () => {
		it("returns all zeros", () => {
			expect(calculateStatusMaxima("unknown", 2, 3, 1, false)).toEqual({
				PV_max: 0,
				PE_max: 0,
				PD_max: 0,
				SAN_max: 0,
			});
		});
	});
});

describe("calculatePerRound", () => {
	it("returns PE_perRound equal to progress for non-survivor without sanity rule", () => {
		expect(calculatePerRound(false, 3, false)).toEqual({ PE_perRound: 3 });
	});

	it("returns PD_perRound=1 for survivor without sanity rule", () => {
		expect(calculatePerRound(true, 3, false)).toEqual({ PD_perRound: 1 });
	});

	it("returns PD_perRound equal to progress for non-survivor with withoutSanity=true", () => {
		expect(calculatePerRound(false, 3, true)).toEqual({ PD_perRound: 3 });
	});

	it("returns PD_perRound=1 for survivor with withoutSanity=true", () => {
		expect(calculatePerRound(true, 3, true)).toEqual({ PD_perRound: 1 });
	});
});
