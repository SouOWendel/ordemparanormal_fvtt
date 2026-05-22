/**
 * Defender reaction dispatch + UI helpers.
 *
 * Reaction payloads travel through the existing GM-authoritative socket channel
 * `system.ordemparanormal` (handler in module/ordemparanormal.mjs). All mutations
 * to chat messages and actor flags happen on the GM side.
 */

import {
	getDodgeReactionBonus,
	getReactionEligibility,
	getSkillBonus,
	isMeleeAttack,
	recomputeHit,
} from "./reaction-helpers.mjs";

/**
 * Send a reaction request to the GM via socket.
 *
 * @param {object} payload
 * @param {"dodge"|"block"|"counterAttack"|"skip"} payload.type
 * @param {string} payload.messageId      Attack chat message id
 * @param {string} payload.defenderUuid
 * @param {string} payload.attackerUuid
 * @param {string} payload.itemUuid       Attacker's weapon item uuid
 * @param {string} [payload.weaponUuid]   Defender's weapon (counter-attack only)
 */
export function dispatchReaction(payload) {
	const gmOnline = game.users.some((u) => u.isGM && u.active);
	if (!gmOnline) {
		ui.notifications.warn(game.i18n.localize("op.reaction.needsGM"));
		return;
	}
	// Foundry's socket.emit does not loop the message back to the sender. When the
	// GM clicks a reaction (e.g. acting on behalf of a PC), the GM must process
	// the request locally instead of waiting for a socket round-trip that never
	// arrives. Otherwise GM-triggered reactions would silently no-op.
	const firstActiveGM = game.users.find((u) => u.isGM && u.active);
	if (game.user.isGM && firstActiveGM?.id === game.user.id) {
		handleReaction({ sender: game.user, payload });
		return;
	}

	game.socket.emit("system.ordemparanormal", {
		type: "reaction",
		userId: game.user.id,
		payload,
	});
}

// Per-message and per-(defender+round) in-flight locks. Foundry's `msg.update`
// is async and the `reactionApplied` / `reactionUsedRound` flags are only
// readable after the writes settle, so two near-simultaneous socket requests
// can both pass the early checks before either commit lands. The message lock
// prevents double-applying to the same card; the defender lock prevents two
// pending cards (different attacks targeting the same PC in the same round)
// from both consuming a reaction the actor only has one of.
const _inFlightByMessage = new Map();
const _inFlightByDefenderRound = new Map();

/**
 * GM-side reaction handler. Applies the chosen reaction to the attack message and
 * to the defender actor flags, then announces the result in chat.
 *
 * @param {object} args
 * @param {object} args.sender
 * @param {object} args.payload
 */
export async function handleReaction({ sender, payload }) {
	const { type, messageId, defenderUuid } = payload;
	const msg = game.messages.get(messageId);
	if (!msg) return;

	const defender = await fromUuid(defenderUuid);
	if (!defender) return;

	const senderAllowed = sender.isGM || defender.testUserPermission?.(sender, "OWNER");
	if (!senderAllowed) return;

	if (msg.getFlag("ordemparanormal", "reactionApplied")) return;
	if (_inFlightByMessage.has(messageId)) return;

	// Reserve the defender-round slot eagerly. If two cards target the same PC
	// in the same round and both arrive at the GM before either applies its
	// reaction flag, only the first one acquires this lock — the second has to
	// auto-resolve so its card doesn't stay `revealed=false` with damage
	// permanently disabled (the same dead-end class as stale rejections).
	const round = msg.getFlag("ordemparanormal", "reactionPending")?.round ?? game.combat?.round ?? 0;
	const defenderRoundKey = type === "skip" ? null : `${defenderUuid}:${round}`;
	if (defenderRoundKey && _inFlightByDefenderRound.has(defenderRoundKey)) {
		await _autoResolveStale({ msg, defender, round });
		return;
	}

	_inFlightByMessage.set(messageId, true);
	if (defenderRoundKey) _inFlightByDefenderRound.set(defenderRoundKey, true);
	try {
		return await _processReaction({ msg, defender, payload, type, defenderUuid });
	} finally {
		_inFlightByMessage.delete(messageId);
		if (defenderRoundKey) _inFlightByDefenderRound.delete(defenderRoundKey);
	}
}

