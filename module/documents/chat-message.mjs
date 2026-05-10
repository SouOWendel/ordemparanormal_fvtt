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

			// Disable the damage button when the last attack missed
			const cardHitResult = this.getFlag("ordemparanormal", "hitResult");
			if (cardHitResult) {
				const damageButton = html.querySelector('[data-action="damage"]');
				if (damageButton) {
					if (cardHitResult.hit === false) {
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
						const result = await targetActor.applyDamage(applyRoll.total, {
							damageType: damageTarget.damageType,
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
		if (hitResult) {
			const rollContent = html.querySelector(".dice-roll");
			if (rollContent) {
				const resultBlock = document.createElement("div");
				resultBlock.classList.add("hit-result", hitResult.hit ? "success" : "failure");
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
		}
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
