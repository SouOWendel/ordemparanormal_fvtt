import { describe, it, expect } from "vitest";
import { op } from "../../../module/helpers/config.mjs";

describe("op config structure", () => {
	it("op.attributes has exactly the keys: dex, int, vit, pre, str", () => {
		expect(Object.keys(op.attributes)).toEqual(["dex", "int", "vit", "pre", "str"]);
	});

	it("op.skills has exactly 28 entries", () => {
		expect(Object.keys(op.skills)).toHaveLength(28);
	});

	it("op.dropdownClass has exactly the keys: fighter, specialist, occultist, survivor", () => {
		expect(Object.keys(op.dropdownClass)).toEqual(["fighter", "specialist", "occultist", "survivor"]);
	});

	it("op.dropdownDegree has keys: untrained, trained, veteran, expert", () => {
		expect(Object.keys(op.dropdownDegree)).toEqual(["untrained", "trained", "veteran", "expert"]);
	});

	it("op.dropdownDamageType has at least 10 entries", () => {
		expect(Object.keys(op.dropdownDamageType).length).toBeGreaterThanOrEqual(10);
	});

	it('all values in op.skills are strings starting with "op.skill."', () => {
		for (const value of Object.values(op.skills)) {
			expect(typeof value).toBe("string");
			expect(value.startsWith("op.skill.")).toBe(true);
		}
	});

	it('all values in op.attributes are strings starting with "op.att"', () => {
		for (const value of Object.values(op.attributes)) {
			expect(typeof value).toBe("string");
			expect(value.startsWith("op.att")).toBe(true);
		}
	});
});
