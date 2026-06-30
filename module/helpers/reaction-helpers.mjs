/**
 * Pure helpers for defender reactions (Esquiva, Bloqueio, Contra-ataque).
 * No Foundry VTT dependencies — testable in Node.js.
 *
 * Regras:
 *  - Esquiva: treinado em Reflexos → +bônus de Reflexos na Defesa contra qualquer ataque
 *  - Bloqueio: treinado em Fortitude (skill key "resilience") → +RD = bônus de Fortitude (corpo a corpo)
 *  - Contra-ataque: treinado em Luta → se atacante errar ataque corpo a corpo, defensor faz ataque
 *  - Apenas 1 reação por rodada
 *  - Apenas Agentes (PCs) podem usar reações
 */

const TRAINED_THRESHOLD = 5;

/**
 * @param {object} item   Item document (or plain object with system.types.rangeType.name and system.formulas.attack.skill)
 * @returns {boolean}     True when the attack is melee.
 */
export function isMeleeAttack(item) {
	const rangeName = item?.system?.types?.rangeType?.name;
	if (rangeName === "melee") return true;
	if (rangeName === "ranged") return false;
	return item?.system?.formulas?.attack?.skill === "fighting";
}

/**
 * @param {object} actor       Actor document (or plain object with system.skills)
 * @param {string} skillKey    "reflexes" | "resilience" | "fighting" | …
 * @returns {boolean}
 */
export function isTrainedIn(actor, skillKey) {
	const degree = actor?.system?.skills?.[skillKey]?.degree?.value;
	return Number.isFinite(degree) && degree >= TRAINED_THRESHOLD;
}

const SKILL_TO_ATTRIBUTE = {
	reflexes: "dex",
	resilience: "vit",
	fighting: "str",
};

/**
 * Compute the total bonus the actor would add to a roll for the given skill.
 * Mirrors the standard `attribute + degree + mod + value` summation used elsewhere.
 *
 * @param {object} actor
 * @param {string} skillKey
 * @returns {number}
 */
export function getSkillBonus(actor, skillKey) {
	const skill = actor?.system?.skills?.[skillKey];
	if (!skill) return 0;
	const attrKey = SKILL_TO_ATTRIBUTE[skillKey];
	const attrValue = attrKey ? actor?.system?.attributes?.[attrKey]?.value ?? 0 : 0;
	const degree = skill.degree?.value ?? 0;
	const mod = skill.mod ?? 0;
	const value = skill.value ?? 0;
	return attrValue + degree + mod + value;
}

/**
 * Bonus added to the defender's static Defense when the Esquiva reaction triggers.
 * `actor.system.defense.value` already includes AGI (dex) via calculateDefense in
 * helpers/actor-calculations.mjs, so the reaction must NOT add the attribute again
 * here — only the Reflexes skill components (degree + mod + value). Otherwise the
 * recomputed Defense would double-count AGI and diverge from the prepared
 * `defense.dodge` shown on the sheet.
 *
 * @param {object} actor
 * @returns {number}
 */
export function getDodgeReactionBonus(actor) {
	const skill = actor?.system?.skills?.reflexes;
	if (!skill) return 0;
	return (skill.degree?.value ?? 0) + (skill.mod ?? 0) + (skill.value ?? 0);
}

/**
 * Check whether the actor can react this round (any reaction).
 *
 * @param {number|null} reactionUsedRound  Last round in which a reaction was spent (from actor flag).
 * @param {number} currentRound            Current combat round (0 when no combat).
 * @returns {boolean}
 */
export function hasReactionAvailable(reactionUsedRound, currentRound) {
	if (currentRound === 0) return true;
	return reactionUsedRound !== currentRound;
}

/**
 * Determine which reactions are eligible for this defender against this attack.
 *
 * @param {object} defender              Defender actor (must be type "agent")
 * @param {object|null} attackerItem     Item used by the attacker
 * @param {number} currentRound          Current combat round
 * @param {number|null} reactionUsedRound  Defender's stored reaction-used round
 * @returns {{
 *   dodge: {eligible: boolean, reason?: string, bonus: number},
 *   block: {eligible: boolean, reason?: string, bonus: number},
 *   counterAttack: {eligible: boolean, reason?: string},
 * }}
 */
export function getReactionEligibility(defender, attackerItem, currentRound, reactionUsedRound) {
	const result = {
		dodge: { eligible: false, bonus: 0 },
		block: { eligible: false, bonus: 0 },
		counterAttack: { eligible: false },
	};

	if (defender?.type !== "agent") {
		const reason = "notAgent";
		result.dodge.reason = reason;
		result.block.reason = reason;
		result.counterAttack.reason = reason;
		return result;
	}

	const reactionAvailable = hasReactionAvailable(reactionUsedRound, currentRound);
	const melee = isMeleeAttack(attackerItem);

	const dodgeBonus = getDodgeReactionBonus(defender);
	result.dodge.bonus = dodgeBonus;
	if (!isTrainedIn(defender, "reflexes")) result.dodge.reason = "notTrained";
	else if (!reactionAvailable) result.dodge.reason = "alreadyUsed";
	else result.dodge.eligible = true;

	const blockBonus = getSkillBonus(defender, "resilience");
	result.block.bonus = blockBonus;
	if (!isTrainedIn(defender, "resilience")) result.block.reason = "notTrained";
	else if (!melee) result.block.reason = "notMelee";
	else if (!reactionAvailable) result.block.reason = "alreadyUsed";
	else result.block.eligible = true;

	if (!isTrainedIn(defender, "fighting")) result.counterAttack.reason = "notTrained";
	else if (!melee) result.counterAttack.reason = "notMelee";
	else if (!reactionAvailable) result.counterAttack.reason = "alreadyUsed";
	else result.counterAttack.eligible = true;

	return result;
}

/**
 * Recompute hit/miss against a possibly-modified defense.
 *
 * @param {number} rollTotal
 * @param {number} baseDefense
 * @param {number} dodgeBonus
 * @returns {{hit: boolean, targetDefense: number}}
 */
export function recomputeHit(rollTotal, baseDefense, dodgeBonus = 0) {
	const targetDefense = baseDefense + (dodgeBonus || 0);
	return { hit: rollTotal >= targetDefense, targetDefense };
}

/**
 * Determine whether a given reaction button should be visible to the current viewer.
 *
 * @param {object} params
 * @param {"dodge"|"block"|"counterAttack"|"skip"} params.type
 * @param {object} params.eligibility   Result of getReactionEligibility (or relevant subobject)
 * @param {boolean} params.isOwnerOfDefender
 * @param {boolean} params.isGM
 * @param {boolean} [params.alreadyApplied=false]
 * @returns {boolean}
 */
export function shouldShowReactionButton({ type, eligibility, isOwnerOfDefender, isGM, alreadyApplied = false }) {
	if (alreadyApplied) return false;
	if (!isOwnerOfDefender && !isGM) return false;
	if (type === "skip") return true;
	const sub = eligibility?.[type];
	return Boolean(sub);
}
