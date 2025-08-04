import D20RollConfigurationDialog from './d20-configuration-dialog.mjs';

/**
 * @typedef {BasicRollConfigurationDialogOptions} SkillToolRollConfigurationDialogOptions
 * @property {boolean} chooseAbility  Should the ability be selectable?
 */

/**
 * Extended roll configuration dialog that allows selecting abilities.
 */
export default class SkillToolRollConfigurationDialog extends D20RollConfigurationDialog {
	/** @override */
	static DEFAULT_OPTIONS = {
		chooseAbility: true
	};

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _prepareConfigurationContext(context, options) {
		context = await super._prepareConfigurationContext(context, options);
		if ( this.options.chooseAbility ) context.fields.unshift({
			field: new foundry.data.fields.StringField({
				label: game.i18n.localize('op.RollAttribute'), blank: false, required: true
			}),
			name: 'attribute',
			value: this.config.attributeId,
			options: Object.entries(CONFIG.op.attributes)
				.map(([value, l]) => ({ value, label: game.i18n.localize(l) }))
		},);
		return context;
	}

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		if ( this.config.skill && (event.target?.name === 'attribute') ) {
			
			const skillLabel = game.i18n.localize(CONFIG.op.skills[this.config.skill] ?? '');
			const ability = event.target.value ?? this.config.subject.skills[this.config.skill]?.attr[0] ?? '';
			const abilityLabel = game.i18n.localize(CONFIG.op.attributes[ability] ?? '');
			const flavor = game.i18n.format('op.SkillPromptTitle', { skill: skillLabel, ability: abilityLabel });
			foundry.utils.setProperty(this.message, 'data.flavor', flavor);
			this._updateFrame({ window: { title: flavor } });
		}
	}
}