async function _processReaction({ msg, defender, payload, type, defenderUuid }) {
	// Re-validate the request against authoritative state. The client computed
	// eligibility before sending, but we cannot trust those checks: a stale
	// payload, a hand-crafted socket message, or a delayed click after the
	// defender already reacted this round must not produce a mutation.
	const reactionPending = msg.getFlag("ordemparanormal", "reactionPending");
	if (!reactionPending) return;
	if (reactionPending.defenderUuid !== defenderUuid) return;

	// Resolve the reaction against the round of the original attack, not the
	// current combat round. Otherwise a stale panel clicked in round 2 could
	// mutate a round-1 attack while consuming the wrong round's reaction quota.
	const round = reactionPending.round ?? game.combat?.round ?? 0;
	const stalePending =
		(game.combat && reactionPending.round != null && reactionPending.round !== game.combat.round) ||
		(!game.combat && (reactionPending.round ?? 0) > 0);
	if (stalePending) {
		// Don't silently drop: the message would be stuck with `revealed=false`
		// and the damage button permanently disabled. Reveal the result and
		// auto-skip so the attack can resolve normally.
		await _autoResolveStale({ msg, defender, round });
		return;
	}

	if (type !== "skip") {
		const attackerItem = reactionPending.itemUuid ? await fromUuid(reactionPending.itemUuid) : null;
		const reactionUsedRound = defender.getFlag("ordemparanormal", "reactionUsedRound") ?? null;
		const eligibility = getReactionEligibility(defender, attackerItem, round, reactionUsedRound);
		const sub = eligibility[type];
		// Reject path needs to also auto-resolve the card, otherwise rejected requests
		// (e.g. defender already used their reaction on another attack this round, or
		// dodge clicked after reveal) would leave `hitResult.revealed=false` forever
		// with the damage button permanently disabled — same dead-end class as stale.
		if (!sub?.eligible) return _autoResolveStale({ msg, defender, round });
		if (type === "dodge" || type === "block") {
			const hit = msg.getFlag("ordemparanormal", "hitResult");
			if (hit?.revealed === true) return _autoResolveStale({ msg, defender, round });
		}
		if (type === "counterAttack") {
			const hit = msg.getFlag("ordemparanormal", "hitResult");
			if (!hit || hit.revealed !== true || hit.hit !== false) return _autoResolveStale({ msg, defender, round });
			// Validate the chosen weapon belongs to the defender and is currently
			// equipped melee. Trust nothing the client sent.
			const candidate = payload.weaponUuid ? await fromUuid(payload.weaponUuid) : null;
			const allowed = listCounterAttackWeapons(defender);
			if (!candidate || !allowed.some((w) => w.uuid === candidate.uuid))
				return _autoResolveStale({ msg, defender, round });
		}
	}

	if (type === "dodge") return applyDodge({ msg, defender, round });
	if (type === "block") return applyBlock({ msg, defender, round });
	if (type === "skip") return applySkip({ msg, defender, round });
	if (type === "counterAttack") return applyCounterAttack({ msg, defender, payload, round });
}

async function applyDodge({ msg, defender, round }) {
	const hitResult = msg.getFlag("ordemparanormal", "hitResult");
	if (!hitResult) return;
	const baseDefense = hitResult.baseDefense ?? hitResult.targetDefense;
	const dodgeBonus = getDodgeReactionBonus(defender);
	const rollTotal = msg.rolls?.[0]?.total ?? 0;
	const recomputed = recomputeHit(rollTotal, baseDefense, dodgeBonus);

	const newHit = {
		...hitResult,
		baseDefense,
		hit: recomputed.hit,
		targetDefense: recomputed.targetDefense,
		dodged: true,
		revealed: true,
		// A critical that turns into a miss should no longer display the critical badge.
		isCritical: recomputed.hit ? hitResult.isCritical : false,
	};

	await msg.update({
		flags: {
			ordemparanormal: {
				hitResult: newHit,
				reactionApplied: { type: "dodge", defenderUuid: defender.uuid, round, bonus: dodgeBonus },
			},
		},
	});
	await defender.setFlag("ordemparanormal", "reactionUsedRound", round);
	// rollAttack also persists hitResult onto the related item card so the damage
	// button picks up hit/miss state across reloads (item.mjs:330). When dodge
	// flips hit→miss we must update that card flag too, otherwise the attacker
	// can still roll and apply damage.
	await syncItemCardHitResult(msg, newHit);

	const outcome = recomputed.hit ? game.i18n.localize("op.hit") : game.i18n.localize("op.miss");
	ChatMessage.create({
		content: game.i18n.format("op.reaction.dodgeApplied", {
			actor: foundry.utils.escapeHTML(defender.name ?? ""),
			bonus: dodgeBonus,
			defense: recomputed.targetDefense,
			outcome,
		}),
		speaker: ChatMessage.getSpeaker({ actor: defender }),
	});
}

