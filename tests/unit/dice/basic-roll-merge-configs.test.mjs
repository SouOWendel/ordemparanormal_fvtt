import { describe, it, expect, vi } from "vitest";

vi.mock("../../../module/applications/dialog.mjs", () => ({ default: class {} }));

import BasicRoll from "../../../module/dice/basic-roll.mjs";

describe("BasicRoll.mergeConfigs", () => {
	it("merge with undefined other returns original unchanged", () => {
		const original = { parts: ["1d6"], data: { bonus: 2 }, options: { target: 10 } };
		const result = BasicRoll.mergeConfigs(original, undefined);
		expect(result).toBe(original);
		expect(result.parts).toEqual(["1d6"]);
		expect(result.data).toEqual({ bonus: 2 });
		expect(result.options).toEqual({ target: 10 });
	});

	it("merges data objects", () => {
		const original = { data: { a: 1 } };
		BasicRoll.mergeConfigs(original, { data: { b: 2 } });
		expect(original.data).toEqual({ a: 1, b: 2 });
	});

	it("unshifts other.parts before original.parts", () => {
		const original = { parts: ["1d6"] };
		BasicRoll.mergeConfigs(original, { parts: ["2d4"] });
		expect(original.parts).toEqual(["2d4", "1d6"]);
	});

	it("merges options via mergeObject", () => {
		const original = { options: { target: 10 } };
		BasicRoll.mergeConfigs(original, { options: { advantage: true } });
		expect(original.options.target).toBe(10);
		expect(original.options.advantage).toBe(true);
	});

	it("returns the original instance (mutates in place)", () => {
		const original = { parts: [], data: {} };
		const result = BasicRoll.mergeConfigs(original, { data: { x: 1 } });
		expect(result).toBe(original);
	});
});
