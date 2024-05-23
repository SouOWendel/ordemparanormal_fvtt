/* eslint-disable indent */
/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffect(event, owner) {
	event.preventDefault();
	const a = event.currentTarget;
	const li = a.closest('li');
	const effect = li.dataset.effectId
		? owner.effects.get(li.dataset.effectId)
		: null;
	switch (a.dataset.action) {
		case 'create':
			return owner.createEmbeddedDocuments('ActiveEffect', [
				{
					label: game.i18n.localize('ordemparanormal.newEffect'),
					icon: 'icons/svg/aura.svg',
					origin: owner.uuid,
					'duration.rounds':
						li.dataset.effectType === 'temporary' ? 1 : undefined,
					disabled: li.dataset.effectType === 'inactive',
				},
			]);
		case 'edit':
			return effect.sheet.render(true);
		case 'delete':
			return effect.delete();
		case 'toggle':
			return effect.update({ disabled: !effect.disabled });
	}
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
	// Define effect header categories
	const categories = {
		temporary: {
			type: 'temporary',
			label: game.i18n.localize('ordemparanormal.temporaryEffects'),
			effects: [],
		},
		passive: {
			type: 'passive',
			label: game.i18n.localize('ordemparanormal.passiveEffects'),
			effects: [],
		},
		inactive: {
			type: 'inactive',
			label: game.i18n.localize('ordemparanormal.inactiveEffects'),
			effects: [],
		},
	};

	// Iterate over active effects, classifying them into categories
	for (const e of effects) {
		if (e.disabled) categories.inactive.effects.push(e);
		else if (e.isTemporary) categories.temporary.effects.push(e);
		else categories.passive.effects.push(e);
	}
	return categories;
}
