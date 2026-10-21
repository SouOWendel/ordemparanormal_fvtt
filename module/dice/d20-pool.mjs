import D20Die from "./d20-die.mjs";

/**
 * Resolve the unnormalized pool from prepared attribute and skill data.
 * @param {object} attribute Attribute used by this roll.
 * @param {object} [skill] Skill used by this roll.
 * @returns {number} Dice count before advantage and normalization.
 */
export function resolveD20DiceCount(attribute, skill) {
	return attribute.value + (attribute.diceBonus ?? 0) + (skill?.diceBonus ?? 0);
}

/**
 * Build the primary die formula for rolls outside the D20Roll workflow.
 * @param {object} attribute Attribute used by this roll.
 * @param {object} [skill] Skill used by this roll.
 * @returns {string} Normalized d20 formula.
 */
export function buildD20DiceFormula(attribute, skill) {
	const die = new D20Die();
	die.number = resolveD20DiceCount(attribute, skill);
	die.applyModifier();
	return `${die.number}d20${die.modifiers.join("")}`;
}
