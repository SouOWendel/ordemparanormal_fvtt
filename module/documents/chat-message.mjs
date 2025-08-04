/** */
export default class ChatMessageOP extends ChatMessage {

	/** @inheritDoc */
	prepareData() {
		super.prepareData();
	}

	/**
	 * Handle rendering of a chat message to the log
	 * @param {ChatLog} app     The ChatLog instance
	 * @param {jQuery} html     Rendered chat message HTML
	 * @param {object} data     Data passed to the render context
	 */
	async getHTML(options={}) {
		const html = await super.getHTML(options);

		if (foundry.utils.getType(this.system?.getHTML) === 'function') {
			await this.system.getHTML(html, options);
			return html;
		}

		this._displayChatActionButtons(html);
		this._highlightCriticalSuccessFailure(html);
		// this._enrichChatCard(html);
		
		/**
     * A hook event that fires after op-specific chat message modifications have completed.
     * @function op.renderChatMessage
     * @memberof hookEvents
     * @param {ChatMessageOP} message  Chat message being rendered.
     * @param {HTMLElement} html       HTML contents of the message.
     */
		Hooks.callAll('op.renderChatMessage', this, html);

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
		const chatCard = html.find('.ordemparanormal.chat-card');
		if ( chatCard.length > 0 ) {
			const flavor = html.find('.flavor-text');
			if ( flavor.text() === html.find('.item-name').text() ) flavor.remove();
		
			// If the user is the message author or the actor owner, proceed
			const actor = game.actors.get(this.speaker.actor);
			const isCreator = game.user.isGM || actor?.isOwner || (this.author.id === game.user.id);
			for (const button of html[0].querySelectorAll('.card-buttons button')) {
				if (button.dataset.visibility === 'all') continue;

				// GM buttons should only be visible to GMs, otherwise button should only be visible to message's creator
				if ( ((button.dataset.visibility === 'gm') && !game.user.isGM) || !isCreator ) button.hidden = true;
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
		// const originatingMessage = this.getOriginatingMessage();
		// const displayChallenge = originatingMessage?.shouldDisplayChallenge;
		// const displayAttackResult = game.user.isGM || (game.settings.get('ordemparanormal', 'attackRollVisibility') !== 'none');

		/**
     * Create an icon to indicate success or failure.
     * @param {string} cls  The icon class.
     * @returns {HTMLElement}
     */
		function makeIcon(type, cls) {
			const icon = document.createElement('i');
			icon.classList.add(type, cls);
			icon.setAttribute('inert', '');
			return icon;
		}

		const totals = html[0].querySelectorAll('.dice-total');
		for (let [index, d20Roll] of this.rolls.entries()) {
			const d0 = d20Roll.dice[0];
			if ( (d0?.faces !== 20) || (d0?.values.length !== 1)) continue;

			d20Roll = ordemparanormal.dice.D20Roll.fromRoll(d20Roll);
			const d = d20Roll.dice[0];

			const isModifiedRoll = ('success' in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
			if ( isModifiedRoll ) continue;

			// Highlight successes and failures
			const total = totals[index];
			if ( !total ) continue;

			if ( d.options.target ) {
				if ( d20Roll.isSuccess ) total.classList.add('success');
				else total.classList.add('failure');
			}

			if ( d20Roll.isCritical ) total.classList.add('critical');
			if ( d20Roll.isFumble ) total.classList.add('fumble');

			const icons = document.createElement('div');
			icons.classList.add('icons');
			if ( total.classList.contains('critical') ) icons.append(makeIcon('fa-regular', 'fa-star-of-david'), makeIcon('fa-regular', 'fa-star-of-david'));
			else if ( total.classList.contains('fumble') ) icons.append(makeIcon('fa-solid', 'fa-car-burst'), makeIcon('fa-solid', 'fa-car-burst'));
			else if ( total.classList.contains('success') ) icons.append(makeIcon('fa-regular', 'fa-thumbs-up'));
			else if ( total.classList.contains('failure') ) icons.append(makeIcon('fa-solid', 'fa-burst'));
			if ( icons.children.length ) total.append(icons);
		}
	}

}