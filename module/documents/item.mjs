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
		if ( !actor ) return;
	
		// Validate permission to proceed with the roll
		const isTargetted = action === 'save';
		if ( !( isTargetted || game.user.isGM || actor.isOwner ) ) return;
	
		// Get the Item from stored flag data or by the item ID on the Actor
		const storedData = message.getFlag('ordemparanormal', 'itemData');
		const item = storedData ? new this(storedData, {parent: actor}) : actor.items.get(card.dataset.itemId);
		// if ( !item ) {
		//   const err = game.i18n.format('ordemparanormal.ActionWarningNoItem', {item: card.dataset.itemId, name: actor.name});
		//   return ui.notifications.error(err);
		// }
		// const spellLevel = parseInt(card.dataset.spellLevel) || null;
	
		// Handle different actions
		// let targets;
		switch ( action ) {
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
				lastId: item.lastMessageId == messageId
				// spellLevel: spellLevel,
				// versatile: action === 'versatile'
			});
			break;
		case 'formula':
			await item.rollFormula({event}); 
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
		if ( card.dataset.tokenId ) {
			const token = await fromUuid(card.dataset.tokenId);
			if ( !token ) return null;
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
	async getChatData(htmlOptions={}) {
		const data = this.toObject().system;
	
		// Rich text description
		data.description = await TextEditor.enrichHTML(data.description, {
		  async: true,
		  relativeTo: this,
		  rollData: this.getRollData(),
		  ...htmlOptions
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
	async rollAttack(options={}) {
		if ( !this.system.formulas.attackFormula.attr || !this.system.formulas.attackFormula.skill) throw new Error('This Item does not have a formula to roll!');

		const attack = this.system.formulas.attackFormula;
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
		  chatMessage: true
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
	
		const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({async: true});

		// Verificações de Crítico
		const criticalStatus = this.isCritical({crtalFormula: this.system.critical, roll});

		if ( rollConfig.chatMessage ) {
		  roll.toMessage({
				speaker: ChatMessage.getSpeaker({actor: this.actor}),
				flavor: `Atacou com ${this.name}`,
				rollMode: game.settings.get('core', 'rollMode'),
				flags: {'ordemparanormal.messageRoll': {type: 'attack', itemId: this.id, itemUuid: this.uuid, isCritical: criticalStatus.isCritical}},
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
	
		return {roll, criticalStatus};
	}

	/**
	 * 
	 */
	isCritical(critical={isCritical: false}, options={}){
		// Separa os valores no formato 19/x3 pela barra e atribui
		// a variaveis com as respectivas conversões em qualquer ordem.
		if(critical.crtalFormula && critical.crtalFormula.includes('/')){
			for(const crtal of critical.crtalFormula.split('/')) {
				if (crtal.includes('x')) critical.multiplier = Number(crtal.replace('x', ''));
				else critical.margin = Number(crtal);
			}
		} else {
			critical.multiplier = critical.crtalFormula.includes('x') && critical.crtalFormula.replace('x', '') || 2;
			critical.margin = !critical.crtalFormula.includes('x') && critical.crtalFormula || 20;
		}

		critical.isCritical = (Number(critical.roll.result.split('+')[0]) || critical.roll.result) >= critical.margin && true;

		return critical;
	}

	/**
   * Place an attack roll using an item (weapon, feat, spell, or equipment)
   * Rely upon the d20Roll logic for the core implementation
   */
	async rollDamage(options={}) {
		if ( !this.system.formulas.damageFormula.formula ) throw new Error('This Item does not have a formula to roll!');

		const damage = this.system.formulas.damageFormula;
		const bonus = damage.bonus && '+' + damage.bonus;
		const critical = await options.critical || false;
		const dice = damage.formula.split('d');
		const rollform = ((critical.isCritical && options.lastId) | options.event.altKey) ? `${dice[0]*critical.multiplier}d${dice[1]}` : damage.formula;
		let attr = damage.attr;

		for (const [i, attrParent] of Object.entries(this.parent.system.attributes)) {
			if (i == attr) attr = '+' + attrParent.value;
		}

		const rollConfig = {
			formula: rollform + attr + bonus,
			data: this.getRollData(),
			chatMessage: true
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
	
		const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({async: true});
	
		if ( rollConfig.chatMessage ) {
		  roll.toMessage({
				speaker: ChatMessage.getSpeaker({actor: this.actor}),
				flavor: `Deu dano com ${this.name}`,
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
	async use(config={}, options={}) {
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
		const item = this.data;

		// Initialize chat data.
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get('core', 'rollMode');
		const label = 'Exibindo um(a) ' + game.i18n.localize('TYPES.Item.' + item.type) + ` (${item.name}):`;

		// Render the chat card template
		const token = this.actor.token;
		const templateData = {
		  actor: this.actor,
		  tokenId: token?.uuid || null,
		  item: this,
		  data: await this.getChatData(),
		  labels: this.labels,
		  info: []
		};

		if (this.system.proficiency) templateData.info.push('proficiencyChoices.' + this.system.proficiency);
		if (this.system.types.gripType) templateData.info.push('weaponGripTypeChoices.' + this.system.types.gripType);
		if (this.system.types.rangeType.name) templateData.info.push('weaponTypeChoices.' + this.system.types.rangeType.name); 
		if (this.system.types.damageType) templateData.info.push('damageTypeChoices.' + this.system.types.damageType);
		if (this.system.conditions.improvised) templateData.info.push('improvised');
		if (this.system.conditions.throwable) templateData.info.push('throwable');
		if (this.system.conditions.agile) templateData.info.push('agile');
		if (this.system.conditions.automatic) templateData.info.push('automatic');
		if (this.system.conditions.adaptableGrip) templateData.info.push('adaptableGrip');
		if (this.system.conditions.pistolBlow) templateData.info.push('pistolBlow');

		// for (const [i, value] of Object.entries(this.system)) {
		// 	if (
		// 		this.system.proficiency || this.system.types.gripType ||
		// 		this.system.types.rangeType.name || this.system.types.damageType ||
		// 		this.system.conditions.improvised || this.system.conditions.throwable ||
		// 		this.system.conditions.agile || this.system.conditions.automatic ||
		// 		this.system.conditions.adaptableGrip || this.system.conditions.pistolBlow
		// 	) {
		// 		templateData.info.push(value);
		// 	}
		// }

		const html = await renderTemplate('systems/ordemparanormal/templates/chat/item-card.html', templateData);

		// If there's no roll data, send a chat message.
		if (!this.system.formulas) {
			ChatMessage.create({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
				content: item.system.description ?? '',
			});
		}
		// Otherwise, create a roll and send a chat message from it.
		else {
			// Retrieve roll data.
			// const rollData = this.getRollData();

			// // Invoke the roll and submit it to chat.
			// const roll = new Roll(rollData.item.damageFormula, rollData);

			// // If you need to store the value first, uncomment the next line.
			// // let result = await roll.roll({async: true});
			// roll.toMessage({
			// 	speaker: speaker,
			// 	rollMode: rollMode,
			// 	flavor: label,
			// });

			ChatMessage.create({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
				content: html,
			});

			// return roll;
		}
	}

	/**
   * Prepare data needed to roll an attack using an item (weapon, feat, spell, or equipment)
   * and then pass it off to `d20Roll`.
   * @param {object} [options]
   * @param {boolean} [options.spellLevel]  Level at which a spell is cast.
   * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance.
   */
	async rollFormula(/* {spellLevel}={} */) {
		if ( !this.system.formulas.extraFormula ) throw new Error('This Item does not have a formula to roll!');
	
		const rollConfig = {
		  formula: this.system.formulas.extraFormula,
		  data: this.getRollData(),
		  chatMessage: true
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
	
		const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({async: true});
	
		if ( rollConfig.chatMessage ) {
		  roll.toMessage({
				speaker: ChatMessage.getSpeaker({actor: this.actor}),
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
