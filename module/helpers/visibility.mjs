/**
 * Pure visibility/permission helpers extracted from chat-message and combat hooks
 * so the visibility rules added by the PR-87 QoL pass have unit-test coverage
 * (Foundry mocks can't easily flip `game.user.isGM` at runtime).
 *
 * Cada função recebe o contexto explicitamente — sem referências globais —
 * para ser executável em Node/Vitest.
 */

/**
 * Whisper recipient list for damage application chat messages.
 *
 * Threats têm donos só MJ (`isGM` users). Agents podem ter donos humanos
 * (`testUserPermission(user, "OWNER") === true`). Para uma criatura, o
 * resultado fica restrito ao MJ — bloqueando o vazamento de HP/RD para a
 * mesa. Para um agente, MJ + dono(s) recebem.
 *
 * @param {object|null} targetActor    Actor com `testUserPermission` (Foundry doc)
 * @param {Iterable<object>} users     Coleção `game.users` (cada user com `isGM`/`id`)
 * @returns {string[]} userIds únicos
 */
export function damageRecipients(targetActor, users) {
	const ids = new Set();
	for (const u of users ?? []) {
		if (u.isGM) ids.add(u.id);
		else if (targetActor?.testUserPermission?.(u, "OWNER")) ids.add(u.id);
	}
	return [...ids];
}

/**
 * Should the combat tracker render the HP block for this combatant to the
 * current viewer? Threats são informação privada do MJ.
 *
 * @param {object} actor             Actor com `.type` em {"agent","threat"}
 * @param {boolean} viewerIsGM
 * @returns {boolean}
 */
export function shouldShowCombatantHP(actor, viewerIsGM) {
	if (!actor) return false;
	if (actor.type === "threat" && !viewerIsGM) return false;
	return true;
}

/**
 * Should the hit-result block include the numeric Defense value?
 * Visível somente para o MJ ou para o dono do alvo (que já conhece a própria
 * Defesa). Demais espectadores só veem HIT/MISS — não devem inferir o número.
 *
 * @param {object} ctx
 * @param {boolean} ctx.viewerIsGM
 * @param {boolean} ctx.viewerOwnsTarget   Resultado de `actor.isOwner` resolvido pelo chamador
 * @returns {boolean}
 */
export function shouldShowDefenseValue({ viewerIsGM, viewerOwnsTarget }) {
	return Boolean(viewerIsGM || viewerOwnsTarget);
}
