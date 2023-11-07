/**
 * Optionally hide the display of chat card action buttons which cannot be performed by the user
 * @param {ChatMessage} message  Message being prepared.
 * @param {HTMLElement} html     Rendered contents of the message.
 * @param {object} data          Configuration data passed to the message.
 */
export function displayChatActionButtons(message, html, data) {
	const chatCard = html.find('.ordemparanormal.chat-card');
	if ( chatCard.length > 0 ) {
		const flavor = html.find('.flavor-text');
		if ( flavor.text() === html.find('.item-name').text() ) flavor.remove();
  
		// If the user is the message author or the actor owner, proceed
		const actor = game.actors.get(data.message.speaker.actor);
		if ( actor && actor.isOwner ) return;
		else if ( game.user.isGM || (data.author.id === game.user.id)) return;
  
		// Otherwise conceal action buttons except for saving throw
		const buttons = chatCard.find('button[data-action]');
		buttons.each((i, btn) => {
			if ( btn.dataset.action === 'save' ) return;
			btn.style.display = 'none';
		});
	}
}

/**
 * Handle rendering of a chat message to the log
 * @param {ChatLog} app     The ChatLog instance
 * @param {jQuery} html     Rendered chat message HTML
 * @param {object} data     Data passed to the render context
 */
export function onRenderChatMessage(app, html, data) {
	displayChatActionButtons(app, html, data);
	// highlightCriticalSuccessFailure(app, html, data);
	// if (game.settings.get('ordemparanormal', 'autoCollapseItemCards')) html.find('.card-content').hide();
}