async function applyBlock({ msg, defender, round }) {
	const blockBonus = getSkillBonus(defender, "resilience");
	const hitResult = msg.getFlag("ordemparanormal", "hitResult");
	const revealed = hitResult ? { ...hitResult, revealed: true } : null;

	await msg.update({
		flags: {
			ordemparanormal: {
				...(revealed ? { hitResult: revealed } : {}),
				damageBlock: { amount: blockBonus, defenderUuid: defender.uuid },
				reactionApplied: { type: "block", defenderUuid: defender.uuid, round, bonus: blockBonus },
			},
		},
	});
	await defender.setFlag("ordemparanormal", "reactionUsedRound", round);
	if (revealed) await syncItemCardHitResult(msg, revealed);

	ChatMessage.create({
		content: game.i18n.format("op.reaction.blockApplied", {
			actor: foundry.utils.escapeHTML(defender.name ?? ""),
			bonus: blockBonus,
		}),
		speaker: ChatMessage.getSpeaker({ actor: defender }),
	});
}

async function _autoResolveStale({ msg, defender, round }) {
	const hitResult = msg.getFlag("ordemparanormal", "hitResult");
	const revealed = hitResult ? { ...hitResult, revealed: true } : null;
	await msg.update({
		flags: {
			ordemparanormal: {
				...(revealed ? { hitResult: revealed } : {}),
				reactionApplied: { type: "skip", defenderUuid: defender.uuid, round, stale: true },
			},
		},
	});
	if (revealed) await syncItemCardHitResult(msg, revealed);
}

async function applySkip({ msg, defender, round }) {
	const hitResult = msg.getFlag("ordemparanormal", "hitResult");
	const alreadyRevealed = hitResult?.revealed === true;

	// Two-stage Skip semantics: the first Skip just reveals the hit/miss block so the
	// defender can decide whether to counter-attack (counter-attack is post-roll).
	// A second Skip — clicked after reveal — locks the panel for good. This way the
	// counter-attack button has a chance to render between the two clicks when the
	// attacker missed.
	if (!alreadyRevealed) {
		const revealed = hitResult ? { ...hitResult, revealed: true } : null;
		await msg.update({
			flags: {
				ordemparanormal: {
					...(revealed ? { hitResult: revealed } : {}),
				},
			},
		});
		if (revealed) await syncItemCardHitResult(msg, revealed);
		return;
	}

	await msg.update({
		flags: {
			ordemparanormal: {
				reactionApplied: { type: "skip", defenderUuid: defender.uuid, round },
			},
		},
	});
	ChatMessage.create({
		content: game.i18n.format("op.reaction.skipApplied", {
			actor: foundry.utils.escapeHTML(defender.name ?? ""),
		}),
		speaker: ChatMessage.getSpeaker({ actor: defender }),
	});
}

