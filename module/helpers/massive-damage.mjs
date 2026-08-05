/**
 * Ordem Paranormal — Dano Massivo (book p. 87, "Ações Especiais de Defesa").
 *
 * "Se você sofrer uma quantidade de dano igual ou maior que a metade de seus
 * PV totais de uma só vez e não for reduzido a 0 PV, deve fazer um teste de
 * Fortitude (DT 15 +2 para cada 10 pontos de dano sofridos). Se falhar, é
 * reduzido a 0 PV (ficando inconsciente e morrendo, como o normal)."
 *
 * Scope: agents only, mirroring the P1 precedent in
 * `OrdemActor.reconcileHealthConditions` (automatic condition toggling is
 * agent-only; threats are GM-tracked manually).
 */

/**
 * Whether a single hit triggers the Dano Massivo rule.
 * @param {number} finalDamage  Damage actually taken (after RD), this hit.
 * @param {number} maxPV        The actor's total/max PV.
 * @param {number} newPV        PV remaining after this hit.
 * @returns {boolean}
 */
export function isMassiveDamage(finalDamage, maxPV, newPV) {
	if (!(maxPV > 0)) return false;
	return finalDamage >= maxPV / 2 && newPV > 0;
}

/**
 * Whether the table plays with the Dano Massivo rule. Some groups drop it or
 * swap it for Ferimentos Debilitantes (Sobrevivendo ao Horror), so the world
 * setting can turn the automatic card off.
 *
 * Only an explicit `false` disables it — unit tests read `undefined` for the
 * setting, and the rule is on by default.
 * @param {unknown} setting  Value of the `massiveDamageRule` world setting.
 * @returns {boolean}
 */
export function isMassiveDamageRuleEnabled(setting) {
	return setting !== false;
}

/**
 * The Fortitude DT for a Dano Massivo save. Book default rounding is always
 * down, so every full 10 points of damage adds +2 to the base DT of 15.
 * @param {number} finalDamage
 * @returns {number}
 */
export function massiveDamageDT(finalDamage) {
	return 15 + 2 * Math.floor(finalDamage / 10);
}
