/**
 * Shared composition of a ritual's human-readable area label. Extracted so
 * both the attack chat-card (item.mjs) and the actor sheet's ritual list
 * (actor-rituals.hbs, via a Handlebars helper) use one source of truth
 * instead of the sheet re-deriving it (or, before this fix, reading a
 * non-existent `system.areaEffect` ghost field).
 */

/**
 * Which format string a given area shape composes with. Cone/sphere read as
 * a radius/diameter ("Esfera com 10m de Raio"); cube/line as a flat size
 * ("Cubo de 10m").
 * @param {string} areaName  One of the `op.areaChoices` keys (cone/sphere/cube/line).
 * @returns {string} lang key
 */
export function ritualAreaShapeKey(areaName) {
	return areaName === "cone" || areaName === "sphere" ? "op.areaLabelSphereCone" : "op.areaLabelCubeLine";
}

/**
 * Compose the localized area label for a ritual, or "" when the ritual
 * doesn't target an area (matches item.mjs's existing chat-card gate).
 * @param {{area?: {name?: string, size?: string, type?: string}, target?: string}} system  A ritual item's `system`.
 * @returns {string}
 */
export function formatRitualArea(system) {
	const area = system?.area;
	if (!area?.name || system?.target !== "area") return "";
	const data = {
		name: game.i18n.localize("op.areaChoices." + area.name),
		type: game.i18n.localize("op.areaTypeChoices." + area.type),
		size: area.size,
	};
	return game.i18n.format(ritualAreaShapeKey(area.name), data);
}
