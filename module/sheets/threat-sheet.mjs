/* eslint-disable no-unused-vars */
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OrdemThreatSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
	constructor(options = {}) {
		super(options);
		this.#dragDrop = this.#createDragDropHandlers();
	}

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
			onEditImage: this.#onEditImage,
			viewDoc: this._viewDoc,
			createDoc: this._createDoc,
			deleteDoc: this._deleteDoc,
			onRoll: this.#onRoll
		},
		dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
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

		this._prepareItems(context);

		return context;
	}

	_prepareItems(context) {
		const actions = [];
		const abilities = [];

		for (const i of this.document.items) {
			i.img = i.img || DEFAULT_TOKEN;

			if (i.type === 'armament') {
				actions.push(i);
			} else if (i.type === 'ability' || i.type === 'ritual') {
				abilities.push(i);
			}
		}

		actions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		abilities.sort((a, b) => (a.sort || 0) - (b.sort || 0));

		context.actions = actions;
		context.abilities = abilities;
	}

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);
		
		this.#dragDrop.forEach((d) => d.bind(this.element));

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

	static async _viewDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		doc.sheet.render(true);
	}

	static async _deleteDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		await doc.delete();
	}

	static async _createDoc(event, target) {
		const docCls = getDocumentClass(target.dataset.documentClass);
		const docData = {
			name: docCls.defaultName({
				type: target.dataset.type,
				parent: this.actor,
			}),
		};
		for (const [dataKey, value] of Object.entries(target.dataset)) {
			if (['action', 'documentClass'].includes(dataKey)) continue;
			foundry.utils.setProperty(docData, dataKey, value);
		}
		await docCls.create(docData, { parent: this.actor });
	}

	static async #onRoll(event, target) {
		event.preventDefault();
		const dataset = target.dataset;
		if (dataset.rollType) {
			if (dataset.rollType == 'item') {
				const itemId = target.closest('.item').dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			}
		}
	}

	_getEmbeddedDocument(target) {
		const docRow = target.closest('li[data-document-class]');
		if (docRow.dataset.documentClass === 'Item') {
			return this.actor.items.get(docRow.dataset.itemId);
		} else if (docRow.dataset.documentClass === 'ActiveEffect') {
			const parent = docRow.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(docRow?.dataset.parentId);
			return parent.effects.get(docRow?.dataset.effectId);
		} else return console.warn('Could not find document class');
	}

	get dragDrop() {
		return this.#dragDrop;
	}

	#dragDrop;

	_canDragStart(selector) {
		return this.isEditable;
	}

	_canDragDrop(selector) {
		return this.isEditable;
	}

	_onDragStart(event) {
		const docRow = event.currentTarget.closest('li');
		if ('link' in event.target.dataset) return;
		const dragData = this._getEmbeddedDocument(docRow)?.toDragData();
		if (!dragData) return;
		event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
	}

	_onDragOver(event) {}

	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		const actor = this.actor;
		const allowed = Hooks.call('dropActorSheetData', actor, this, data);
		if (allowed === false) return;

		switch (data.type) {
		case 'Item':
			return this._onDropItem(event, data);
		}
	}

	async _onDropItem(event, data) {
		if (!this.actor.isOwner) return false;
		const item = await Item.implementation.fromDropData(data);

		if (this.actor.uuid === item.parent?.uuid)
			return this._onSortItem(event, item);

		return this._onDropItemCreate(item, event);
	}

	async _onDropItemCreate(itemData, event) {
		itemData = itemData instanceof Array ? itemData : [itemData];
		return this.actor.createEmbeddedDocuments('Item', itemData);
	}

	_onSortItem(event, item) {
		const items = this.actor.items;
		const dropTarget = event.target.closest('[data-item-id]');
		if (!dropTarget) return;
		const target = items.get(dropTarget.dataset.itemId);

		if (item.id === target.id) return;

		const siblings = [];
		for (const el of dropTarget.parentElement.children) {
			const siblingId = el.dataset.itemId;
			if (siblingId && siblingId !== item.id)
				siblings.push(items.get(el.dataset.itemId));
		}

		const sortUpdates = SortingHelpers.performIntegerSort(item, {
			target,
			siblings,
		});
		const updateData = sortUpdates.map((u) => {
			const update = u.update;
			update._id = u.target._id;
			return update;
		});

		return this.actor.updateEmbeddedDocuments('Item', updateData);
	}

	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = {
				dragstart: this._canDragStart.bind(this),
				drop: this._canDragDrop.bind(this),
			};
			d.callbacks = {
				dragstart: this._onDragStart.bind(this),
				dragover: this._onDragOver.bind(this),
				drop: this._onDrop.bind(this),
			};
			return new DragDrop(d);
		});
	}
}
