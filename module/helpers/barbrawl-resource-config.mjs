import { getResourceDefinitions } from "./token-resources.mjs";

const barDefaults = {
	gmVisibility: -1,
	hideFull: false,
	hideEmpty: false,
	hideCombat: false,
	hideNoCombat: false,
	hideHud: false,
	shareHeight: false,
	indentLeft: null,
	indentRight: null,
	invert: false,
	ignoreMin: false,
	ignoreMax: false,
	subdivisions: null,
	subdivisionsOwner: false,
	invertDirection: false,
	fgImage: "",
	bgImage: "",
	hideBg: false,
	opacity: null,
};

export function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ordered(value) {
	if (Array.isArray(value)) return value.map(ordered);
	if (!isRecord(value)) return value;
	return Object.fromEntries(
		Object.keys(value)
			.sort()
			.map((key) => [key, ordered(value[key])])
	);
}

export function equalResourceConfig(left, right) {
	return JSON.stringify(ordered(left)) === JSON.stringify(ordered(right));
}

export function resourceProfile(actorType, withoutSanity) {
	return actorType === "threat" ? "threat" : withoutSanity ? "agent-determination" : "agent-standard";
}

export function buildBarBrawlDefaults(actorType, withoutSanity = false) {
	const resources = getResourceDefinitions(actorType, withoutSanity);
	if (!resources.length) return {};
	const spacerId = actorType === "threat" ? "threatSpaceBar" : "agentSpaceBar";
	const common = { position: "bottom-outer", style: "fraction", ownerVisibility: 30, otherVisibility: 0 };
	return Object.fromEntries([
		[
			spacerId,
			{
				...common,
				id: spacerId,
				mincolor: "#000000",
				maxcolor: "#FFFFFF",
				value: 1,
				max: 1,
				opacity: 0,
				label: "",
				attribute: "custom",
				hideHud: true,
				order: 0,
			},
		],
		...resources.map((resource, index) => [
			resource.id,
			{
				...common,
				id: resource.id,
				mincolor: resource.empty,
				maxcolor: resource.full,
				attribute: resource.attribute,
				label: resource.label,
				order: index + 1,
			},
		]),
	]);
}

/** Canonicalize only documented defaults; unknown configuration fields remain significant. */
export function normalizeBarBrawlConfig(source) {
	const bars = source?.flags?.barbrawl?.resourceBars;
	if (!isRecord(bars) || !Object.keys(bars).length) return null;
	const entries = Object.entries(bars);
	if (
		entries.some(
			([, bar]) =>
				!isRecord(bar) ||
				typeof bar.attribute !== "string" ||
				!bar.attribute ||
				(bar.order !== undefined && !Number.isFinite(bar.order))
		)
	)
		return null;
	// Older Bar Brawl forms numbered resources from zero without numbering the spacer.
	// Compare the stable visual order, since gaps and tied indexes do not change the rendered layout.
	entries.sort(([, left], [, right]) => (left.order ?? 0) - (right.order ?? 0));
	return {
		bar1: source.bar1?.attribute ?? null,
		bar2: source.bar2?.attribute ?? null,
		displayBars: source.displayBars ?? 50,
		bars: Object.fromEntries(
			entries.map(([id, bar], index) => {
				const normalized = { ...barDefaults, ...bar, id: bar.id ?? id, order: index };
				// Bar Brawl may cache prepared values on bound bars. They are not configuration.
				for (const key of ["editable", "type", "approximated"]) delete normalized[key];
				if (bar.attribute !== "custom") {
					delete normalized.value;
					delete normalized.max;
				}
				return [id, normalized];
			})
		),
	};
}

export function defaultBarBrawlSource(actorType, withoutSanity = false) {
	return {
		bar1: { attribute: null },
		bar2: { attribute: null },
		displayBars: 50,
		flags: { barbrawl: { resourceBars: buildBarBrawlDefaults(actorType, withoutSanity) } },
	};
}

export function nativeResourceConfig(source) {
	return {
		bar1: source.bar1?.attribute ?? null,
		bar2: source.bar2?.attribute ?? null,
		displayBars: source.displayBars ?? 0,
	};
}

export function classifyBarBrawlConfig(source, actorType) {
	const current = normalizeBarBrawlConfig(source);
	const metadata = source?.flags?.ordemparanormal?.resourceBars;
	if (metadata !== undefined) {
		if (metadata?.version === 1 && metadata.state === "pending" && source.flags?.barbrawl?.resourceBars === undefined) {
			return equalResourceConfig(nativeResourceConfig(source), metadata.reference) ? "pending" : "customized";
		}
		if (metadata?.version !== 1 || metadata.state !== "managed" || !isRecord(metadata.reference)) return "customized";
		return current && equalResourceConfig(current, metadata.reference) ? "managed" : "customized";
	}
	if (!current) return "customized";
	return [false, true].some((rule) => {
		const defaults = defaultBarBrawlSource(actorType, rule);
		if (equalResourceConfig(current, normalizeBarBrawlConfig(defaults))) return true;
		// The original system preset used black SAN bars; it remains eligible for default updates.
		const sanity = defaults.flags.barbrawl.resourceBars.san;
		if (!sanity) return false;
		Object.assign(sanity, { mincolor: "#000000", maxcolor: "#000000" });
		return equalResourceConfig(current, normalizeBarBrawlConfig(defaults));
	})
		? "legacy"
		: "customized";
}

/** Return an abstract patch; Foundry-version-specific deletion operators belong to the adapter. */
export function planBarBrawlUpdate(source, actorType, withoutSanity, { force = false } = {}) {
	if (!getResourceDefinitions(actorType).length) return null;
	const classification = classifyBarBrawlConfig(source, actorType);
	if (!force && classification === "customized") return null;
	const desired = defaultBarBrawlSource(actorType, withoutSanity);
	const reference = normalizeBarBrawlConfig(desired);
	const metadata = { version: 1, state: "managed", profile: resourceProfile(actorType, withoutSanity), reference };
	if (
		equalResourceConfig(normalizeBarBrawlConfig(source), reference) &&
		equalResourceConfig(source.flags?.ordemparanormal?.resourceBars, metadata)
	)
		return null;
	const previous = source.flags?.barbrawl?.resourceBars;
	return {
		bars: desired.flags.barbrawl.resourceBars,
		remove: isRecord(previous) ? Object.keys(previous).filter((id) => !(id in desired.flags.barbrawl.resourceBars)) : [],
		removeFields: Object.entries(desired.flags.barbrawl.resourceBars).flatMap(([id, bar]) =>
			isRecord(previous?.[id])
				? Object.keys(previous[id])
						.filter((key) => !(key in bar))
						.map((key) => [id, key])
				: []
		),
		metadata,
	};
}
