// References:
// https://github.com/foundryvtt/dnd5e/blob/559cecf26ddbe6fa3e464c4ae0e04c7466c00163/module/dice/d20-roll.mjs

import D20RollConfigurationDialog from '../applications/d20-configuration-dialog.mjs';
import BasicRoll from './basic-roll.mjs';
import { areKeysPressed } from '../utils.mjs';

/** */
export default class D20Roll extends BasicRoll {
	/**
	 * 
	 * @param {*} formula 
	 * @param {*} data 
	 * @param {*} options 
	 */
	constructor(formula, data, options){
		super(formula, data, options);
		this.#createD20Die();
		if (!this.options.configured) this.configureModifiers();
	}

	static ADV_MODE = {
		NORMAL: 0,
		ADVANTAGE: 1,
		DISADVANTAGE: -1
	};

	/** @inheritDoc */
	static DefaultConfigurationDialog = D20RollConfigurationDialog;

	/* -------------------------------------------- */
	/*  Static Construction                         */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static fromConfig(config, process) {
		// const formula = [new CONFIG.Dice.D20Die().formula].concat(config.parts ?? []).join(' + ');
		const formula = [new CONFIG.Dice.D20Die().formula].concat(config.parts ?? []).join(' + ');
		config.options.criticalSuccess ??= CONFIG.Dice.D20Die.CRITICAL_SUCCESS_TOTAL;
		config.options.criticalFailure ??= CONFIG.Dice.D20Die.CRITICAL_FAILURE_TOTAL;
		config.options.target ??= process.target;
		return new this(formula, config.data, config.options);
	}

	/* -------------------------------------------- */

	/**
   * Create a D20Roll from a standard Roll instance.
   * @param {Roll} roll
   * @returns {D20Roll}
   */
	static fromRoll(roll) {
		const newRoll = new this(roll.formula, roll.data, roll.options);
		Object.assign(newRoll, roll);
		return newRoll;
	}

	/**
   * Determines whether the roll should be fast forwarded and what the default advantage mode should be.
   * @param {D20RollProcessConfiguration} config     Roll configuration data.
   * @param {BasicRollDialogConfiguration} dialog    Data for the roll configuration dialog.
   * @param {BasicRollMessageConfiguration} message  Configuration data that guides roll message creation.
   */
	static applyKeybindings(config, dialog, message) {
		const keys = {
			normal: areKeysPressed(config.event, 'skipDialogNormal'),
			advantage: areKeysPressed(config.event, 'skipDialogAdvantage'),
			disadvantage: areKeysPressed(config.event, 'skipDialogDisadvantage')
		};

		// Should the roll configuration dialog be displayed?
		dialog.configure ??= !Object.values(keys).some(k => k);

		// Determine advantage mode
		for ( const roll of config.rolls ?? [] ) {
			const advantage = roll.options.advantage || config.advantage || keys.advantage;
			const disadvantage = roll.options.disadvantage || config.disadvantage || keys.disadvantage;
			if ( advantage && !disadvantage ) roll.options.advantageMode = this.ADV_MODE.ADVANTAGE;
			else if ( !advantage && disadvantage ) roll.options.advantageMode = this.ADV_MODE.DISADVANTAGE;
			else roll.options.advantageMode = this.ADV_MODE.NORMAL;
		}
	}

	/* -------------------------------------------- */
	/*  Properties                                  */
	/* -------------------------------------------- */

	/**
   * The primary die used in this d20 roll.
   * @type {D20Die|void}
   */
	get d20() {
		if ( !(this.terms[0] instanceof foundry.dice.terms.Die) ) return null;
		if ( !(this.terms[0] instanceof CONFIG.Dice.D20Die) ) this.#createD20Die();
		return this.terms[0];
	}

	/* -------------------------------------------- */

	/**
   * Set the d20 for this roll.
   */
	set d20(die) {
		if ( !(die instanceof CONFIG.Dice.D20Die) ) throw new Error(
			`D20 die must be an instance of ${CONFIG.Dice.D20Die.name}, instead a ${die.constructor.name} was provided.`
		);
		this.terms[0] = die;
	}

	/* -------------------------------------------- */

	/**
   * A convenience reference for whether this D20Roll has advantage.
   * @type {boolean}
   */
	get hasAdvantage() {
		return this.options.advantageMode === this.constructor.ADV_MODE.ADVANTAGE;
	}

	/* -------------------------------------------- */

	/**
   * A convenience reference for whether this D20Roll has disadvantage.
   * @type {boolean}
   */
	get hasDisadvantage() {
		return this.options.advantageMode === this.constructor.ADV_MODE.DISADVANTAGE;
	}

	/* -------------------------------------------- */

	/**
   * Is this roll a critical success? Returns undefined if roll isn't evaluated.
   * @type {boolean|void}
   */
	get isCritical() {
		return this.d20.isCriticalSuccess;
	}

	/* -------------------------------------------- */

	/**
   * Is this roll a critical failure? Returns undefined if roll isn't evaluated.
   * @type {boolean|void}
   */
	get isFumble() {
		return this.d20.isCriticalFailure;
	}

	/** */
	get isKeepHighest() {
		return this.terms[0].modifiers.includes('kh');
	}

	/* -------------------------------------------- */