async function applyCounterAttack({ msg, defender, payload, round }) {
	// Resolve weapon AND attacker token FIRST. If either is missing now (weapon
	// deleted, attacker token gone from the canvas, etc.), abort without
	// consuming the defender's reaction — they shouldn't lose their one
	// per-round budget on a no-op or, worse, fire a counter-attack at whoever
	// the GM happens to have targeted at the moment.
	//
	// Failure paths must also auto-resolve the card via _autoResolveStale,
	// otherwise the click handler's local button-disable leaves the panel
	// stuck (no message mutation → no re-render → buttons stay disabled).
	const weapon = payload.weaponUuid ? await fromUuid(payload.weaponUuid) : null;
	if (!weapon) {
		ui.notifications.warn(game.i18n.localize("op.reaction.noMeleeWeapon"));
		await _autoResolveStale({ msg, defender, round });
		return;
	}

	const reactionPending = msg.getFlag("ordemparanormal", "reactionPending");
	let attackerToken = null;
	// Distinguish "field present (possibly null)" from "field absent (legacy data)".
	// New attacks always set attackerTokenUuid via item.mjs:325, sometimes as null
	// when the attacker has no active token. A truthy check would conflate the two
	// and let a "field-present-null" case fall into the legacy fallback, picking
	// an arbitrary sibling token.
	const hasTokenUuidField = reactionPending && Object.hasOwn(reactionPending, "attackerTokenUuid");
	if (hasTokenUuidField) {
		if (reactionPending.attackerTokenUuid) {
			const tokenDoc = await fromUuid(reactionPending.attackerTokenUuid);
			attackerToken = tokenDoc?.object ?? tokenDoc ?? null;
		}
		if (!attackerToken) {
			ui.notifications.warn(game.i18n.localize("op.reaction.attackerGone"));
			await _autoResolveStale({ msg, defender, round });
			return;
		}
	} else {
		// Legacy attack (created before attackerTokenUuid was tracked) — fall back
		// to the actor's first active token. Best-effort for older data only.
		const attacker = payload.attackerUuid ? await fromUuid(payload.attackerUuid) : null;
		attackerToken = resolveAttackerToken(attacker);
		if (!attackerToken) {
			ui.notifications.warn(game.i18n.localize("op.reaction.attackerGone"));
			await _autoResolveStale({ msg, defender, round });
			return;
		}
	}

	const hitResult = msg.getFlag("ordemparanormal", "hitResult");
	const revealed = hitResult ? { ...hitResult, revealed: true } : null;

	await msg.update({
		flags: {
			ordemparanormal: {
				...(revealed ? { hitResult: revealed } : {}),
				reactionApplied: { type: "counterAttack", defenderUuid: defender.uuid, round },
			},
		},
	});
	await defender.setFlag("ordemparanormal", "reactionUsedRound", round);
	if (revealed) await syncItemCardHitResult(msg, revealed);

	// Await the narration message so it lands in chat before the counter-attack roll.
	await ChatMessage.create({
		content: game.i18n.format("op.reaction.counterAttackTriggered", {
			actor: foundry.utils.escapeHTML(defender.name ?? ""),
			weapon: foundry.utils.escapeHTML(weapon.name ?? ""),
		}),
		speaker: ChatMessage.getSpeaker({ actor: defender }),
	});

	// Forçar rollMode público: o contra-ataque roda no cliente GM via socket, e sem
	// override o `core.rollMode` do MJ (e.g. "gmroll" / "blindroll") "vazaria" para
	// a rolagem do jogador, escondendo o resultado do próprio dono da reação.
	await weapon.rollAttack({ _forcedTarget: attackerToken, rollMode: "publicroll" });
}

async function syncItemCardHitResult(attackMsg, newHitResult) {
	const itemUuid = attackMsg.getFlag("ordemparanormal", "messageRoll")?.itemUuid;
	const itemId = itemUuid?.split(".").pop();
	if (!itemId) {
		// Mensagens de ataque legacy (anteriores ao tracking de messageRoll) caem
		// aqui. Sem o item id não dá para localizar o item card, e o botão de dano
		// pode continuar habilitado mesmo depois de um dodge flipar o resultado.
		// Logamos pra que o sintoma "dodge não desabilitou o dano" seja debugável.
		console.warn(
			"ordemparanormal | syncItemCardHitResult: attack message sem flag `messageRoll.itemUuid` — item card não será atualizado",
			{ attackMsgId: attackMsg?.id }
		);
		return;
	}
	const cardMsg = [...game.messages]
		.reverse()
		.find((m) => m.content?.includes(`data-item-id="${itemId}"`) && m.content?.includes("chat-card item-card"));
	if (!cardMsg) return;

	const current = cardMsg.getFlag("ordemparanormal", "hitResult");
	// Volley em multi-ataque: o item card guarda `attackResults` (uma entrada por
	// ataque). Substituir tudo aqui (como no fluxo antigo) descartaria os hits
	// das outras flechadas dessa volley e travaria o botão de dano. Em vez disso,
	// achamos a entrada do ataque que mudou (pelo messageId) e reescrevemos só ela,
	// recomputando os campos agregados ao fim.
	if (current?.attackResults?.length) {
		const updated = current.attackResults.map((a) =>
			a.attackMessageId === attackMsg.id
				? {
						...a,
						hit: newHitResult.hit,
						revealed: newHitResult.revealed,
						isCritical: newHitResult.isCritical,
						targetDefense: newHitResult.targetDefense ?? a.targetDefense,
				  }
				: a
		);
		const anyHitOrPending = updated.some((a) => a.hit === true || a.revealed === false);
		const allRevealed = updated.every((a) => a.revealed !== false);
		const anyCritical = updated.some((a) => a.isCritical === true && a.revealed !== false);
		await cardMsg.setFlag("ordemparanormal", "hitResult", {
			...current,
			...newHitResult,
			attackResults: updated,
			hit: anyHitOrPending,
			revealed: allRevealed,
			isCritical: anyCritical,
		});
		return;
	}

	await cardMsg.setFlag("ordemparanormal", "hitResult", newHitResult);
}

