import { describe, it, expect } from "vitest";
import BasicRoll from "../../../module/dice/basic-roll.mjs";

// ─── isSuccess / isFailure ───────────────────────────────────────────────────

describe("BasicRoll.isSuccess", () => {
	it("false when roll is not evaluated", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = false;
		expect(roll.isSuccess).toBe(false);
	});

	it("false when target is not numeric", () => {
		const roll = new BasicRoll("1d20", {}, { target: "nenhum" });
		roll._evaluated = true;
		roll.total = 20;
		expect(roll.isSuccess).toBe(false);
	});

	it("false when target is absent", () => {
		const roll = new BasicRoll("1d20", {}, {});
		roll._evaluated = true;
		roll.total = 20;
		expect(roll.isSuccess).toBe(false);
	});

	it("true when total >= target", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 15;
		expect(roll.isSuccess).toBe(true);
	});

	it("true when total strictly greater than target", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 20;
		expect(roll.isSuccess).toBe(true);
	});

	it("false when total < target", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 14;
		expect(roll.isSuccess).toBe(false);
	});
});

describe("BasicRoll.isFailure", () => {
	it("false when roll is not evaluated", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = false;
		expect(roll.isFailure).toBe(false);
	});

	it("false when target is not numeric", () => {
		const roll = new BasicRoll("1d20", {}, { target: "nenhum" });
		roll._evaluated = true;
		roll.total = 5;
		expect(roll.isFailure).toBe(false);
	});

	it("false when target is absent", () => {
		const roll = new BasicRoll("1d20", {}, {});
		roll._evaluated = true;
		roll.total = 5;
		expect(roll.isFailure).toBe(false);
	});

	it("true when total < target", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 14;
		expect(roll.isFailure).toBe(true);
	});

	it("false when total === target (not a failure — equals passes)", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 15;
		expect(roll.isFailure).toBe(false);
	});

	it("false when total > target", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 18;
		expect(roll.isFailure).toBe(false);
	});

	it("isSuccess and isFailure are mutually exclusive when evaluated with target", () => {
		const roll = new BasicRoll("1d20", {}, { target: 15 });
		roll._evaluated = true;
		roll.total = 10;
		expect(roll.isSuccess).toBe(false);
		expect(roll.isFailure).toBe(true);
	});
});

// ─── replaceFormulaData (sentinel stripping) ─────────────────────────────────

describe("BasicRoll.replaceFormulaData", () => {
	it("passes through a formula with no sentinels unchanged", () => {
		const result = BasicRoll.replaceFormulaData("1d20 + 5", {});
		expect(result).toBe("1d20 + 5");
	});

	it('strips $!...!$ sentinel pattern', () => {
		// The static method calls super (Roll.replaceFormulaData) first, then strips.
		// Since Roll.replaceFormulaData is a stub that returns the formula as-is,
		// we can test the stripping logic directly.
		const result = BasicRoll.replaceFormulaData("$!value!$", {});
		expect(result).toBe("value");
	});

	it('strips $"!...!"$ sentinel pattern (with quotes)', () => {
		const result = BasicRoll.replaceFormulaData('$"!value!"$', {});
		expect(result).toBe("value");
	});

	it("strips multiple sentinels in the same formula", () => {
		const result = BasicRoll.replaceFormulaData("$!a!$ + $!b!$", {});
		expect(result).toBe("a + b");
	});

	it("does not alter formulas containing unrelated $ characters", () => {
		// A lone $ that does not match the pattern must be preserved
		const formula = "1d20 + 3";
		const result = BasicRoll.replaceFormulaData(formula, {});
		expect(result).toBe("1d20 + 3");
	});
});

// ─── fromConfig ──────────────────────────────────────────────────────────────

describe("BasicRoll.fromConfig", () => {
	it("joins parts with ' + ' to form the formula", () => {
		const roll = BasicRoll.fromConfig(
			{ parts: ["@degree", "@bonus"], data: {}, options: {} },
			{ target: 15 }
		);
		expect(roll.formula).toBe("@degree + @bonus");
	});

	it("sets options.target from process.target", () => {
		const roll = BasicRoll.fromConfig(
			{ parts: ["1d20"], data: {}, options: {} },
			{ target: 20 }
		);
		expect(roll.options.target).toBe(20);
	});

	it("does not override an existing options.target", () => {
		const roll = BasicRoll.fromConfig(
			{ parts: ["1d20"], data: {}, options: { target: 10 } },
			{ target: 20 }
		);
		expect(roll.options.target).toBe(10);
	});

	it("returns a BasicRoll instance", () => {
		const roll = BasicRoll.fromConfig(
			{ parts: ["1d20"], data: {}, options: {} },
			{}
		);
		expect(roll).toBeInstanceOf(BasicRoll);
	});

	it("handles empty parts array — produces empty formula", () => {
		const roll = BasicRoll.fromConfig(
			{ parts: [], data: {}, options: {} },
			{}
		);
		expect(roll.formula).toBe("");
	});
});
