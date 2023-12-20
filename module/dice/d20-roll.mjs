/**
 * A type of Roll specific to a d20-based check.
 * @param {string} formula    The string formula to parse
 * @param {object} data       The data object against which to parse attributes within the formula
 * 
**/
export default class D20Roll extends Roll {
	// eslint-disable-next-line require-jsdoc
	constructor(formula, data, options) {
		super(formula, data, options);
		// if ( !this.options.configured ) this.configureModifiers();
	  }

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
}