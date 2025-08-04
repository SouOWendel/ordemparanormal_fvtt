
/**
 * 
 * @param {*} param0 
 * @returns 
 */
export async function d20Roll(document, {
	parts=[], data={}, event, critical=15, shiftFastForward, template, title, type,
	chatMessage=true, messageData={}, rollMode, flavor, hasCritical=false, chatTemplate
}={}) {

	const rollDialog = await new RollConfigurationDialog(document);
	rollDialog.render(true);

	// Handle input arguments
	let value;
	if (type == 'skill') value = data.attr[1];
	else if (type == 'attribute') value = data.value;

	const mode = (value > 0) ? 'kh': 'kl';
	if (mode == 'kl') value = 2 + (value*-1);
	let formula = [`${value}d20${mode}`];

	// Additional numbers
	parts = parts.filter((x) => (x !== null && x !== 0));
	if (parts) formula = formula.concat(parts).join(' + ');
	const defaultRollMode = rollMode || game.settings.get('core', 'rollMode');

	// Construct the D20Roll instance
	const roll = new CONFIG.Dice.D20Roll(formula, data, {
		flavor: flavor || title,
		defaultRollMode,
		rollMode,
		critical,
		hasCritical,
		chatTemplate,
		document
	});

	const options = {
		data
	};

	// Variável com os dados do Dialog
	if (shiftFastForward) {
		const configured = await roll.configureDialog({
			title,
			defaultRollMode,
			template
		}, options);
		if (configured === null) return null;
	} else roll.options.rollMode ??= defaultRollMode;

	// Evaluate the configured roll
	await roll.evaluate({allowInteractive: (roll.options.rollMode ?? defaultRollMode) !== CONST.DICE_ROLL_MODES.BLIND});

	// Attach original message ID to the message
	messageData = foundry.utils.expandObject(messageData);
	const messageId = event?.target.closest('[data-message-id]')?.dataset.messageId;
	if ( messageId ) foundry.utils.setProperty(messageData, 'flags.shinobinosho.originatingMessage', messageId);

	// Create a Chat Message
	if ( roll && chatMessage ) await roll.toMessage(messageData);
	return roll;
}