import { getReactionEligibility } from "../helpers/reaction-helpers.mjs";
import { dispatchReaction, pickCounterAttackWeapon } from "../helpers/reactions.mjs";

/** */
export default class ChatMessageOP extends ChatMessage {
	/** @inheritDoc */
	prepareData() {
		super.prepareData();
	}

	/**
	 * Handle rendering of a chat message to the log
	 * @param {ChatLog} app         The ChatLog instance
	 * @param {HTMLElement} html    Rendered chat message HTML (v13 — native DOM, no jQuery)
	 * @param {object} data         Data passed to the render context
	 */
	async getHTML(options = {}) {
		const html = await super.renderHTML(options);
		if (foundry.utils.getType(this.system?.getHTML) === "function") {
			await this.system.getHTML(html, options);
			return html;
		}

		this._displayChatActionButtons(html);
		this._highlightCriticalSuccessFailure(html);
		// this._enrichChatCard(html);

		/**
		 * A hook event that fires after op-specific chat message modifications have completed.
		 * @function ordemparanormal.renderChatMessage
		 * @memberof hookEvents
		 * @param {ChatMessageOP} message  Chat message being rendered.
		 * @param {HTMLElement} html       HTML contents of the message.
		 */
		Hooks.callAll("ordemparanormal.renderChatMessage", this, html);

		return html;
	}

	/* -------------------------------------------- */

	/**
	 * Listen for shift key being pressed to show the chat message "delete" icon, or released (or focus lost) to hide it.
	 */
	static activateListeners() {}

	/* -------------------------------------------- */

