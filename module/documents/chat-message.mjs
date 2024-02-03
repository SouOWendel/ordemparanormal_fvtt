/**
 * 
 * @param {*} data 
 * @returns 
 */
function whoIsActorOwner(data) {
	// If the user is the message author or the actor owner, proceed
	const actor = game.actors.get(data.message.speaker.actor);
	return actor;
}

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
		const actor = whoIsActorOwner(data);
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
 * Highlight critical success or failure on d20 rolls.
 * @param {ChatMessage} message  Message being prepared.
 * @param {HTMLElement} html     Rendered contents of the message.
 * @param {object} data          Configuration data passed to the message.
 */
export function highlightCriticalSuccessFailure(message, html, data) {

	const itemMessageFlag = message.getFlag('ordemparanormal', 'messageRoll');

	if ( !message.isRoll || !message.isContentVisible || !message.rolls.length ) return;
	// Highlight rolls where the first part is a d20 roll
	let d20Roll = message.rolls.find(r => {
	  const d0 = r.dice[0];
	  return (d0?.faces === 20) && (d0?.values.length === 1);
	});
	if ( !d20Roll ) return;
	d20Roll = ordemparanormal.dice.D20Roll.fromRoll(d20Roll);
	const d = d20Roll.dice[0];

	const isModifiedRoll = ('success' in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
	if ( isModifiedRoll ) return;

	// const actor = whoIsActorOwner(data);
  
	// Highlight successes and failures
	if ( itemMessageFlag?.isCritical ) html.find('.dice-total').addClass('critical').append('<small>(Critical)</small>');
	else if ( itemMessageFlag?.isFumble ) html.find('.dice-total').addClass('fumble');
	else if ( d.options.target ) {
	  if ( itemMessageFlag.total >= d.options.target ) html.find('.dice-total').addClass('success');
	  else html.find('.dice-total').addClass('failure');
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
	highlightCriticalSuccessFailure(app, html, data);
	// if (game.settings.get('ordemparanormal', 'autoCollapseItemCards')) html.find('.card-content').hide();
}