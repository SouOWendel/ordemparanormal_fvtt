const { Die } = foundry.dice.terms;

/**
 * Primary die used when performing a D20 roll.
 */
export default class D20Die extends Die {
	/** */
	constructor({ number=1, faces=20, ...args }={}) {
		super({ number, faces, ...args });
	}

	/* -------------------------------------------- */

	/**
   * Critical success target if no critical failure is set in options.
   * @type {number}
   */
	static CRITICAL_SUCCESS_TOTAL = 20;

	/* -------------------------------------------- */

	/**
   * Critical failure target if no critical failure is set in options.
   * @type {number}
   */
	static CRITICAL_FAILURE_TOTAL = 1;

	/* -------------------------------------------- */

	/**
   * Is the result of this roll a critical success? Returns `undefined` if roll isn't evaluated.
   * @type {boolean|void}
   */
	get isCriticalSuccess() {
		if ( !this.isValid || !this._evaluated ) return false;
		if ( !Number.isNumeric(this.options.criticalSuccess) ) return false;
		return this.total >= this.options.criticalSuccess;
	}

	/* -------------------------------------------- */

	/**
   * Is the result of this roll a critical failure? Returns `undefined` if roll isn't evaluated.
   * @type {boolean|void}
   */
	get isCriticalFailure() {
		if ( !this.isValid || !this._evaluated ) return false;
		if ( !Number.isNumeric(this.options.criticalFailure) ) return false;
		return this.total <= this.options.criticalFailure;
	}

	/* -------------------------------------------- */

	/**
   * Is this a valid challenge die?
   * @type {boolean}
   */
	get isValid() {
		return this.faces === 20;
	}

	/* -------------------------------------------- */
	/*  Die Modification                            */
	/* -------------------------------------------- */

	/**
   * Apply advantage mode to this die.
   * @param {number} advantageMode  Advantage mode to apply.
   */
	applyModifier() {
		this.modifiers.findSplice(m => ['kh', 'kl'].includes(m));
		if (this.number > 0) {
			this.modifiers.push('kh');
		} else {
			this.number = 2;
			this.modifiers.push('kl');
		}
	}

	/**
   * Apply advantage mode to this die.
   * @param {number} advantageMode  Advantage mode to apply.
   */
	applyAdvantage(advantageMode) {
		this.options.advantageMode = advantageMode;
		if ( !(advantageMode === CONFIG.Dice.D20Roll.ADV_MODE.NORMAL)){
			const isAdvantage = advantageMode === CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE;
			this.number += (isAdvantage) ? 1 : -1;
		}
	}

	/* -------------------------------------------- */

	/**
   * Set or unset the specified flag on this die.
   * @param {string} flag      Flag to apply.
   * @param {boolean} enabled  Is the flag enabled?
   */
	applyFlag(flag, enabled) {
		this.options[flag] = enabled;

		// Halfling Lucky, re-roll a natural 1 once
		if ( flag === 'halflingLucky' ) {
			const index = this.modifiers.findIndex(m => m === 'r1=1');
			if ( enabled && (index === -1) ) this.modifiers.push('r1=1');
			else if ( !enabled && (index !== -1) ) this.modifiers.splice(index, 1);
		}
	}

	/* -------------------------------------------- */

	/**
   * Apply a minimum or maximum value to this die.
   * @param {object} values
   * @param {number} [values.minimum]
   * @param {number} [values.maximum]
   */
	applyRange(values) {
		for ( const [key, value] of Object.entries(values) ) {
			this.options[key] = value;
			const mod = key.substring(0, 3);
			this.modifiers.findSplice(m => m.startsWith(mod));
			if ( value ) this.modifiers.push(`${mod}${value}`);
		}
	}
}