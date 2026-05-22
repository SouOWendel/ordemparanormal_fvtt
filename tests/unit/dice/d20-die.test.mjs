import { describe, it, expect } from "vitest";
import D20Die from "../../../module/dice/d20-die.mjs";

describe("D20Die.applyModifier", () => {
	it('when number > 1: removes one existing kh/kl and adds "kh"', () => {
		const die = new D20Die({ number: 3 });
		die.modifiers.push("kh");
		die.applyModifier();
		expect(die.modifiers.filter((m) => m === "kh")).toHaveLength(1);
		expect(die.modifiers).not.toContain("kl");
		expect(die.number).toBe(3);
	});

	it('when number < 1 (atributo zerado por desvantagem): sets number=2 and adds "kl"', () => {
		const die = new D20Die({ number: 0 });
		die.applyModifier();
		expect(die.number).toBe(2);
		expect(die.modifiers).toContain("kl");
		expect(die.modifiers).not.toContain("kh");
	});

	it("when number = 1 (atributo 1 sem desvantagem): rola 1d20 puro, sem kh/kl", () => {
		const die = new D20Die({ number: 1 });
		die.applyModifier();
		expect(die.modifiers).not.toContain("kh");
		expect(die.modifiers).not.toContain("kl");
		expect(die.number).toBe(1);
	});

	it("remove kh/kl prévio quando atributo cai para 1 (mantém 1d20 puro)", () => {
		const die = new D20Die({ number: 1, modifiers: ["kl"] });
		die.applyModifier();
		expect(die.modifiers).not.toContain("kh");
		expect(die.modifiers).not.toContain("kl");
		expect(die.number).toBe(1);
	});
});

describe("D20Die.applyAdvantage", () => {
	it("ADVANTAGE (1): increments number by 1", () => {
		const die = new D20Die({ number: 1 });
		die.applyAdvantage(CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE);
		expect(die.number).toBe(2);
		expect(die.options.advantageMode).toBe(1);
	});

	it("DISADVANTAGE (-1): decrements number by 1", () => {
		const die = new D20Die({ number: 2 });
		die.applyAdvantage(CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE);
		expect(die.number).toBe(1);
		expect(die.options.advantageMode).toBe(-1);
	});

	it("NORMAL (0): no change to number", () => {
		const die = new D20Die({ number: 1 });
		die.applyAdvantage(CONFIG.Dice.D20Roll.ADV_MODE.NORMAL);
		expect(die.number).toBe(1);
		expect(die.options.advantageMode).toBe(0);
	});
});

describe("D20Die.isCriticalSuccess", () => {
	it("returns true when evaluated, faces=20, total >= criticalSuccess", () => {
		const die = new D20Die({ number: 1, faces: 20 });
		die._evaluated = true;
		die.results = [{ result: 20 }];
		die.options.criticalSuccess = 20;
		expect(die.isCriticalSuccess).toBe(true);
	});

	it("returns false when total < criticalSuccess", () => {
		const die = new D20Die({ number: 1, faces: 20 });
		die._evaluated = true;
		die.results = [{ result: 15 }];
		die.options.criticalSuccess = 20;
		expect(die.isCriticalSuccess).toBe(false);
	});

	it("returns false when not evaluated", () => {
		const die = new D20Die({ number: 1, faces: 20 });
		die.options.criticalSuccess = 20;
		expect(die.isCriticalSuccess).toBe(false);
	});

	it("returns false when faces !== 20 (isValid=false)", () => {
		const die = new D20Die({ number: 1, faces: 6 });
		die._evaluated = true;
		die.results = [{ result: 6 }];
		die.options.criticalSuccess = 6;
		expect(die.isCriticalSuccess).toBe(false);
	});
});

describe("D20Die.isCriticalFailure", () => {
	it("returns true when evaluated, faces=20, total <= criticalFailure", () => {
		const die = new D20Die({ number: 1, faces: 20 });
		die._evaluated = true;
		die.results = [{ result: 1 }];
		die.options.criticalFailure = 1;
		expect(die.isCriticalFailure).toBe(true);
	});

	it("returns false when total > criticalFailure", () => {
		const die = new D20Die({ number: 1, faces: 20 });
		die._evaluated = true;
		die.results = [{ result: 5 }];
		die.options.criticalFailure = 1;
		expect(die.isCriticalFailure).toBe(false);
	});

	it("returns false when not evaluated", () => {
		const die = new D20Die({ number: 1, faces: 20 });
		die.options.criticalFailure = 1;
		expect(die.isCriticalFailure).toBe(false);
	});

	it("returns false when faces !== 20 (isValid=false)", () => {
		const die = new D20Die({ number: 1, faces: 6 });
		die._evaluated = true;
		die.results = [{ result: 1 }];
		die.options.criticalFailure = 1;
		expect(die.isCriticalFailure).toBe(false);
	});
});

describe("D20Die.applyFlag", () => {
	it('halflingLucky enabled: adds "r1=1" to modifiers', () => {
		const die = new D20Die();
		die.applyFlag("halflingLucky", true);
		expect(die.modifiers).toContain("r1=1");
		expect(die.options.halflingLucky).toBe(true);
	});

	it('halflingLucky disabled: removes "r1=1"', () => {
		const die = new D20Die({ modifiers: ["r1=1"] });
		die.applyFlag("halflingLucky", false);
		expect(die.modifiers).not.toContain("r1=1");
		expect(die.options.halflingLucky).toBe(false);
	});

	it("halflingLucky enabled when already present: no duplicate", () => {
		const die = new D20Die({ modifiers: ["r1=1"] });
		die.applyFlag("halflingLucky", true);
		expect(die.modifiers.filter((m) => m === "r1=1")).toHaveLength(1);
	});
});

describe("D20Die.applyRange", () => {
	it('{minimum: 2}: adds "min2" modifier and sets options.minimum', () => {
		const die = new D20Die();
		die.applyRange({ minimum: 2 });
		expect(die.modifiers).toContain("min2");
		expect(die.options.minimum).toBe(2);
	});

	it('{maximum: 18}: adds "max18" modifier and sets options.maximum', () => {
		const die = new D20Die();
		die.applyRange({ maximum: 18 });
		expect(die.modifiers).toContain("max18");
		expect(die.options.maximum).toBe(18);
	});

	it("replaces existing min modifier", () => {
		const die = new D20Die({ modifiers: ["min1"] });
		die.applyRange({ minimum: 3 });
		expect(die.modifiers).not.toContain("min1");
		expect(die.modifiers).toContain("min3");
	});

	it("replaces existing max modifier", () => {
		const die = new D20Die({ modifiers: ["max10"] });
		die.applyRange({ maximum: 15 });
		expect(die.modifiers).not.toContain("max10");
		expect(die.modifiers).toContain("max15");
	});
});
