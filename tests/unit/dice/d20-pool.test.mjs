import { describe, it, expect } from "vitest";
import { buildD20DiceFormula, resolveD20DiceCount } from "../../../module/dice/d20-pool.mjs";

describe("d20 pools", () => {
	it("defaults missing legacy bonuses to zero", () => {
		expect(resolveD20DiceCount({ value: 2 })).toBe(2);
		expect(buildD20DiceFormula({ value: 2 }, {})).toBe("2d20kh");
	});

	it("combines attribute and skill dice without using flat modifiers", () => {
		const attribute = { value: 2, diceBonus: 1, bonus: 50 };
		const skill = { diceBonus: -2, value: 10, mod: 5, degree: { value: 15 } };
		expect(resolveD20DiceCount(attribute, skill)).toBe(1);
		expect(buildD20DiceFormula(attribute, skill)).toBe("1d20");
		expect(attribute.value).toBe(2);
		expect(skill.diceBonus).toBe(-2);
	});

	it.each([
		[1, "3d20kh"],
		[-1, "1d20"],
		[-2, "2d20kl"],
		[-3, "2d20kl"],
	])("normalizes bonus %s using the system die rules", (diceBonus, expected) => {
		expect(buildD20DiceFormula({ value: 2, diceBonus })).toBe(expected);
	});
});