function resolveAttackerToken(attackerActor) {
	if (!attackerActor) return null;
	if (attackerActor.token) return attackerActor.token;
	const tokens = attackerActor.getActiveTokens?.() ?? [];
	return tokens[0] ?? null;
}

/**
 * List the defender's melee weapons that are equipped (using.state === true) and
 * therefore eligible to perform a counter-attack.
 *
 * @param {object} defender
 * @returns {Array<object>} Items
 */
export function listCounterAttackWeapons(defender) {
	const items = defender?.items?.contents ?? defender?.items ?? [];
	return [...items].filter(
		(item) => item.type === "armament" && item.system?.using?.state === true && isMeleeAttack(item)
	);
}

/**
 * Open a small DialogV2 letting the defender pick which equipped melee weapon to
 * use for the counter-attack. Resolves to the chosen item or null on cancel.
 *
 * @param {object} defender
 * @returns {Promise<object|null>}
 */
export async function pickCounterAttackWeapon(defender) {
	const weapons = listCounterAttackWeapons(defender);
	if (weapons.length === 0) {
		ui.notifications.warn(game.i18n.localize("op.reaction.noMeleeWeapon"));
		return null;
	}
	if (weapons.length === 1) return weapons[0];

	// DialogV2 trata `label` dos botões como texto puro — interpolar HTML lá faz
	// o usuário ver as tags cruas. A solução é renderizar a lista no `content` com
	// botões reais (radios + imagens) e ler o valor escolhido via FormData no
	// callback do botão OK.
	const optionsHtml = weapons
		.map((weapon, i) => {
			const img = foundry.utils.escapeHTML(weapon.img ?? "icons/svg/sword.svg");
			const name = foundry.utils.escapeHTML(weapon.name ?? "");
			const checked = i === 0 ? "checked" : "";
			return `
				<label class="op-weapon-option" style="display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--color-border-light, #ccc);border-radius:4px;margin-bottom:4px;cursor:pointer;">
					<input type="radio" name="weapon" value="${weapon.id}" ${checked} style="margin:0;" />
					<img src="${img}" width="28" height="28" style="border:0;flex:0 0 auto;" alt="" />
					<span style="flex:1;">${name}</span>
				</label>`;
		})
		.join("");

	const hint = foundry.utils.escapeHTML(game.i18n.localize("op.reaction.pickWeaponHint"));
	const content = `<form><p style="margin-top:0;">${hint}</p>${optionsHtml}</form>`;

	const choice = await foundry.applications.api.DialogV2.wait({
		window: { title: game.i18n.localize("op.reaction.pickWeaponTitle") },
		content,
		buttons: [
			{
				action: "ok",
				label: game.i18n.localize("op.reaction.confirm"),
				default: true,
				callback: (_event, button) => {
					const form = button.form ?? button.closest("form") ?? button.ownerDocument?.querySelector("form");
					const value = form ? new FormData(form).get("weapon") : null;
					return value ?? null;
				},
			},
			{ action: "__cancel", label: game.i18n.localize("op.reaction.cancel"), callback: () => null },
		],
		rejectClose: false,
	}).catch(() => null);

	if (!choice || choice === "__cancel") return null;
	return weapons.find((w) => w.id === choice) ?? null;
}

/**
 * Re-export of getReactionEligibility for callers that import only this module.
 */
export { getReactionEligibility };
