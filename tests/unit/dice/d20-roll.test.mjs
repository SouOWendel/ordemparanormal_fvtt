import { describe, it, expect, beforeEach } from "vitest";
import D20Roll from "../../../module/dice/d20-roll.mjs";
import D20Die from "../../../module/dice/d20-die.mjs";

// Wire up CONFIG after import so D20Die/D20Roll reference the real classes
CONFIG.Dice.D20Die = D20Die;
CONFIG.Dice.D20Roll = D20Roll;

const ADV = D20Roll.ADV_MODE;

/**
 * Build a D20Roll with a real D20Die in terms[0].
 * The mock Roll base class leaves terms=[] so we must seed it manually.
 */
function makeRoll(formula = "1d20", data = {}, options = {}) {
	const roll = new D20Roll(formula, data, options);
	if (!roll.terms[0]) {
		roll.terms[0] = new D20Die({ number: 1, faces: 20 });
	}
	return roll;
}

// ─── fromRoll ────────────────────────────────────────────────────────────────

describe("D20Roll.fromRoll", () => {
	it("preserves formula, data and options from source roll", () => {
		const source = makeRoll("1d20 + 5", { bonus: 5 }, { advantageMode: ADV.NORMAL });
		const copy = D20Roll.fromRoll(source);
		expect(copy.formula).toBe(source.formula);
		expect(copy.data).toEqual(source.data);
		expect(copy.options.advantageMode).toBe(ADV.NORMAL);
	});

	it("returns a D20Roll instance, not the original class", () => {
		const source = makeRoll("1d20");
		const copy = D20Roll.fromRoll(source);
		expect(copy).toBeInstanceOf(D20Roll);
	});

	it("copies over extra properties assigned to the source roll", () => {
		const source = makeRoll("1d20");
		source._evaluated = true;
		const copy = D20Roll.fromRoll(source);
		expect(copy._evaluated).toBe(true);
	});
});

// ─── hasAdvantage / hasDisadvantage ──────────────────────────────────────────

describe("D20Roll.hasAdvantage", () => {
	it("true when advantageMode = ADVANTAGE", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.ADVANTAGE, configured: true });
		expect(roll.hasAdvantage).toBe(true);
	});

	it("false when advantageMode = NORMAL", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.NORMAL, configured: true });
		expect(roll.hasAdvantage).toBe(false);
	});

	it("false when advantageMode = DISADVANTAGE", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.DISADVANTAGE, configured: true });
		expect(roll.hasAdvantage).toBe(false);
	});
});

describe("D20Roll.hasDisadvantage", () => {
	it("true when advantageMode = DISADVANTAGE", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.DISADVANTAGE, configured: true });
		expect(roll.hasDisadvantage).toBe(true);
	});

	it("false when advantageMode = NORMAL", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.NORMAL, configured: true });
		expect(roll.hasDisadvantage).toBe(false);
	});

	it("false when advantageMode = ADVANTAGE", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.ADVANTAGE, configured: true });
		expect(roll.hasDisadvantage).toBe(false);
	});
});

// ─── isKeepHighest ───────────────────────────────────────────────────────────

describe("D20Roll.isKeepHighest", () => {
	it("true when terms[0].modifiers includes 'kh'", () => {
		const roll = makeRoll("1d20", {}, { configured: true });
		roll.terms[0].modifiers = ["kh"];
		expect(roll.isKeepHighest).toBe(true);
	});

	it("false when terms[0].modifiers does not include 'kh'", () => {
		const roll = makeRoll("1d20", {}, { configured: true });
		roll.terms[0].modifiers = ["kl"];
		expect(roll.isKeepHighest).toBe(false);
	});

	it("false when modifiers is empty", () => {
		const roll = makeRoll("1d20", {}, { configured: true });
		roll.terms[0].modifiers = [];
		expect(roll.isKeepHighest).toBe(false);
	});
});

// ─── attribute getter ────────────────────────────────────────────────────────

describe("D20Roll.attribute", () => {
	it("returns data.attributes[data.attributeId] when data is populated", () => {
		const roll = makeRoll("1d20", {
			attributes: { str: { value: 3 } },
			attributeId: "str",
		}, { configured: true });
		expect(roll.attribute).toEqual({ value: 3 });
	});

	it("returns { value: 1 } when data is empty object", () => {
		const roll = makeRoll("1d20", {}, { configured: true });
		expect(roll.attribute).toEqual({ value: 1 });
	});

	it("returns undefined when data has attributes but no attributeId", () => {
		// isEmpty({attributes:...}) = false, so it tries data.attributes[undefined] = undefined
		const roll = makeRoll("1d20", { attributes: { str: { value: 2 } } }, { configured: true });
		expect(roll.attribute).toBeUndefined();
	});
});

