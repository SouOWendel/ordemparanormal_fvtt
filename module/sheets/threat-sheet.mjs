/* eslint-disable no-unused-vars */
import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OrdemThreatSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'actor'],
			template: 'systems/ordemparanormal/templates/threat/actor-sheet.html',
			width: 600,
			height: 820,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'features',
				},
			],
		});
	}

	/** @override */
	get template() {
		return `systems/ordemparanormal/templates/threat/actor-${this.actor.type}-sheet.html`;
	}

	/** @override */
	getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();
		const actorData = context.data;
		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = actorData.system;
		context.flags = actorData.flags;
		// Add roll data for TinyMCE editors.
		context.rollData = context.actor.getRollData();
		// Prepare active effects
		context.effects = prepareActiveEffectCategories(
			// A generator that returns all effects stored on the actor
			// as well as any items
			this.actor.allApplicableEffects()
		);
		return context;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		
		// Beta alert on the top of threat sheet
		html.find('.link-alert').click((ev) => {
			ev.preventDefault();
			localStorage.setItem(`op-threat-sheet-beta-alert-${this.actor.id}`, true);
			html.find('#announcement').css('display', 'none');
		});
		if (localStorage.getItem(`op-threat-sheet-beta-alert-${this.actor.id}`)) {
			html.find('#announcement').css('display', 'none');
		}
	}
}
