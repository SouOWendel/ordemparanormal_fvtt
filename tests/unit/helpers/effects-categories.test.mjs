import { describe, it, expect } from "vitest";
import { prepareActiveEffectCategories } from "../../../module/helpers/effects.mjs";

describe("prepareActiveEffectCategories", () => {
	it("returns empty effects arrays for all categories when given an empty array", () => {
		const result = prepareActiveEffectCategories([]);
		expect(result.temporary.effects).toEqual([]);
		expect(result.passive.effects).toEqual([]);
		expect(result.inactive.effects).toEqual([]);
	});

	it("places a disabled effect into the inactive category", () => {
		const effect = { disabled: true, isTemporary: false, sort: 0 };
		const result = prepareActiveEffectCategories([effect]);
		expect(result.inactive.effects).toContain(effect);
		expect(result.temporary.effects).toHaveLength(0);
		expect(result.passive.effects).toHaveLength(0);
	});

	it("places a non-disabled temporary effect into the temporary category", () => {
		const effect = { disabled: false, isTemporary: true, sort: 0 };
		const result = prepareActiveEffectCategories([effect]);
		expect(result.temporary.effects).toContain(effect);
		expect(result.passive.effects).toHaveLength(0);
		expect(result.inactive.effects).toHaveLength(0);
	});

	it("places a non-disabled non-temporary effect into the passive category", () => {
		const effect = { disabled: false, isTemporary: false, sort: 0 };
		const result = prepareActiveEffectCategories([effect]);
		expect(result.passive.effects).toContain(effect);
		expect(result.temporary.effects).toHaveLength(0);
		expect(result.inactive.effects).toHaveLength(0);
	});

	it("sorts effects within each category by sort value ascending", () => {
		const effects = [
			{ disabled: false, isTemporary: false, sort: 10, id: "b" },
			{ disabled: false, isTemporary: false, sort: 5, id: "a" },
			{ disabled: true, isTemporary: false, sort: 20, id: "d" },
			{ disabled: true, isTemporary: false, sort: 3, id: "c" },
		];
		const result = prepareActiveEffectCategories(effects);
		expect(result.passive.effects[0].id).toBe("a");
		expect(result.passive.effects[1].id).toBe("b");
		expect(result.inactive.effects[0].id).toBe("c");
		expect(result.inactive.effects[1].id).toBe("d");
	});
});
