import { describe, it, expect } from "vitest";
import { calculateStatusMaxima, calculatePerRound } from "../../../module/helpers/actor-calculations.mjs";

const fighterStats = {
	hpInitial: 20,
	hpPerLevel: 4,
	peInitial: 2,
	pePerLevel: 2,
	pdInitial: 2,
	pdPerLevel: 4,
	sanInitial: 12,
	sanPerLevel: 3,
};

const specialistStats = {
	hpInitial: 16,
	hpPerLevel: 3,
	peInitial: 3,
	pePerLevel: 3,
	pdInitial: 3,
	pdPerLevel: 3,
	sanInitial: 16,
	sanPerLevel: 4,
};

const occultistStats = {
	hpInitial: 12,
	hpPerLevel: 2,
	peInitial: 4,
	pePerLevel: 4,
	pdInitial: 4,
	pdPerLevel: 4,
	sanInitial: 20,
	sanPerLevel: 5,
};

const survivorStats = {
	hpInitial: 8,
	hpPerLevel: 2,
	peInitial: 2,
	pePerLevel: 2,
	pdInitial: 2,
	pdPerLevel: 2,
	sanInitial: 8,
	sanPerLevel: 2,
};

describe("calculateStatusMaxima", () => {
	describe("fighter", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima(2, 3, 1, false, fighterStats)).toEqual({
				PV_max: 22,
				PE_max: 5,
				PD_max: 0,
				SAN_max: 12,
			});
		});

		it("returns correct maxima at progress=5", () => {
			expect(calculateStatusMaxima(2, 3, 5, false, fighterStats)).toEqual({
				PV_max: 46,
				PE_max: 25,
				PD_max: 0,
				SAN_max: 24,
			});
		});

		it("returns the expected derived maxima at progress=3 with VIG 3 and PRE 1", () => {
			expect(calculateStatusMaxima(3, 1, 3, false, fighterStats)).toEqual({
				PV_max: 37,
				PE_max: 9,
				PD_max: 0,
				SAN_max: 18,
			});
		});

		it("uses PD_max instead of PE_max when withoutSanity=true", () => {
			const result = calculateStatusMaxima(2, 3, 5, true, fighterStats);

			expect(result.PD_max).toBe(33);
			expect(result.PE_max).toBe(0);
		});

		it("falls back to PE class values when PD class values are unavailable", () => {
			const classStatsWithoutPD = {
				hpInitial: 20,
				hpPerLevel: 4,
				peInitial: 2,
				pePerLevel: 2,
				sanInitial: 12,
				sanPerLevel: 3,
			};

			// PD_max is calculated using only presence attribute.
			expect(calculateStatusMaxima(2, 3, 5, true, classStatsWithoutPD)).toEqual({
				PV_max: 46,
				PE_max: 0,
				PD_max: 15,
				SAN_max: 24,
			});
		});
	});

	describe("specialist", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima(2, 3, 1, false, specialistStats)).toEqual({
				PV_max: 18,
				PE_max: 6,
				PD_max: 0,
				SAN_max: 16,
			});
		});
	});

	describe("occultist", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima(2, 3, 1, false, occultistStats)).toEqual({
				PV_max: 14,
				PE_max: 7,
				PD_max: 0,
				SAN_max: 20,
			});
		});
	});

	describe("survivor", () => {
		it("returns correct maxima at progress=1", () => {
			expect(calculateStatusMaxima(2, 3, 1, false, survivorStats)).toEqual({
				PV_max: 10,
				PE_max: 5,
				PD_max: 0,
				SAN_max: 8,
			});
		});
	});

	describe("without class data", () => {
		it("returns all zeros", () => {
			expect(calculateStatusMaxima(2, 3, 1, false, null)).toEqual({
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
