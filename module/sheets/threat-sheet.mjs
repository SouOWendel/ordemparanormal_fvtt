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
			resizable: true,
			title: 'DCC.ActorSheetTitle'
		},
		form: {
			submitOnChange: true
		},
		actions: {
			onEditImage: this.#onEditImage
		}
	};

	/** @inheritDoc */
	static PARTS = {
		sheet: {
			template: 'systems/ordemparanormal/templates/threat/actor-threat-sheet.html',
			scrollable: ['.scrollable']
		}
	};

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		
		foundry.utils.mergeObject(context, {
			editable: this.isEditable,
			owner: this.document.isOwner,
			limited: this.document.limited,
			system: this.actor.system,
			flags: this.actor.flags,
			actor: this.actor,
			config: CONFIG.op
		});

		return context;
	}

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);
		
		// Beta alert on the top of threat sheet
		const alertLink = this.element.querySelector('.link-alert');
		const announcement = this.element.querySelector('#announcement');
		
		if (alertLink) {
			alertLink.addEventListener('click', (ev) => {
				ev.preventDefault();
				localStorage.setItem(`op-threat-sheet-beta-alert-${this.actor.id}`, 'true');
				if (announcement) announcement.style.display = 'none';
			});
		}
		
		if (localStorage.getItem(`op-threat-sheet-beta-alert-${this.actor.id}`)) {
			if (announcement) announcement.style.display = 'none';
		}
	}

	/**
	 * Handle changing a Document's image.
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @returns {Promise}
	 * @protected
	 */
	static async #onEditImage(event, target) {
		const attr = target.dataset.edit || 'img';
		const current = foundry.utils.getProperty(this.document, attr);
		const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
		const fp = new FilePicker({
			current,
			type: 'image',
			redirectToRoot: img ? [img] : [],
			callback: (path) => {
				this.document.update({ [attr]: path });
			},
			top: this.position.top + 40,
			left: this.position.left + 10,
		});
		return fp.browse();
	}
}