// ─── configureModifiers ──────────────────────────────────────────────────────
// Note: makeRoll inserts terms[0] AFTER construction, so for tests that call
// configureModifiers manually we always pass configured:true to skip the
// constructor call, then set configured:false and invoke manually.

describe("D20Roll.configureModifiers", () => {
	function makeConfigured(data = {}, opts = {}) {
		const roll = makeRoll("1d20", data, { ...opts, configured: true });
		roll.options.configured = false;
		return roll;
	}

	it("sets d20.number from attribute.value", () => {
		const roll = makeConfigured(
			{ attributes: { dex: { value: 3 } }, attributeId: "dex" }
		);
		roll.configureModifiers();
		expect(roll.d20.number).toBe(3);
	});

	it("resolves ADVANTAGE from options.advantage flag", () => {
		const roll = makeConfigured({}, { advantage: true });
		delete roll.options.advantageMode;
		roll.configureModifiers();
		expect(roll.options.advantageMode).toBe(ADV.ADVANTAGE);
	});

	it("resolves DISADVANTAGE from options.disadvantage flag", () => {
		const roll = makeConfigured({}, { disadvantage: true });
		delete roll.options.advantageMode;
		roll.configureModifiers();
		expect(roll.options.advantageMode).toBe(ADV.DISADVANTAGE);
	});

	it("resolves NORMAL when neither advantage nor disadvantage", () => {
		const roll = makeConfigured();
		delete roll.options.advantageMode;
		roll.configureModifiers();
		expect(roll.options.advantageMode).toBe(ADV.NORMAL);
	});

	it("marks options.configured = true after running", () => {
		const roll = makeConfigured();
		roll.configureModifiers();
		expect(roll.options.configured).toBe(true);
	});

	it("propagates criticalSuccess threshold to d20.options", () => {
		const roll = makeConfigured({}, { criticalSuccess: 19 });
		roll.configureModifiers();
		expect(roll.d20.options.criticalSuccess).toBe(19);
	});

	it("propagates criticalFailure threshold to d20.options", () => {
		const roll = makeConfigured({}, { criticalFailure: 2 });
		roll.configureModifiers();
		expect(roll.d20.options.criticalFailure).toBe(2);
	});

	it("constructor skips configureModifiers when options.configured is already true", () => {
		// Build with configured=true — constructor skips configureModifiers.
		// d20.number stays at the D20Die default (1), not overridden by attribute.
		const roll = makeRoll("1d20", {
			attributes: { str: { value: 4 } },
			attributeId: "str",
		}, { configured: true });
		expect(roll.d20.number).toBe(1);
	});
});

// ─── _prepareMessageData ─────────────────────────────────────────────────────

describe("D20Roll._prepareMessageData", () => {
	beforeEach(() => {
		game.i18n.localize = (key) => key;
	});

	it("appends Advantage label when all valid rolls have advantage", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.ADVANTAGE, configured: true });
		roll._evaluated = true;
		roll.terms[0].modifiers = ["kh"];
		roll.terms[0]._evaluated = true;
		roll.terms[0].results = [{ result: 15 }];
		const messageData = { flavor: "Luta" };
		D20Roll._prepareMessageData([roll], messageData);
		expect(messageData.flavor).toContain("op.Advantage");
	});

	it("appends Disadvantage label when all valid rolls have disadvantage", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.DISADVANTAGE, configured: true });
		roll._evaluated = true;
		roll.terms[0].modifiers = ["kl"];
		roll.terms[0]._evaluated = true;
		roll.terms[0].results = [{ result: 8 }];
		const messageData = { flavor: "Luta" };
		D20Roll._prepareMessageData([roll], messageData);
		expect(messageData.flavor).toContain("op.Disadvantage");
	});

	it("does not append anything when mode is NORMAL", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.NORMAL, configured: true });
		roll._evaluated = true;
		roll.terms[0].modifiers = ["kh"];
		roll.terms[0]._evaluated = true;
		roll.terms[0].results = [{ result: 12 }];
		const messageData = { flavor: "Luta" };
		D20Roll._prepareMessageData([roll], messageData);
		expect(messageData.flavor).toBe("Luta");
	});

	it("initialises flavor to empty string when undefined", () => {
		const roll = makeRoll("1d20", {}, { advantageMode: ADV.NORMAL, configured: true });
		roll._evaluated = true;
		roll.terms[0].modifiers = ["kh"];
		roll.terms[0]._evaluated = true;
		roll.terms[0].results = [{ result: 10 }];
		const messageData = {};
		D20Roll._prepareMessageData([roll], messageData);
		expect(typeof messageData.flavor).toBe("string");
	});
});
