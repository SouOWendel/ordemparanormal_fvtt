import { describe, it, expect, vi, beforeEach } from "vitest";
import semverComp from "../../../utils/semver-compare.mjs";

describe("semverComp", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("returns true when curr is within min/max range", () => {
		expect(semverComp("1.0.0", "2.0.0", "3.0.0", { gEqMin: true, lEqMax: true })).toBe(true);
	});

	it("returns false when curr is below min", () => {
		expect(semverComp("2.0.0", "1.0.0", "3.0.0", { gEqMin: true, lEqMax: true })).toBe(false);
	});

	it("returns false when curr is above max", () => {
		expect(semverComp("1.0.0", "4.0.0", "3.0.0", { gEqMin: true, lEqMax: true })).toBe(false);
	});

	it("returns true when curr equals min and gEqMin is true", () => {
		expect(semverComp("2.0.0", "2.0.0", null, { gEqMin: true })).toBe(true);
	});

	it("returns false when curr equals min and gEqMin is false (strict less-than)", () => {
		expect(semverComp("2.0.0", "2.0.0", null, { gEqMin: false })).toBe(false);
	});

	it("returns true when curr equals max and lEqMax is true", () => {
		expect(semverComp(null, "3.0.0", "3.0.0", { lEqMax: true })).toBe(true);
	});

	it("returns true when eqMin matches curr", () => {
		expect(semverComp("2.0.0", "2.0.0", null, { eqMin: true })).toBe(true);
	});

	it("returns false when eqMin does not match curr", () => {
		expect(semverComp("2.0.0", "3.0.0", null, { eqMin: true })).toBe(false);
	});

	it("throws when both min and max are missing", () => {
		expect(() => semverComp(null, "2.0.0", null)).toThrow();
	});

	it("throws when curr is missing", () => {
		expect(() => semverComp("1.0.0", null, "3.0.0")).toThrow();
	});

	it("throws on invalid semver string", () => {
		expect(() => semverComp("abc", "2.0.0", "3.0.0")).toThrow();
	});

	it("returns true when min is null and curr is within max", () => {
		expect(semverComp(null, "2.0.0", "3.0.0", { lEqMax: true })).toBe(true);
	});

	it("returns true when max is null and curr is above min", () => {
		expect(semverComp("1.0.0", "2.0.0", null, { gEqMin: true })).toBe(true);
	});
});
