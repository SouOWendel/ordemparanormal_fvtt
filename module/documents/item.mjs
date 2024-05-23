/* eslint-disable indent */
/**
 * References and Codes of DND5e system:
 * https://github.com/foundryvtt/dnd5e/blob/a7f1404c7c38afa6d7dcc4f36a5fefd274034691/templates/chat/item-card.hbs
 * https://github.com/foundryvtt/dnd5e/blob/a7f1404c7c38afa6d7dcc4f36a5fefd274034691/module/documents/item.mjs#L1639
 */

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
		// If present, return the actor's roll data.
		if (!this.actor) return null;
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
		html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
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
		const button = event.currentTarget;
		button.disabled = true;
		const card = button.closest('.chat-card');
		const messageId = card.closest('.message').dataset.messageId;
		const message = game.messages.get(messageId);
		const action = button.dataset.action;

		// Recover the actor for the chat card
		const actor = await this._getChatCardActor(card);
		if (!actor) return;

		// Validate permission to proceed with the roll
		const isTargetted = action === 'save';
		if (!(isTargetted || game.user.isGM || actor.isOwner)) return;

		// Get the Item from stored flag data or by the item ID on the Actor
		const storedData = message.getFlag('ordemparanormal', 'itemData');
		const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
		// if ( !item ) {
		//   const err = game.i18n.format('ordemparanormal.ActionWarningNoItem', {item: card.dataset.itemId, name: actor.name});
		//   return ui.notifications.error(err);
		// }
		// const spellLevel = parseInt(card.dataset.spellLevel) || null;

		// Handle different actions
		// let targets;
		switch (action) {
			case 'attack': {
				const rollAttack = await item.rollAttack({
					event: event,
				});
				item.lastMessageId = messageId;
				item.critical = rollAttack.criticalStatus;
				break;
			}
			case 'damage':
				// case 'versatile':
				await item.rollDamage({
					event: event,
					critical: item.critical,
					lastId: item.lastMessageId == messageId,
					// spellLevel: spellLevel,
					// versatile: action === 'versatile'
				});
				break;
			case 'formula':
				await item.rollFormula({ event });
				break;
			case 'teste':
				console.log('teste');
				break;
			//   case 'save':
			// 	targets = this._getChatCardTargets(card);
			// 	for ( const token of targets ) {
			// 	  const speaker = ChatMessage.getSpeaker({scene: canvas.scene, token: token.document});
			// 	  await token.actor.rollAbilitySave(button.dataset.ability, { event, speaker });
			// 	}
			// 	break;
			//   case 'toolCheck':
			// 	await item.rollToolCheck({event}); break;
			//   case 'placeTemplate':
			// 	try {
			// 	  await ordemparanormal.canvas.AbilityTemplate.fromItem(item)?.drawPreview();
			// 	} catch(err) {
			// 	  Hooks.onError('Item5e._onChatCardAction', err, {
			// 			msg: game.i18n.localize('ordemparanormal.PlaceTemplateError'),
			// 			log: 'error',
			// 			notify: 'error'
			// 	  });
			// 	}
			// 	break;
			//   case 'abilityCheck':
			// 	targets = this._getChatCardTargets(card);
			// 	for ( const token of targets ) {
			// 	  const speaker = ChatMessage.getSpeaker({scene: canvas.scene, token: token.document});
			// 	  await token.actor.rollAbilityTest(button.dataset.ability, { event, speaker });
			// 	}
			// 	break;
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
		return game.actors.get(actorId) || null;
	}

	/**
	 * Prepare an object of chat data used to display a card for the Item in the chat log.
	 * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
	 * @returns {object}              An object of chat data to render.
	 */
	async getChatData(htmlOptions = {}) {
		const data = this.toObject().system;

		// Rich text description
		data.description = await TextEditor.enrichHTML(data.description, {
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
			throw new Error('This Item does not have a formula to roll!');

		const attack = this.system.formulas.attack;
		const bonus = attack.bonus && '+' + attack.bonus;
		let attr = attack.attr;
		let skill = attack.skill;
		let rollMode = 'kh';

		for (const [i, attrParent] of Object.entries(this.parent.system.attributes)) {
			if (i == attr) {
				if (attrParent.value == 0) {
					attr = 2;
					rollMode = 'kl';
				} else attr = attrParent.value;
			}
		}

		for (const [i, skillParent] of Object.entries(this.parent.system.skills)) {
			if (i == skill) skill = '+' + skillParent.value;
		}

		const rollConfig = {
			formula: attr + 'd20' + rollMode + skill + bonus,
			data: this.getRollData(),
			chatMessage: true,
		};
		// if ( spellLevel ) rollConfig.data.item.level = spellLevel;

		/**
		 * A hook event that fires before a formula is rolled for an Item.
		 * @function ordemparanormal.preRollFormula
		 * @memberof hookEvents
		 * @param {OrdemItem} item              Item for which the roll is being performed.
		 * @param {object} config               Configuration data for the pending roll.
		 * @param {string} config.formula       Formula that will be rolled.
		 * @param {object} config.data          Data used when evaluating the roll.
		 * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
		 * @returns {boolean}                   Explicitly return false to prevent the roll from being performed.
		 */

		// if ( Hooks.call('ordemparanormal.preRollFormula', this, rollConfig) === false ) return;

		const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({
			async: true,
		});

		// Verificações de Crítico
		const criticalStatus = this.isCritical({
			crtalFormula: this.system.critical,
			roll,
		});

		if (rollConfig.chatMessage) {
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `Atacou com ${this.name}`,
				rollMode: game.settings.get('core', 'rollMode'),
				flags: {
					'ordemparanormal.messageRoll': {
						type: 'attack',
						itemId: this.id,
						itemUuid: this.uuid,
						isCritical: criticalStatus.isCritical,
					},
				},
			});
		}

		/**
		 * A hook event that fires after a formula has been rolled for an Item.
		 * @function ordemparanormal.rollFormula
		 * @memberof hookEvents
		 * @param {OrdemItem} item  Item for which the roll was performed.
		 * @param {Roll} roll       The resulting roll.
		 */
		Hooks.callAll('ordemparanormal.rollFormula', this, roll);

		return { roll, criticalStatus };
	}

	/**
	 *
	 */
	isCritical(critical = { isCritical: false }, options = {}) {
		const formulaCritical = critical.crtalFormula.trim();

		// Separa os valores no formato 19/x3 pela barra e atribui
		// a variaveis com as respectivas conversões em qualquer ordem.
		if (formulaCritical && formulaCritical.includes('/')) {
			for (const crtalFor of critical.crtalFormula.split('/')) {
				if (crtalFor.includes('x')) critical.multiplier = Number(crtalFor.replaceAll('x', ''));
				else critical.margin = Number(crtalFor);
			}
		} else {
			critical.multiplier = (formulaCritical.includes('x') && formulaCritical.replaceAll('x', '')) || 2;
			critical.margin = (!formulaCritical.includes('x') && formulaCritical) || 20;
		}

		critical.isCritical = (Number(critical.roll.result.split('+')[0]) || critical.roll.result) >= critical.margin && true;

		return critical;
	}

	/**
	 * Place an attack roll using an item (weapon, feat, spell, or equipment)
	 * Rely upon the d20Roll logic for the core implementation
	 */
	async rollDamage(options = {}) {
		if (!this.system.formulas.damage.parts) throw new Error('This Item does not have a formula to roll!');

		const prepareFormula = [];
		const damageTypes = [];

		// Damage Access
		const damage = this.system.formulas.damage;

		// Critical variable
		const critical = options.critical || false;

		const split = damage.formula.split('d');
		if ((critical.isCritical && options.lastId) || options.event.altKey) {
			prepareFormula.push(`${split[0] * critical.multiplier}d${split[1]}`);
		} else {
			prepareFormula.push(damage.formula);
		}

		// Verify the attributes
		for (const [name, attrObject] of Object.entries(this.parent.system.attributes)) {
			if (name == damage.attr) prepareFormula.push(attrObject.value);
		}

		// Get the main type damage
		damageTypes.push(game.i18n.localize('ordemparanormal.damageTypeAbv.' + damage.type));

		// Get all the other formulas
		for (const parts of damage.parts) {
			prepareFormula.push(`(${parts[0] || 0})`);
			damageTypes.push(parts[1] ? game.i18n.localize('ordemparanormal.damageTypeAbv.' + parts[1]) : 'Indefinido');
		}

		// Combine all formulas and types
		const formulas = prepareFormula.join('+');
		const types = damageTypes.join('+').replaceAll('+', ' + ');

		const rollConfig = {
			formula: formulas,
			data: this.getRollData(),
			chatMessage: true,
		};
		// if ( spellLevel ) rollConfig.data.item.level = spellLevel;

		/**
		 * A hook event that fires before a formula is rolled for an Item.
		 * @function ordemparanormal.preRollFormula
		 * @memberof hookEvents
		 * @param {OrdemItem} item              Item for which the roll is being performed.
		 * @param {object} config               Configuration data for the pending roll.
		 * @param {string} config.formula       Formula that will be rolled.
		 * @param {object} config.data          Data used when evaluating the roll.
		 * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
		 * @returns {boolean}                   Explicitly return false to prevent the roll from being performed.
		 */

		// if ( Hooks.call('ordemparanormal.preRollFormula', this, rollConfig) === false ) return;

		const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({
			async: true,
		});

		if (rollConfig.chatMessage) {
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `Deu dano com ${this.name}. <br>(${types})`,
				rollMode: game.settings.get('core', 'rollMode'),
				// messageData: {'flags.ordemparanormal.roll': {type: 'other', itemId: this.id, itemUuid: this.uuid}}
			});
		}

		/**
		 * A hook event that fires after a formula has been rolled for an Item.
		 * @function ordemparanormal.rollFormula
		 * @memberof hookEvents
		 * @param {Ordemitem} item  Item for which the roll was performed.
		 * @param {Roll} roll       The resulting roll.
		 */
		Hooks.callAll('ordemparanormal.rollFormula', this, roll);

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
		const rollMode = game.settings.get('core', 'rollMode');
		// const label = 'Exibindo um(a) ' + game.i18n.localize('TYPES.Item.' + item.type) + ` (${item.name}):`;

		// Render the chat card template
		const token = this.actor.token;
		const templateData = {
			actor: this.actor,
			tokenId: token?.uuid || null,
			item: this,
			data: await this.getChatData(),
			labels: this.labels,
			system: [],
			info: [],
		};

		if (item.type == 'armament') {
			if (this.system?.proficiency)
				templateData.info.push(game.i18n.localize('ordemparanormal.proficiencyChoices.' + this.system.proficiency));
			if (this.system?.critical) templateData.info.push(this.system.critical);
			if (this.system.types?.gripType)
				templateData.info.push(game.i18n.localize('ordemparanormal.weaponGripTypeChoices.' + this.system.types.gripType));
			if (this.system.types?.rangeType?.name)
				templateData.info.push(game.i18n.localize('ordemparanormal.weaponTypeChoices.' + this.system.types.rangeType.name));
			if (this.system.types?.damageType)
				templateData.info.push(game.i18n.localize('ordemparanormal.damageTypeChoices.' + this.system.types.damageType));
			if (this.system.conditions?.improvised) templateData.info.push(game.i18n.localize('ordemparanormal.improvised'));
			if (this.system.conditions?.throwable) templateData.info.push(game.i18n.localize('ordemparanormal.throwable'));
			if (this.system.conditions?.agile) templateData.info.push(game.i18n.localize('ordemparanormal.agile'));
			if (this.system.conditions?.automatic) templateData.info.push(game.i18n.localize('ordemparanormal.automatic'));
			if (this.system.conditions?.adaptableGrip)
				templateData.info.push(game.i18n.localize('ordemparanormal.adaptableGrip'));
			if (this.system.conditions?.pistolBlow) templateData.info.push(game.i18n.localize('ordemparanormal.pistolBlow'));
		}

		if (item.type == 'ritual') {
			if (this.system?.circle) templateData.system.push(this.system.circle);
			if (this.system?.studentForm) templateData.system.push(this.system.studentForm);
			if (this.system?.trueForm) templateData.system.push(this.system.trueForm);
		}

		const html = await renderTemplate('systems/ordemparanormal/templates/chat/item-card.html', templateData);
		// If there's no roll data, send a chat message.
		// if (!this.system.formulas) {
		ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			// flavor: label,
			content: html,
			// content: item.system.description ?? '',
		});
		// }
		// // Otherwise, create a roll and send a chat message from it.
		// else {
		// Retrieve roll data.
		// const rollData = this.getRollData();

		// // Invoke the roll and submit it to chat.
		// const roll = new Roll(rollData.item.damage, rollData);

		// // If you need to store the value first, uncomment the next line.
		// // let result = await roll.roll({async: true});
		// roll.toMessage({
		// 	speaker: speaker,
		// 	rollMode: rollMode,
		// 	flavor: label,
		// });

		// 	ChatMessage.create({
		// 		speaker: speaker,
		// 		rollMode: rollMode,
		// 		flavor: label,
		// 		content: html,
		// 	});

		// 	// return roll;
		// }
	}

	/**
	 * Prepare data needed to roll an attack using an item (weapon, feat, spell, or equipment)
	 * and then pass it off to `d20Roll`.
	 * @param {object} [options]
	 * @param {boolean} [options.spellLevel]  Level at which a spell is cast.
	 * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance.
	 */
	async rollFormula(/* {spellLevel}={} */) {
		if (!this.system.formulas.extraFormula) throw new Error('This Item does not have a formula to roll!');

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

		const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({
			async: true,
		});

		if (rollConfig.chatMessage) {
			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `${this.name}`,
				rollMode: game.settings.get('core', 'rollMode'),
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
		Hooks.callAll('ordemparanormal.rollFormula', this, roll);

		return roll;
	}
}