	/**
	 * Optionally hide the display of chat card action buttons which cannot be performed by the user
	 * @param {ChatMessage} message  Message being prepared.
	 * @param {HTMLElement} html     Rendered contents of the message.
	 * @param {object} data          Configuration data passed to the message.
	 */
	_displayChatActionButtons(html) {
		const chatCard = html.querySelector(".ordemparanormal.chat-card");
		if (chatCard) {
			const flavor = html.querySelector(".flavor-text");
			const itemName = html.querySelector(".item-name");
			if (flavor && itemName && flavor.textContent === itemName.textContent) flavor.remove();

			const actor = game.actors.get(this.speaker.actor);
			const isCreator = resolveIsCreator(this, actor, game.user);
			for (const button of html.querySelectorAll(".card-buttons button")) {
				if (button.dataset.visibility === "all") continue;

				// GM buttons should only be visible to GMs, otherwise button should only be visible to message's creator
				if ((button.dataset.visibility === "gm" && !game.user.isGM) || !isCreator) button.hidden = true;
			}

			// Live-update .target-info from current targeting selection on every render
			const targetInfo = chatCard.querySelector(".target-info");
			if (targetInfo) {
				const currentTarget = game.user?.targets?.size === 1 ? [...game.user.targets][0] : null;
				if (currentTarget) {
					targetInfo.replaceChildren();
					const icon = document.createElement("i");
					icon.className = "fa-solid fa-crosshairs";
					targetInfo.append(icon, ` ${currentTarget.name}`);
					targetInfo.style.display = "";
				} else {
					targetInfo.style.display = "none";
				}
			}

			// Disable the damage button when the last attack missed — and also while a
			// defender reaction is still pending (revealed === false). Otherwise the
			// attacker/GM could roll and apply damage before the defender's Dodge
			// flips the attack into a miss, leaving stolen PV behind.
			const cardHitResult = this.getFlag("ordemparanormal", "hitResult");
			if (cardHitResult) {
				const damageButton = html.querySelector('[data-action="damage"]');
				if (damageButton) {
					const reactionPendingUnresolved = cardHitResult.revealed === false;
					if (cardHitResult.hit === false || reactionPendingUnresolved) {
						damageButton.disabled = true;
						damageButton.classList.add("hit-miss");
						damageButton.title = game.i18n.localize("op.rollDmgDisabled");
					}
					if (cardHitResult.isCritical === true) {
						damageButton.classList.add("hit-critical");
					}
				}
			}
		}

		// Inject "Aplicar ao Alvo" button on damage roll messages that have a damageTarget flag
		const damageTarget = this.getFlag("ordemparanormal", "damageTarget");
		if (damageTarget && game.user.isGM) {
			const rollContent = html.querySelector(".dice-roll");
			if (rollContent) {
				const applyBtn = document.createElement("button");
				applyBtn.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ${game.i18n.localize("op.applyDamage")}`;
				const messageRef = this;
				applyBtn.addEventListener("click", async (event) => {
					event.preventDefault();
					applyBtn.disabled = true;
					try {
						const targetActor = await fromUuid(damageTarget.actorUuid);
						if (!targetActor) return;
						const applyRoll = messageRef.rolls?.[0];
						if (!applyRoll) return;
						const attackMsg = damageTarget.attackMessageId ? game.messages.get(damageTarget.attackMessageId) : null;
						const extraRD = attackMsg?.getFlag("ordemparanormal", "damageBlock")?.amount ?? 0;
						const result = await targetActor.applyDamage(applyRoll.total, {
							damageType: damageTarget.damageType,
							extraRD,
						});
						const blockedMsg =
							result.blocked > 0 ? ` (${game.i18n.format("op.damageBlocked", { blocked: result.blocked })})` : "";
						ChatMessage.create({
							content: game.i18n.format("op.applyDamageResult", {
								amount: result.finalDamage,
								target: targetActor.name,
								blocked: blockedMsg,
							}),
						});
					} finally {
						applyBtn.disabled = false;
					}
				});
				rollContent.after(applyBtn);
			}
		}

		// Inject hit/miss result block on attack roll messages that have a hitResult flag
		const hitResult = this.getFlag("ordemparanormal", "hitResult");
		const reactionPending = this.getFlag("ordemparanormal", "reactionPending");
		const reactionApplied = this.getFlag("ordemparanormal", "reactionApplied");

		// Determine whether the current viewer should see the hit/miss reveal yet.
		// When a reaction is still pending, the defender's owner is kept blind to the
		// outcome until they choose. The attacker, the GM, and other observers see it
		// immediately so the table can keep flowing.
		const isDefenderViewer =
			!!reactionPending && this._isOwnerOfUuidSync(reactionPending.defenderUuid) && !game.user.isGM;
		const shouldRevealHit = !reactionPending || hitResult?.revealed === true || !isDefenderViewer;

		if (hitResult && shouldRevealHit) {
			const rollContent = html.querySelector(".dice-roll");
			if (rollContent) {
				const resultBlock = document.createElement("div");
				resultBlock.classList.add("hit-result", hitResult.hit ? "success" : "failure");
				if (hitResult.dodged) resultBlock.classList.add("dodged");
				const label = hitResult.hit
					? hitResult.isCritical
						? game.i18n.localize("op.criticalHit")
						: game.i18n.localize("op.hit")
					: game.i18n.localize("op.miss");
				resultBlock.innerHTML = `<strong>${label}</strong> <span class="vs-defense">${game.i18n.format("op.vsDefense", {
					defense: hitResult.targetDefense,
				})}</span>`;
				rollContent.after(resultBlock);
			}
		} else if (hitResult && isDefenderViewer && !shouldRevealHit) {
			// Hide the dice total area's standard "success/failure" highlight too, otherwise
			// the defender could infer the result from the d20 highlight applied earlier.
			html.querySelectorAll(".dice-total").forEach((el) => el.classList.remove("success", "failure"));
		}

		// Reaction panel — visible to the GM and to the defender's owner while pending.
		// Idempotency: skip if a panel is already in this html tree (defends against
		// any race where multiple renders could otherwise stack panels).
		if (reactionPending && !html.querySelector(".reaction-panel")) {
			this._renderReactionPanel(html, { reactionPending, hitResult, reactionApplied });
		}
	}

	/**
	 * Synchronous resolution of an Actor (or Token's actor) from a UUID. Uses
	 * `fromUuidSync` first, then falls back to extracting the actor id when the
	 * UUID points to a Token in a non-loaded scene (fromUuidSync needs the scene
	 * loaded to resolve Token UUIDs). Returns null if nothing matches.
	 *
	 * @param {string} uuid
	 * @returns {object|null}
	 */
	_resolveActorSync(uuid) {
		if (!uuid) return null;
		try {
			const doc = fromUuidSync(uuid);
			if (doc) return doc.actor ?? doc;
		} catch (_err) {
			/* fall through to id extraction */
		}
		// Token UUIDs in inactive scenes: parse out the actor id and look it up
		// in the world collection. Format: Scene.X.Token.Y.Actor.Z (linked) or
		// Actor.Z (world actor).
		const parts = uuid.split(".");
		const actorIdx = parts.lastIndexOf("Actor");
		if (actorIdx >= 0 && actorIdx + 1 < parts.length) {
			return game.actors?.get(parts[actorIdx + 1]) ?? null;
		}
		return null;
	}

	/**
	 * Synchronous ownership check using _resolveActorSync. Used by render paths
	 * which cannot await.
	 *
	 * @param {string} uuid
	 * @returns {boolean}
	 */
	_isOwnerOfUuidSync(uuid) {
		const actor = this._resolveActorSync(uuid);
		return Boolean(actor?.isOwner);
	}

	/**
	 * Render the defender reaction panel onto the attack chat message.
	 *
	 * Synchronous on purpose: the chat-message render pipeline does not await us,
	 * so any `await` here would race with the parent returning `html` and could
	 * stack panels on rapid re-renders. `fromUuidSync` works for world-scoped
	 * documents (Actor, Item, Token in loaded scenes) which is what we need.
	 *
	 * @param {HTMLElement} html
	 * @param {{reactionPending: object, hitResult: object|null, reactionApplied: object|null}} ctx
	 */
	_renderReactionPanel(html, { reactionPending, hitResult, reactionApplied }) {
		const isOwnerOfDefender = this._isOwnerOfUuidSync(reactionPending.defenderUuid);
		if (!game.user.isGM && !isOwnerOfDefender) return;

		const defender = this._resolveActorSync(reactionPending.defenderUuid);
		// Wrap fromUuidSync in try/catch — a stale chat card can outlive its
		// referenced item/scene, and Foundry sometimes throws on lookup of
		// orphaned UUIDs. We must never let the chat renderer crash on render.
		let attackerItem = null;
		if (reactionPending.itemUuid) {
			try {
				attackerItem = fromUuidSync(reactionPending.itemUuid);
			} catch (_err) {
				attackerItem = null;
			}
		}
		if (!defender) return;

		const currentRound = game.combat?.round ?? 0;
		const reactionUsedRound = defender.getFlag("ordemparanormal", "reactionUsedRound") ?? null;
		const eligibility = getReactionEligibility(defender, attackerItem, currentRound, reactionUsedRound);

		const panel = document.createElement("div");
		panel.classList.add("reaction-panel");
		if (reactionApplied) panel.classList.add("reaction-applied");

		const title = document.createElement("div");
		title.classList.add("reaction-panel-title");
		title.textContent = game.i18n.localize("op.reaction.panelTitle");
		panel.append(title);

		if (reactionApplied) {
			const status = document.createElement("div");
			status.classList.add("reaction-status");
			const typeKey =
				reactionApplied.type === "dodge"
					? "op.reaction.dodge"
					: reactionApplied.type === "block"
					? "op.reaction.block"
					: reactionApplied.type === "counterAttack"
					? "op.reaction.counterAttack"
					: "op.reaction.skip";
			const reactionLabel = game.i18n.localize(typeKey);
			status.textContent = `${defender.name} → ${reactionLabel}`;
			panel.append(status);
		} else {
			const buttons = document.createElement("div");
			buttons.classList.add("reaction-buttons");

			// Two-stage panel:
			// • Pre-reveal: defender hasn't seen the result yet — show Dodge/Block (the
			//   pre-roll reactions) plus Skip ("reveal and decide later").
			// • Post-reveal: dodge/block windows are over; show Counter-attack only when
			//   the attack actually missed and the defender is still eligible,
			//   plus Skip to lock the panel for good.
			const isRevealed = hitResult?.revealed === true;
			const attackerMissed = isRevealed && hitResult?.hit === false;

			if (!isRevealed) {
				buttons.append(
					this._buildReactionButton({
						type: "dodge",
						labelKey: "op.reaction.dodgeWithBonus",
						tooltipKey: "op.reaction.dodgeTooltip",
						eligibility: eligibility.dodge,
						reactionPending,
						defender,
					}),
					this._buildReactionButton({
						type: "block",
						labelKey: "op.reaction.blockWithBonus",
						tooltipKey: "op.reaction.blockTooltip",
						eligibility: eligibility.block,
						reactionPending,
						defender,
					})
				);
			} else if (attackerMissed && eligibility.counterAttack.eligible) {
				buttons.append(
					this._buildReactionButton({
						type: "counterAttack",
						labelKey: "op.reaction.counterAttack",
						tooltipKey: "op.reaction.counterAttackTooltip",
						eligibility: eligibility.counterAttack,
						reactionPending,
						defender,
					})
				);
			}

			buttons.append(
				this._buildReactionButton({
					type: "skip",
					labelKey: "op.reaction.skip",
					eligibility: { eligible: true },
					reactionPending,
					defender,
				})
			);

			panel.append(buttons);
		}

		const anchor = html.querySelector(".dice-roll") ?? html.querySelector(".message-content");
		anchor?.after(panel);
	}

	_buildReactionButton({ type, labelKey, tooltipKey, eligibility, reactionPending, defender }) {
		const btn = document.createElement("button");
		btn.classList.add("reaction-button", `reaction-${type}`);
		btn.dataset.reaction = type;

		const bonus = eligibility.bonus ?? 0;
		btn.innerHTML = bonus ? game.i18n.format(labelKey, { bonus }) : game.i18n.localize(labelKey);

		if (!eligibility.eligible) {
			btn.disabled = true;
			if (eligibility.reason) {
				btn.title = game.i18n.localize(`op.reaction.${eligibility.reason}`);
			}
		} else if (tooltipKey) {
			btn.title = game.i18n.format(tooltipKey, { bonus });
		}

		btn.addEventListener("click", async (event) => {
			event.preventDefault();
			btn.disabled = true;
			const buttonsContainer = btn.parentElement;
			buttonsContainer?.querySelectorAll("button").forEach((b) => (b.disabled = true));
			try {
				let weaponUuid = null;
				if (type === "counterAttack") {
					const weapon = await pickCounterAttackWeapon(defender);
					if (!weapon) {
						buttonsContainer?.querySelectorAll("button").forEach((b) => (b.disabled = false));
						return;
					}
					weaponUuid = weapon.uuid;
				}
				dispatchReaction({
					type,
					messageId: this.id,
					defenderUuid: reactionPending.defenderUuid,
					attackerUuid: reactionPending.attackerUuid,
					itemUuid: reactionPending.itemUuid,
					weaponUuid,
				});
			} catch (err) {
				console.error("ordemparanormal | reaction click failed", err);
				buttonsContainer?.querySelectorAll("button").forEach((b) => (b.disabled = false));
			}
		});
		return btn;
	}

	/**
	 * Highlight critical success or failure on d20 rolls.
	 * @param {ChatMessage} message  Message being prepared.
	 * @param {HTMLElement} html     Rendered contents of the message.
	 * @param {object} data          Configuration data passed to the message.
	 */
	_highlightCriticalSuccessFailure(html) {
		if (!this.isContentVisible || !this.rolls.length) return;

		function makeIcon(type, cls) {
			const icon = document.createElement("i");
			icon.classList.add(type, cls);
			icon.setAttribute("inert", "");
			return icon;
		}

		const totals = html.querySelectorAll(".dice-total");
		for (let [index, d20Roll] of this.rolls.entries()) {
			const d0 = d20Roll.dice[0];
			if (d0?.faces !== 20 || d0?.values.length !== 1) continue;

			d20Roll = ordemparanormal.dice.D20Roll.fromRoll(d20Roll);
			const d = d20Roll.dice[0];

			const isModifiedRoll = "success" in d.results[0] || d.options.marginSuccess || d.options.marginFailure;
			if (isModifiedRoll) continue;

			const total = totals[index];
			if (!total) continue;

			if (d.options.target && Number.isNumeric(d.options.target)) {
				if (d20Roll.isSuccess) total.classList.add("success");
				else total.classList.add("failure");
				const dtBadge = document.createElement("div");
				dtBadge.classList.add("dt-result", d20Roll.isSuccess ? "success" : "failure");
				dtBadge.textContent = d20Roll.isSuccess
					? game.i18n.format("op.rollSuccess", { dt: d.options.target })
					: game.i18n.format("op.rollFailure", { dt: d.options.target });
				total.after(dtBadge);
			}

			if (d20Roll.isCritical) total.classList.add("critical");
			if (d20Roll.isFumble) total.classList.add("fumble");

			const classification = classifyD20Roll(d20Roll);
			const icons = document.createElement("div");
			icons.classList.add("icons");
			if (classification === "critical")
				icons.append(makeIcon("fa-regular", "fa-star-of-david"), makeIcon("fa-regular", "fa-star-of-david"));
			else if (classification === "fumble")
				icons.append(makeIcon("fa-solid", "fa-car-burst"), makeIcon("fa-solid", "fa-car-burst"));
			else if (classification === "success") icons.append(makeIcon("fa-regular", "fa-thumbs-up"));
			else if (classification === "failure") icons.append(makeIcon("fa-solid", "fa-burst"));
			if (icons.children.length) total.append(icons);
		}
	}
}

/* -------------------------------------------- */
/*  Pure helpers (exported for testing)         */
/* -------------------------------------------- */

/**
 * Determine whether a user is considered the "creator" of a chat message
 * (i.e. may interact with its action buttons).
 *
 * @param {object} message        Chat message with .author.id
 * @param {object|null} actor     Actor retrieved from message.speaker (may be null)
 * @param {object} user           Current game.user with .isGM and .id
 * @returns {boolean}
 */
export function resolveIsCreator(message, actor, user) {
	return user.isGM || actor?.isOwner === true || message.author?.id === user.id;
}

/**
 * Classify a D20Roll result into a display category.
 *
 * @param {object} d20Roll  A D20Roll with isCritical, isFumble, isSuccess, isFailure
 * @returns {"critical"|"fumble"|"success"|"failure"|null}
 */
export function classifyD20Roll(d20Roll) {
	if (d20Roll.isCritical) return "critical";
	if (d20Roll.isFumble) return "fumble";
	if (d20Roll.isSuccess) return "success";
	if (d20Roll.isFailure) return "failure";
	return null;
}
