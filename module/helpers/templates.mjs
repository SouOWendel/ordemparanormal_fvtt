/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	return loadTemplates([
		// Actor partials.
		'systems/ordemparanormal/templates/actor/parts/actor-skills.html',
		'systems/ordemparanormal/templates/actor/parts/actor-inventory.html',
		'systems/ordemparanormal/templates/actor/parts/actor-rituals.html',
		'systems/ordemparanormal/templates/actor/parts/actor-effects.html',
		'systems/ordemparanormal/templates/actor/parts/actor-abilities.html',
	]);
};
