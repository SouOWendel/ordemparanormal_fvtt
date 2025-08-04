// Reference: https://github.com/foundryvtt/dnd5e/blob/4.1.x/module/applications/actor/base-sheet.mjs#L781
// Reference: https://github.com/foundryvtt/dnd5e/blob/4.1.x/module/documents/activity/mixin.mjs#L1212
// Reference: https://github.com/foundryvtt/dnd5e/blob/b6d3b4e46cdb70f09f5731bad04a363f3b5a7d0a/module/canvas/ability-template.mjs#L4
// Reference: https://gitlab.com/vizael/Tormenta20/-/blob/master/module/chat.mjs#L155

import ApplicationOP from './application.mjs';

/**
 * A DocumentSheet for configure and apply templates of area.
 * This application are used on techniques and equipments items.
 */
export default class DialogOP extends ApplicationOP {
	/** @override */
	static DEFAULT_OPTIONS = {
		tag: 'dialog',
		window: {
			contentTag: 'form',
			contentClasses: ['standard-form'],
			minimizable: false
		}
	};

	/** @override */
	static PARTS = {
		content: {
			template: 'systems/ordemparanormal/templates/shared/dialog-content.hbs'
		},
		footer: {
			template: 'templates/generic/form-footer.hbs'
		}
	};

	/* -------------------------------------------- */
	/*  Properties                                  */
	/* -------------------------------------------- */

	/**
	 * Form element within the dialog.
	 * @type {HTMLFormElement|void}
	 */
	get form() {
		return this.options.tag == 'form' ? this.element : this.element.querySelector('form');
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = { ...(await super._preparePartContext(partId, context, options))};
		if (partId === 'context') return this._prepareContentContext(context, options);
		if (partId === 'footer') return this._prepareFooterContext(context, options);
		return context;
	}

	/**
   * Prepare rendering context for the content section.
   * @param {ApplicationRenderContext} context  Context being prepared.
   * @param {HandlebarsRenderOptions} options   Options which configure application rendering behavior.
   * @returns {Promise<ApplicationRenderContext>}
   * @protected
   */
	async _prepareContentContext(context, options){
		context.content = this.options.content ?? '';
		return context;
	}

	/* -------------------------------------------- */

	/**
   * Prepare rendering context for the footer.
   * @param {ApplicationRenderContext} context  Context being prepared.
   * @param {HandlebarsRenderOptions} options   Options which configure application rendering behavior.
   * @returns {Promise<ApplicationRenderContext>}
   * @protected
   */
	async _prepareFooterContext(context, options){
		context.buttons = this.options.buttons?.map(button => ({
			...button, cssClass: button.class
		}));
		return context;
	}

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_attachFrameListeners() {
		super._attachFrameListeners();

		// Add event listeners to the form manually (see https://github.com/foundryvtt/foundryvtt/issues/11621)
		if ( this.options.tag !== 'form' ) {
			this.form?.addEventListener('submit', this._onSubmitForm.bind(this, this.options.form));
			this.form?.addEventListener('change', this._onChangeForm.bind(this, this.options.form));
		}
	}
}