	/**
   * Does this roll start with a d20?
   * @type {boolean}
   */
	get validD20Roll() {
		return (this.d20 instanceof CONFIG.Dice.D20Die) && this.d20.isValid;
	}

	/**
   * 
   * @type {integer}
   */
	get attribute() {
		return (!(foundry.utils.isEmpty(this.data))) ? this.data?.attributes[this.data?.attributeId] : { value: 1 };
	}

	/* -------------------------------------------- */
	/*  Chat Messages                               */
	/* -------------------------------------------- */

	/** @override */
	static _prepareMessageData(rolls, messageData) {
		let advantage = true;
		let disadvantage = true;

		for ( const roll of rolls ) {
			if ( !roll.validD20Roll ) continue;
			if ( !roll.hasAdvantage ) advantage = false;
			if ( !roll.hasDisadvantage ) disadvantage = false;
		}

		messageData.flavor ??= '';
		if ( advantage ) messageData.flavor += ` (${game.i18n.localize('op.Advantage')})`;
		else if ( disadvantage ) messageData.flavor += ` (${game.i18n.localize('op.Disadvantage')})`;
	}

	/* -------------------------------------------- */
	/*  Roll Configuration                          */
	/* -------------------------------------------- */

	/**
   * Apply optional modifiers which customize the behavior of the d20term
   * @private
   */
	configureModifiers() {
		if ( !this.validD20Roll ) return;
		
		this.d20.number = this.attribute.value;

		if ( this.options.advantageMode === undefined ) {
			const { advantage, disadvantage } = this.options;
			if ( advantage && !disadvantage ) this.options.advantageMode = this.constructor.ADV_MODE.ADVANTAGE;
			else if ( !advantage && disadvantage ) this.options.advantageMode = this.constructor.ADV_MODE.DISADVANTAGE;
			else this.options.advantageMode = this.constructor.ADV_MODE.NORMAL;
		}

		// Directly modify the d20
		this.d20.applyAdvantage(this.options.advantageMode);
		this.d20.applyModifier();
		// this.applyOrderParanormalD20Rules();

		// Assign critical and fumble thresholds
		if ( this.options.criticalSuccess ) this.d20.options.criticalSuccess = this.options.criticalSuccess;
		if ( this.options.criticalFailure ) this.d20.options.criticalFailure = this.options.criticalFailure;
		if ( this.options.target ) this.d20.options.target = this.options.target;

		// Re-compile the underlying formula
		this.resetFormula();

		// Mark configuration as complete
		this.options.configured = true;
	}

	/**
   * Ensure the d20 die for this roll is actually a D20Die instance.
   */
	#createD20Die() {
		if ( this.terms[0] instanceof CONFIG.Dice.D20Die ) return;
		if ( !(this.terms[0] instanceof foundry.dice.terms.Die) ) return;
		const { number, faces, ...data } = this.terms[0];
		this.terms[0] = new CONFIG.Dice.D20Die({ ...data, number, faces });
	}

	/* -------------------------------------------- */
	/*  Configuration Dialog                        */
	/* -------------------------------------------- */

	/**
   * Create a Dialog prompt used to configure evaluation of an existing D20Roll instance.
   * @param {object} data                     Dialog configuration data
   * @param {string} [data.title]             The title of the shown dialog window
   * @param {number} [data.defaultRollMode]   The roll mode that the roll mode select element should default to
   * @param {number} [data.defaultAction]     The button marked as default
   * @param {FormSelectOption[]} [data.ammunitionOptions]  Selectable ammunition options.
   * @param {FormSelectOption[]} [data.attackModes]        Selectable attack modes.
   * @param {boolean} [data.chooseModifier]   Choose which ability modifier should be applied to the roll?
   * @param {string} [data.defaultAbility]    For tool rolls, the default ability modifier applied to the roll
   * @param {FormSelectOption[]} [data.masteryOptions]     Selectable weapon masteries.
   * @param {string} [data.template]          A custom path to an HTML template to use instead of the default
   * @param {object} options                  Additional Dialog customization options
   * @returns {Promise<D20Roll|null>}         A resulting D20Roll object constructed with the dialog, or null if the
   *                                          dialog was closed
   */
	async configureDialog({
		title, defaultRollMode, defaultAction=D20Roll.ADV_MODE.NORMAL, ammunitionOptions,
		attackModes, chooseModifier=false, defaultAbility, masteryOptions, template
	}={}, options={}) {
		let DialogClass = this.constructor.DefaultConfigurationDialog;
		if ( chooseModifier ) DialogClass = SkillToolRollConfigurationDialog;
		// else if ( ammunitionOptions || attackModes || masteryOptions ) DialogClass = AttackRollConfigurationDialog;
		const defaultButton = {
			[D20Roll.ADV_MODE.NORMAL]: 'normal',
			[D20Roll.ADV_MODE.ADVANTAGE]: 'advantage',
			[D20Roll.ADV_MODE.DISADVANTAGE]: 'disadvantage'
		}[String(defaultAction ?? '0')];
		return await DialogClass.configure(
			{ rolls: [{ parts: [this.formula.replace(roll.d20.formula, '')], options: this.options }] },
			{ options: { ammunitionOptions, attackModes, defaultButton, masteryOptions, title } },
			{ rollMode: defaultRollMode }
		);
	}
}