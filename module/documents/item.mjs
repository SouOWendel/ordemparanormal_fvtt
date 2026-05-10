/* eslint-disable indent */
/**
 * References and Codes of DND5e system:
 * https://github.com/foundryvtt/dnd5e/blob/a7f1404c7c38afa6d7dcc4f36a5fefd274034691/templates/chat/item-card.hbs
 * https://github.com/foundryvtt/dnd5e/blob/a7f1404c7c38afa6d7dcc4f36a5fefd274034691/module/documents/item.mjs#L1639
 */

import { getReactionEligibility } from "../helpers/reaction-helpers.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class OrdemItem extends Item {
	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData() {
		// As with the actor class, items are documents that can have their data
		// preparation methods overridden (such as prepareBaseData()).
		super.prepareData();
	}

	/**
	 * Prepare a data object which is passed to any Roll formulas which are created related to this Item
	 * @private
	 */
	getRollData() {
		if (!this.actor) return { ...super.getRollData() };
		const rollData = this.actor.getRollData();
		rollData.item = foundry.utils.deepClone(this.system);

		return rollData;
	}

	/* -------------------------------------------- */
	/*  Chat Message Helpers                        */
	/* -------------------------------------------- */

	/**
	 * Apply listeners to chat messages.
	 * @param {HTML} html  Rendered chat message.
	 */
	static chatListeners(html) {
		// Remove listener antigo se existir para evitar duplicação
		if (html._ordemListener) {
			html.removeEventListener("click", html._ordemListener);
		}

		// Cria e armazena o listener
		html._ordemListener = (event) => {
			if (!event.target.closest(".card-buttons button")) return;
			// Skip chat command cards (/dt, /oposto) — they have their own click handlers
			const card = event.target.closest(".chat-card");
			if (card?.classList.contains("dt-card") || card?.classList.contains("oposto-request")) return;
			this._onChatCardAction(event);
		};

		html.addEventListener("click", html._ordemListener);
		// html.querySelector('.card-buttons button').addEventListener('click', this._onChatCardAction.bind(this));
		// html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
	}

	/* -------------------------------------------- */

	/**
	 * Handle execution of a chat card action via a click event on one of the card buttons
	 * @param {Event} event       The originating click event
	 * @returns {Promise}         A promise which resolves once the handler workflow is complete
	 * @private
	 */
	static async _onChatCardAction(event) {
		event.preventDefault();
		// Extract card data
		const button = event.target;
		button.disabled = true;
		const card = button.closest(".chat-card");
		const messageId = card.closest(".message").dataset.messageId;
		const message = game.messages.get(messageId);
		const action = button.dataset.action;

		// Recover the actor for the chat card
		const actor = await this._getChatCardActor(card);
		if (!actor) return;

		// Get the Item from stored flag data or by the item ID on the Actor
		const storedData = message.getFlag("ordemparanormal", "itemData");
		const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);

		// Verificar se o item existe antes de tentar usar seus métodos
		if (!item) {
			console.warn("Item não encontrado para ação de chat card.", {
				storedData: !!storedData,
				itemId: card.dataset.itemId,
				actorId: actor?.id,
				hasTokenId: !!card.dataset.tokenId,
			});
			ui.notifications.warn("Item não encontrado no ator.");
			button.disabled = false;
			return;
		}

		switch (action) {
			case "attack": {
				const rollAttack = await item.rollAttack({
					event: event,
				});
				item.lastMessageId = messageId;
				item.critical = rollAttack.criticalStatus;
				item.hitResult = rollAttack.hitResult ?? null;
				if (rollAttack.hitResult !== null) {
					game.messages.get(messageId)?.setFlag("ordemparanormal", "hitResult", rollAttack.hitResult);
				}
				break;
			}
			case "damage": {
				// Fall back to the persisted hitResult on the card so the apply-damage flow
				// keeps working after a chat reload (when in-memory item state is lost).
				// When rebuilding critical from a persisted flag, recover the multiplier
				// from the item's critical formula (e.g. "19/x3" → 3) so x3/x4 weapons
				// don't silently degrade to x2.
				const persistedHit = message?.getFlag("ordemparanormal", "hitResult") ?? null;
				const hitResult = item.hitResult ?? persistedHit;
				let critical = item.critical;
				if (!critical && persistedHit?.isCritical) {
					// `this` here is the OrdemItem class itself (static method context)
					critical = { isCritical: true, multiplier: this._parseCriticalMultiplier(item.system.critical) };
				} else if (!critical) {
					critical = false;
				}
				await item.rollDamage({
					event: event,
					critical,
					lastId: item.lastMessageId ? item.lastMessageId === messageId : true,
					hitResult,
				});
				break;
			}
			case "formula":
				await item.rollFormula({ event });
				break;
			case "applyDamage": {
				const applyMessage = game.messages.get(messageId);
				const damageTarget = applyMessage?.getFlag("ordemparanormal", "damageTarget");
				if (!damageTarget) break;
				const targetActor = await fromUuid(damageTarget.actorUuid);
				if (!targetActor) break;
				const applyRoll = applyMessage.rolls?.[0];
				if (!applyRoll) break;
				const attackMsg = damageTarget.attackMessageId ? game.messages.get(damageTarget.attackMessageId) : null;
				const extraRD = attackMsg?.getFlag("ordemparanormal", "damageBlock")?.amount ?? 0;
				const result = await targetActor.applyDamage(applyRoll.total, {
					damageType: damageTarget.damageType,
					extraRD,
				});
				const blockedMsg = result.blocked > 0 ? game.i18n.format("op.damageBlocked", { blocked: result.blocked }) : "";
				ChatMessage.create({
					content: game.i18n.format("op.applyDamageResult", {
						amount: result.finalDamage,
						target: targetActor.name,
						blocked: blockedMsg,
					}),
					speaker: ChatMessage.getSpeaker({ actor: targetActor }),
				});
				break;
			}
			case "teste":
				break;
		}

		// Re-enable the button
		button.disabled = false;
	}

	/**
	 * Get the Actor which is the author of a chat card
	 * @param {HTMLElement} card    The chat card being used
	 * @returns {Actor|null}        The Actor document or null
	 * @private
	 */
	static async _getChatCardActor(card) {
		// Case 1 - a synthetic actor from a Token
		if (card.dataset.tokenId) {
			const token = await fromUuid(card.dataset.tokenId);
			if (!token) return null;
			return token.actor;
		}

		// Case 2 - use Actor ID directory
		const actorId = card.dataset.actorId;
		const actor = game.actors.get(actorId);

		// Case 3 - Try to get token from current scene if actor is not linked
		// This helps when tokenId wasn't stored but actor has active tokens
		if (actor && !actor.prototypeToken?.actorLink) {
			const tokens = actor.getActiveTokens();
			if (tokens.length > 0) {
				console.log("Usando token ativo para ator não vinculado:", tokens[0].name);
				return tokens[0].actor;
			}
		}

		return actor || null;
	}

	/**
	 * Prepare an object of chat data used to display a card for the Item in the chat log.
	 * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
	 * @returns {object}              An object of chat data to render.
	 */
	async getChatData(htmlOptions = {}) {
		const data = this.toObject().system;

		// Rich text description
		data.description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(data.description, {
			relativeTo: this,
			rollData: this.getRollData(),
			...htmlOptions,
		});

		// Type specific properties
		// data.properties = [
		//   ...this.system.chatProperties ?? [],
		//   ...this.system.equippableItemChatProperties ?? [],
		//   ...this.system.activatedEffectChatProperties ?? []
		// ].filter(p => p);

		return data;
	}

	/**
	 * Place an attack roll using an item (weapon, feat, spell, or equipment)
	 * Rely upon the d20Roll logic for the core implementation
	 */
	async rollAttack(options = {}) {
		if (!this.system.formulas.attack.attr || !this.system.formulas.attack.skill)
			throw new Error("This Item does not have a formula to roll!");

		// If multiple targets are selected, roll once per target
		const targets = game.user?.targets ?? new Set();
		if (targets.size > 1 && !options._forcedTarget) {
			const results = [];
			for (const token of targets) {
				results.push(await this.rollAttack({ ...options, _forcedTarget: token }));
			}
			return results[0]; // return first for backward-compat (item.critical assignment)
		}

		// If item has multiple attacks (e.g. threat with numberOfAttacks=3), roll once per attack
		const numAttacks = this.system.numberOfAttacks ?? 1;
		if (numAttacks > 1 && !options._attackIndex) {
			const results = [];
			for (let i = 0; i < numAttacks; i++) {
				results.push(await this.rollAttack({ ...options, _attackIndex: i + 1, _attackTotal: numAttacks }));
			}
			return results[0];
		}

		const attack = this.system.formulas.attack;
		const skill = this.parent.system.skills[attack.skill];
		let attribute = this.parent.system.attributes[attack.attr];
		let rollMode = "kh";

		if (attribute.value == 0) {
			attribute = 2;
			rollMode = "kl";
		} else attribute = attribute.value;

		const { parts, data } = CONFIG.Dice.BasicRoll.constructParts({
			degree: skill.degree.value || null,
			bonus: skill.value || null,
			modifier: skill.mod || null,
			attackBonus: attack.bonus || null,
		});

		const rollConfig = {
			parts: (parts ?? []).join(" + "),
			formula: `${attribute}d20${rollMode}`,
			data: this.getRollData(),
			chatMessage: true,
		};

		// Combina a fórmula do dado com os bônus
		rollConfig.formula = [rollConfig.formula].concat(parts ?? []).join(" + ");
		rollConfig.data = { ...(rollConfig.data ?? {}), ...data };

		// Realiza a rolagem
		const roll = await new Roll(rollConfig.formula, rollConfig.data).evaluate();

		// Verificações de Crítico
		const criticalStatus = this.isCritical({
			crtalFormula: this.system.critical,
			roll,
		});

		// Resolve target info (single target from targeting or _forcedTarget)
		const targetToken = options._forcedTarget ?? (targets.size === 1 ? [...targets][0] : null);
		const hitResult = targetToken ? this._compareWithDefense(targetToken.actor, roll.total, criticalStatus) : null;

		// Build the pending-reaction descriptor when the defender is an Agent (PCs only — Threats don't react).
		// Skip when the attacker IS the defender (counter-attacks), the attacker has no actor,
		// the defender has already spent their reaction this round, OR the defender has no
		// trained reaction that could legally apply to this attack — otherwise we'd hide the
		// result behind a panel that can never resolve to anything but Skip, needlessly
		// blocking damage application for untrained defenders.
		const defender = targetToken?.actor ?? null;
		const isAgentDefender = defender?.type === "agent";
		const currentRound = game.combat?.round ?? 0;
		const defenderReactionUsed = defender?.getFlag?.("ordemparanormal", "reactionUsedRound") ?? null;
		const defenderHasReaction = currentRound === 0 || defenderReactionUsed !== currentRound;
		const eligibility =
			isAgentDefender && defenderHasReaction
				? getReactionEligibility(defender, this, currentRound, defenderReactionUsed)
				: null;
		// Pre-roll reactions (Dodge/Block) only matter when the attack would hit; the
		// post-roll Counter-attack only matters when it missed. Pending the panel for
		// a counter-attack-only defender on a hit just blocks damage with no possible
		// resolution beyond Skip — so we gate on the actual outcome.
		const dodgeOrBlockEligible = Boolean(eligibility?.dodge.eligible || eligibility?.block.eligible);
		const counterMatters = hitResult?.hit === false && Boolean(eligibility?.counterAttack.eligible);
		const hasAnyEligibleReaction = dodgeOrBlockEligible || counterMatters;
		// Capture the attacker's token at attack time so counter-attacks always target the
		// exact token that swung — for linked actors with multiple tokens on a scene
		// `getActiveTokens()[0]` would otherwise pick an arbitrary one.
		const attackerTokenUuid = this.actor?.token?.uuid ?? this.actor?.getActiveTokens?.()[0]?.document?.uuid ?? null;
		const reactionPending =
			isAgentDefender && defender.uuid !== this.actor?.uuid && defenderHasReaction && hasAnyEligibleReaction
				? {
						defenderUuid: defender.uuid,
						attackerUuid: this.actor?.uuid ?? null,
						attackerTokenUuid,
						itemUuid: this.uuid,
						isMelee: this.system.types?.rangeType?.name !== "ranged",
						round: currentRound,
				  }
				: null;

		// When a reaction is pending, the hit/miss block stays hidden for the defender until they respond.
		if (hitResult) {
			hitResult.baseDefense = hitResult.targetDefense;
			hitResult.revealed = !reactionPending;
		}

		// Envia para o chat
		if (rollConfig.chatMessage) {
			const flags = {
				"ordemparanormal.messageRoll": {
					type: "attack",
					itemId: this.id,
					itemUuid: this.uuid,
					isCritical: criticalStatus.isCritical,
				},
			};
			if (hitResult) flags["ordemparanormal.hitResult"] = hitResult;
			if (reactionPending) flags["ordemparanormal.reactionPending"] = reactionPending;

			const targetName = targetToken?.name ?? null;
			// When a reaction is pending we must not leak hit/miss to the defender via the
			// flavor text — they're supposed to choose blind. Show only the target name
			// in that case. Once the reaction resolves the hit/miss block is revealed
			// in the chat card, which is the canonical place to read it.
			let flavorSuffix = "";
			if (targetName) {
				if (reactionPending) flavorSuffix = ` → ${targetName}`;
				else
					flavorSuffix = ` → ${targetName}: ${
						hitResult?.hit ? game.i18n.localize("op.hit") : game.i18n.localize("op.miss")
					}`;
			}
			const attackIndexSuffix = options._attackIndex ? ` (${options._attackIndex}/${options._attackTotal})` : "";

			const attackMsg = await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `${game.i18n.format("op.attackedWith", { name: this.name })}${attackIndexSuffix}${flavorSuffix}`,
				rollMode: game.settings.get("core", "rollMode"),
				flags,
			});

			// Track the most recent attack message id on the item instance so a subsequent
			// rollDamage can correlate to the originating attack (used by the Bloqueio reaction).
			this.lastAttackMessageId = attackMsg?.id ?? null;
			if (hitResult) {
				hitResult.attackMessageId = this.lastAttackMessageId;
				// Also write the id onto the attack message's own flag — without this,
				// later mutations that rebroadcast hitResult (e.g. the reaction reveal
				// path syncing back to the item card) would overwrite the id with the
				// pre-toMessage value (null).
				if (attackMsg) await attackMsg.setFlag("ordemparanormal", "hitResult", hitResult);
			}

			// Persist hitResult onto the most-recent item card for this item so the damage button state updates
			if (hitResult) {
				const itemId = this.id;
				const cardMsg = [...game.messages]
					.reverse()
					.find((m) => m.content?.includes(`data-item-id="${itemId}"`) && m.content?.includes("chat-card item-card"));
				if (cardMsg) await cardMsg.setFlag("ordemparanormal", "hitResult", hitResult);
			}
		}

		/**
		 * A hook event that fires after a formula has been rolled for an Item.
		 * @function ordemparanormal.rollFormula
		 * @memberof hookEvents
		 * @param {OrdemItem} item  Item for which the roll was performed.
		 * @param {Roll} roll       The resulting roll.
		 */
		Hooks.callAll("ordemparanormal.rollFormula", this, roll);

		return { roll, criticalStatus, hitResult };
	}

	/**
	 * Compare a roll result against a target actor's defense value.
	 * @param {Actor|null} targetActor  The actor being attacked.
	 * @param {number} rollTotal        The attack roll total.
	 * @param {object} criticalStatus   Result of isCritical().
	 * @returns {{hit: boolean, targetDefense: number, actorUuid: string, isCritical: boolean}|null}
	 */
	_compareWithDefense(targetActor, rollTotal, criticalStatus) {
		if (!targetActor) return null;
		const defense = targetActor.system?.defense?.value ?? 0;
		return {
			hit: rollTotal >= defense,
			targetDefense: defense,
			actorUuid: targetActor.uuid,
			isCritical: criticalStatus?.isCritical ?? false,
		};
	}

	/**
	 *
	 */
	/**
	 * Parse a weapon's critical formula (e.g. "19/x3", "x4", "20") into the multiplier.
	 * Defaults to 2 when no explicit multiplier is present.
	 * @param {string} formula
	 * @returns {number}
	 */
	static _parseCriticalMultiplier(formula) {
		const f = (formula ?? "").trim();
		if (!f) return 2;
		const xPart = f.includes("/") ? f.split("/").find((p) => p.includes("x")) : f.includes("x") ? f : null;
		if (!xPart) return 2;
		return Number(xPart.replaceAll("x", "")) || 2;
	}

	isCritical(critical = { isCritical: false }, options = {}) {
		const formulaCritical = (critical.crtalFormula ?? "").trim();

		// Separa os valores no formato 19/x3 pela barra e atribui
		// a variaveis com as respectivas conversões em qualquer ordem.
		if (formulaCritical && formulaCritical.includes("/")) {
			for (const crtalFor of formulaCritical.split("/")) {
				if (crtalFor.includes("x")) critical.multiplier = Number(crtalFor.replaceAll("x", ""));
				else critical.margin = Number(crtalFor);
			}
		} else {
			critical.multiplier = (formulaCritical.includes("x") && Number(formulaCritical.replaceAll("x", ""))) || 2;
			critical.margin = (!formulaCritical.includes("x") && Number(formulaCritical)) || 20;
		}
		critical.isCritical = (Number(critical.roll.result.split("+")[0]) || critical.roll.result) >= critical.margin && true;
		return critical;
	}

	/**
	 * Place an attack roll using an item (weapon, feat, spell, or equipment)
	 * Rely upon the d20Roll logic for the core implementation
	 */
	async rollDamage(options = {}) {
		if (!this.system.formulas.damage.parts) throw new Error("This Item does not have a formula to roll!");

		const prepareFormula = [];
		const damageTypes = [];

		// Damage Access
		const damage = this.system.formulas.damage;

		// Critical variable — auto-detect from hitResult if not explicitly passed
		const hitResult = options.hitResult ?? null;
		const critical = options.critical || (hitResult?.isCritical ? { isCritical: true, multiplier: 2 } : false);

		const split = damage.formula.split("d");
		if ((critical.isCritical && options.lastId) || options.event?.altKey) {
			prepareFormula.push(`${split[0] * (critical.multiplier ?? 2)}d${split[1]}`);
		} else {
			prepareFormula.push(damage.formula);
		}

		// Verify the attributes
		for (const [name, attrObject] of Object.entries(this.parent.system.attributes)) {
			if (name == damage.attr) prepareFormula.push(attrObject.value);
		}

		// Get the main type damage
		damageTypes.push(
			game.i18n.has("op.damageTypeAbv." + damage.type)
				? game.i18n.localize("op.damageTypeAbv." + damage.type)
				: game.i18n.localize("op.undefined")
		);

		// Get all the other formulas
		for (const parts of damage.parts) {
			prepareFormula.push(`(${parts[0] || 0})`);
			damageTypes.push(parts[1] ? game.i18n.localize("op.damageTypeAbv." + parts[1]) : "Indefinido");
		}

		// Combine all formulas and types
		const formulas = prepareFormula.join("+");
		const types = damageTypes.join("+").replaceAll("+", " + ");

		const rollConfig = {
			formula: formulas,
			data: this.getRollData(),
			chatMessage: true,
		};

		const roll = await new Roll(rollConfig.formula, rollConfig.data).evaluate();

		if (rollConfig.chatMessage) {
			const flags = {};
			// Only enable auto-apply when the entire roll uses a single damage type.
			// Mixed-type rolls (e.g. 1d6 cutting + 1d6 fire) would resolve incorrectly
			// against a single resistance — leave those for manual GM application.
			const partTypes = (damage.parts ?? []).map((p) => p?.[1]).filter(Boolean);
			const hasMixedTypes = partTypes.some((t) => t !== damage.type);
			if (hitResult?.actorUuid && !hasMixedTypes) {
				flags["ordemparanormal.damageTarget"] = {
					actorUuid: hitResult.actorUuid,
					damageType: damage.type,
					attackMessageId: options.attackMessageId ?? hitResult.attackMessageId ?? this.lastAttackMessageId ?? null,
				};
			}
			await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: game.i18n.format("op.rollDamageChat", { name: this.name, types: types }),
				rollMode: game.settings.get("core", "rollMode"),
				flags: Object.keys(flags).length ? flags : undefined,
			});
		}

		/**
		 * A hook event that fires after a formula has been rolled for an Item.
		 * @function ordemparanormal.rollFormula
		 * @memberof hookEvents
		 * @param {Ordemitem} item  Item for which the roll was performed.
		 * @param {Roll} roll       The resulting roll.
		 */
		Hooks.callAll("ordemparanormal.rollFormula", this, roll);

		return roll;
	}

	/**
	 * Trigger an item usage, optionally creating a chat message with followup actions.
	 **/
	async use(config = {}, options = {}) {
		const item = this;
		// const is = item.system;
		// const as = item.actor.system;

		// options = {
		// 	createMessage: false
		// };

		// Prepare card data & display it if options.createMessage is true
		const cardData = await item.roll(options);
		return cardData;
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async roll() {
		const item = this;

		// Initialize chat data.
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		// const label = 'Exibindo um(a) ' + game.i18n.localize('TYPES.Item.' + item.type) + ` (${item.name}):`;

		// Render the chat card template
		// Tenta obter o token de várias formas para garantir compatibilidade com tokens vinculados e não vinculados
		const token = this.actor.token || this.actor.getActiveTokens()?.[0] || null;
		const targets = game.user?.targets ?? new Set();
		const targetToken = targets.size === 1 ? [...targets][0] : null;
		const templateData = {
			actor: this.actor,
			tokenId: token?.uuid || null,
			item: this,
			data: await this.getChatData(),
			labels: this.labels,
			i18n: {},
			info: [],
			targetName: targetToken?.name ?? null,
		};

		// for (const [key, value] of Object.entries(this.system) ) {
		// 	if (isNaN(value) && Boolean(value)) {}
		// }

		if (item.type == "armament") {
			if (this.system?.proficiency)
				templateData.info.push(game.i18n.localize("op.proficiencyChoices." + this.system.proficiency));
			if (this.system?.critical) templateData.info.push(this.system.critical);
			if (this.system.types?.gripType)
				templateData.info.push(game.i18n.localize("op.weaponGripTypeChoices." + this.system.types.gripType));
			if (this.system.types?.rangeType?.name)
				templateData.info.push(game.i18n.localize("op.weaponTypeChoices." + this.system.types.rangeType.name));
			if (this.system.types?.damageType)
				templateData.info.push(game.i18n.localize("op.damageTypeChoices." + this.system.types.damageType));
			if (this.system.conditions?.improvised) templateData.info.push(game.i18n.localize("op.improvised"));
			if (this.system.conditions?.throwable) templateData.info.push(game.i18n.localize("op.throwable"));
			if (this.system.conditions?.agile) templateData.info.push(game.i18n.localize("op.agile"));
			if (this.system.conditions?.automatic) templateData.info.push(game.i18n.localize("op.automatic"));
			if (this.system.conditions?.adaptableGrip) templateData.info.push(game.i18n.localize("op.adaptableGrip"));
			if (this.system.conditions?.pistolBlow) templateData.info.push(game.i18n.localize("op.pistolBlow"));
		}

		if (item.type == "ritual") {
			if (this.system?.area.name && this.system.target == "area") {
				const area = {
					name: game.i18n.localize("op.areaChoices." + this.system.area.name),
					type: game.i18n.localize("op.areaTypeChoices." + this.system.area.type),
					size: this.system.area.size,
				};
				if (this.system?.area.name == "cone" || this.system?.area.name == "sphere") {
					templateData.i18n.areaLabel = game.i18n.format("op.areaLabelSphereCone", area);
				} else {
					templateData.i18n.areaLabel = game.i18n.format("op.areaLabelCubeLine", area);
				}
			}
		}

		const html = await foundry.applications.handlebars.renderTemplate(
			"systems/ordemparanormal/templates/chat/item-card.html",
			templateData
		);

		const chatMessageData = {
			speaker: speaker,
			rollMode: rollMode,
			content: html,
		};

		// Whisper to GM if roll mode is set to GM rolls
		if (rollMode == "blindroll") chatMessageData.whisper = ChatMessage.getWhisperRecipients("GM");
		if (rollMode == "selfroll") chatMessageData.whisper = [game.user.id];
		if (rollMode == "gmroll") {
			const gmUsers = game.users.filter((u) => u.isGM).map((u) => u.id);
			chatMessageData.whisper = [...new Set([...gmUsers, game.user.id])].flat();
		}
		const message = await ChatMessage.create(chatMessageData);

		Hooks.callAll("ordemparanormal.itemUsed", {
			item: this,
			actor: this.actor,
			token,
			message,
			chatMessageData,
		});
	}

	/**
	 * Prepare data needed to roll an attack using an item (weapon, feat, spell, or equipment)
	 * and then pass it off to `d20Roll`.
	 * @param {object} [options]
	 * @param {boolean} [options.spellLevel]  Level at which a spell is cast.
	 * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance.
	 */
	async rollFormula(/* {spellLevel}={} */) {
		if (!this.system.formulas.extraFormula) throw new Error("This Item does not have a formula to roll!");

		const rollConfig = {
			formula: this.system.formulas.extraFormula,
			data: this.getRollData(),
			chatMessage: true,
		};
		// if ( spellLevel ) rollConfig.data.item.level = spellLevel;

		/**
		 * A hook event that fires before a formula is rolled for an Item.
		 * @function ordemparanormal.preRollFormula
		 * @memberof hookEvents
		 * @param {Item5e} item                 Item for which the roll is being performed.
		 * @param {object} config               Configuration data for the pending roll.
		 * @param {string} config.formula       Formula that will be rolled.
		 * @param {object} config.data          Data used when evaluating the roll.
		 * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
		 * @returns {boolean}                   Explicitly return false to prevent the roll from being performed.
		 */

		// if ( Hooks.call('ordemparanormal.preRollFormula', this, rollConfig) === false ) return;

		const roll = await new Roll(rollConfig.formula, rollConfig.data).evaluate();

		if (rollConfig.chatMessage) {
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `${this.name}`,
				rollMode: game.settings.get("core", "rollMode"),
				// messageData: {'flags.ordemparanormal.roll': {type: 'other', itemId: this.id, itemUuid: this.uuid}}
			});
		}

		/**
		 * A hook event that fires after a formula has been rolled for an Item.
		 * @function ordemparanormal.rollFormula
		 * @memberof hookEvents
		 * @param {Item5e} item  Item for which the roll was performed.
		 * @param {Roll} roll    The resulting roll.
		 */
		Hooks.callAll("ordemparanormal.rollFormula", this, roll);

		return roll;
	}
}
