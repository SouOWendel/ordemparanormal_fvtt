/** @typedef {{id: string, attribute: string, label: string, empty: string, full: string}} ResourceDefinition */

const definitions = {
	PV: { id: "pv", attribute: "PV", label: "PV", empty: "#ff1a1a", full: "#80ff00" },
	PE: { id: "pe", attribute: "PE", label: "PE", empty: "#242899", full: "#66a8ff" },
	SAN: { id: "san", attribute: "SAN", label: "SAN", empty: "#4c1d95", full: "#c4b5fd" },
	PD: { id: "pd", attribute: "PD", label: "PD", empty: "#242899", full: "#66a8ff" },
	hp: { id: "threatHPBar", attribute: "attributes.hp", label: "PV", empty: "#ff1a1a", full: "#80ff00" },
};

/** @returns {ResourceDefinition[]} */
export function getResourceDefinitions(actorType, withoutSanity = false) {
	const keys = actorType === "agent" ? (withoutSanity ? ["PV", "PD"] : ["PV", "PE", "SAN"]) : [];
	if (actorType === "threat") keys.push("hp");
	return keys.map((key) => ({ ...definitions[key] }));
}

/** Resolve prepared values, including synthetic Actors, without persisting presentation data. */
export function resolveTokenResources(actor, withoutSanity = false) {
	return getResourceDefinitions(actor?.type, withoutSanity).flatMap((definition) => {
		const resource = definition.attribute.split(".").reduce((value, key) => value?.[key], actor.system);
		if (!Number.isFinite(resource?.value) || !Number.isFinite(resource?.max) || resource.max < 0) return [];
		return [
			{
				...definition,
				value: resource.value,
				max: resource.max,
				fraction: resource.max > 0 ? Math.min(1, Math.max(0, resource.value / resource.max)) : 0,
			},
		];
	});
}

export function canViewTokenResources({ hasActor, isGM, isOwner, isSecret = false }) {
	return Boolean(hasActor && !isSecret && (isGM || isOwner));
}

export function areTokenResourcesVisible(context) {
	return canViewTokenResources(context) && Boolean(context.hover || context.highlightObjects);
}

export function isBarBrawlActive() {
	return Boolean(game.modules.get("barbrawl")?.active);
}

export function usingWithoutSanity() {
	return game.settings.get("ordemparanormal", "globalPlayingWithoutSanity");
}
