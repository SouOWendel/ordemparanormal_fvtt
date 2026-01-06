/* eslint-disable no-unused-vars */
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OrdemThreatSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ['ordemparanormal', 'sheet', 'actor', 'threat', 'themed', 'theme-light'],
		tag: 'form',
		position: {
			width: 600,
			height: 820
		},
		window: {
			resizable: true
		},
		form: {
			submitOnChange: true,
			closeOnSubmit: false
		}
	};

	/** @override */
	static PARTS = {
		sheet: { template: 'systems/ordemparanormal/templates/threat/actor-threat-sheet.html' }
	};

	/** @override */
	async _prepareContext(options) {
		// Retrieve the data structure from the base sheet.
		const context = await super._prepareContext(options);

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = this.document.system;
		context.flags = this.document.flags;
		context.actor = this.document;

		// Add roll data for TinyMCE editors.
		context.rollData = this.document.getRollData();

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(
			// A generator that returns all effects stored on the actor
			// as well as any items
			this.document.allApplicableEffects()
		);

		return context;
	}

	/** @override */
	_onRender(context, options) {
		super._onRender(context, options);
		
		const html = $(this.element);

		// Beta alert on the top of threat sheet
		html.find('.link-alert').click((ev) => {
			ev.preventDefault();
			localStorage.setItem(`op-threat-sheet-beta-alert-${this.document.id}`, true);
			html.find('#announcement').css('display', 'none');
		});
		if (localStorage.getItem(`op-threat-sheet-beta-alert-${this.document.id}`)) {
			html.find('#announcement').css('display', 'none');
		}
	}
}
