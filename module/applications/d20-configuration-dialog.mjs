import RollConfigurationDialog from './roll-configuration-dialog.mjs';

/** */
export default class D20RollConfigurationDialog extends RollConfigurationDialog {
	/** @override */
	static get rollType(){
		return CONFIG.Dice.D20Roll;
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */
	
	/** @override */
	async _prepareButtonsContext(context, options) {
		let defaultButton = this.options.defaultButton;
		if (!defaultButton){
			let advantage = false;
			let disadvantage = false;
			for (const roll of this.config.rolls){
				if (!roll.options) continue;
				if (roll.options.advantageMode === CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE) advantage = true;
				else if (roll.options.advantageMode === CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE) disadvantage = true;
				else if (roll.options.advantageMode && !roll.options.disadvantage) advantage = true;
				else if (roll.options.advantageMode && roll.options.disadvantage) disadvantage = true;
			}
			if (advantage && !disadvantage) defaultButton = 'advantage';
			else if (!advantage && disadvantage) defaultButton = 'disadvantage';
		}
		context.buttons = {
			advantage: {
				default: defaultButton === 'advantage',
				label: '',
				icons: ['fa-solid fa-plus', 'fa-solid fa-dice-d20']
			},
			normal: {
				default: !['advantage', 'disadvantage'].includes(defaultButton),
				label: game.i18n.localize('op.Normal'),
				icon: ['','']
			},
			disadvantage: {
				default: defaultButton === 'disadvantage',
				label: '',
				icons: ['fa-solid fa-minus', 'fa-solid fa-dice-d20']
			}
		};
		return context;
	}

	/* -------------------------------------------- */
	/*  Roll Handling                               */
	/* -------------------------------------------- */

	/** @override */
	_finalizeRolls(action) {
		let advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.NORMAL;
		if (action === 'advantage') advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE;
		else if (action === 'disadvantage') advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
		return this.rolls.map(roll => {
			roll.options.advantageMode = advantageMode;
			roll.configureModifiers();
			return roll;
		});
	}
}