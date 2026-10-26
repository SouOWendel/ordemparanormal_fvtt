import {
	classifyBarBrawlConfig,
	equalResourceConfig,
	normalizeBarBrawlConfig,
	planBarBrawlUpdate,
	isRecord,
	nativeResourceConfig,
} from "../helpers/barbrawl-resource-config.mjs";
import { isBarBrawlActive, usingWithoutSanity } from "../helpers/token-resources.mjs";

const updateOption = "ordemResourceBars";
let pendingReconciliation = Promise.resolve();
const uncertainDocuments = new WeakSet();

export function isResourceBarAuthority() {
	return Boolean(game.user?.isGM && game.users.find((user) => user.isGM && user.active)?.id === game.user.id);
}

export function buildBarBrawlUpdate(patch) {
	const modern = game.release.generation >= 14;
	const bars = Object.fromEntries(Object.entries(patch.bars).map(([id, bar]) => [id, { ...bar }]));
	const update = {
		"bar1.attribute": null,
		"bar2.attribute": null,
		displayBars: 50,
		"flags.barbrawl.resourceBars": bars,
	};
	if (modern)
		update["flags.ordemparanormal.resourceBars"] = foundry.data.operators.ForcedReplacement.create(patch.metadata);
	else update["flags.ordemparanormal.==resourceBars"] = patch.metadata;
	for (const segments of [...patch.remove.map((id) => [id]), ...patch.removeFields]) {
		if (segments.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment)))
			throw new Error("Unsupported resource configuration key");
		const parent = segments.length === 1 ? bars : bars[segments[0]];
		const key = segments.at(-1);
		if (modern) parent[key] = new foundry.data.operators.ForcedDeletion();
		else parent[`-=${key}`] = null;
	}
	return update;
}

function getActorType(token) {
	return token.actor?.type ?? token.parent?.type;
}

export async function reconcileBarBrawlToken(token, { force = false } = {}) {
	if (!isBarBrawlActive() || !(force ? game.user?.isGM : isResourceBarAuthority())) return;
	const subject = token.parent?.documentName === "Actor" ? token.parent : token;
	if (!force && uncertainDocuments.has(subject)) return;
	const actorType = getActorType(token);
	const source = token.toObject();
	const patch = planBarBrawlUpdate(source, actorType, usingWithoutSanity(), { force });
	if (!patch) return;
	const expected = normalizeBarBrawlConfig(source);
	if (!equalResourceConfig(normalizeBarBrawlConfig(token.toObject()), expected)) return;
	const update = buildBarBrawlUpdate(patch);
	const options = { [updateOption]: { expected, force } };
	try {
		if (token.parent?.documentName === "Actor") {
			const prototypeUpdate = Object.fromEntries(
				Object.entries(update).map(([key, value]) => [`prototypeToken.${key}`, value])
			);
			await token.parent.update(prototypeUpdate, options);
		} else await token.update(update, options);
		uncertainDocuments.delete(subject);
	} catch (error) {
		// A rejected update may already have reached the server. Require explicit restoration before replaying it.
		uncertainDocuments.add(subject);
		throw error;
	}
}

export function reconcileBarBrawlResources() {
	const run = async () => {
		if (!isBarBrawlActive() || !isResourceBarAuthority()) return;
		const tokens = [
			...Array.from(game.actors, (actor) => actor.prototypeToken),
			...Array.from(game.scenes).flatMap((scene) => [...scene.tokens]),
		];
		for (const token of tokens) {
			try {
				await reconcileBarBrawlToken(token);
			} catch (error) {
				console.error(
					`ordemparanormal | resource bar reconciliation failed: ${token.uuid ?? token.parent?.uuid ?? token.id}`,
					error
				);
				ui.notifications.error(game.i18n.localize("op.tokenResources.syncFailed"));
			}
		}
	};
	pendingReconciliation = pendingReconciliation.then(run, run);
	return pendingReconciliation;
}

function protectResourceConfiguration(token, changes, options, prefix = "") {
	const source = token.toObject();
	const guard = options[updateOption];
	if (guard) {
		if (!guard.force && !isResourceBarAuthority()) return false;
		if (!equalResourceConfig(normalizeBarBrawlConfig(source), guard.expected)) return false;
		if (!guard.force && classifyBarBrawlConfig(source, getActorType(token)) === "customized") return false;
		return;
	}
	const state = source.flags?.ordemparanormal?.resourceBars?.state;
	if (!["managed", "pending"].includes(state)) return;
	const expanded = foundry.utils.expandObject(changes);
	const relevant = prefix ? expanded.prototypeToken : expanded;
	if (!relevant) return;
	if (!relevant.flags?.barbrawl && !relevant.bar1 && !relevant.bar2 && relevant.displayBars === undefined) return;
	const mergeOptions = game.release.generation >= 14 ? { applyOperators: true } : { performDeletions: true };
	const proposed = foundry.utils.mergeObject(foundry.utils.deepClone(source), relevant, mergeOptions);
	const normalize = state === "pending" ? nativeResourceConfig : normalizeBarBrawlConfig;
	if (
		!equalResourceConfig(normalize(proposed), normalize(source)) ||
		(state === "pending" && relevant.flags?.barbrawl)
	) {
		changes[`${prefix}flags.ordemparanormal.resourceBars.state`] = "customized";
	}
}

function prepareResourceDefaults(token, data, actorType, { newActor = false } = {}) {
	if (!["agent", "threat"].includes(actorType)) return;
	const source = token.toObject();
	if (!isBarBrawlActive()) {
		if (
			newActor &&
			source.flags?.barbrawl?.resourceBars === undefined &&
			source.flags?.ordemparanormal?.resourceBars === undefined &&
			source.bar1?.attribute === "PV" &&
			source.bar2?.attribute === "SAN" &&
			source.displayBars === 0
		) {
			token.updateSource({
				"flags.ordemparanormal.resourceBars": { version: 1, state: "pending", reference: nativeResourceConfig(source) },
			});
		}
		return;
	}
	const api = game.modules.get("barbrawl")?.api;
	// Explicit defaults saved in Bar Brawl take precedence for newly created Actors.
	const customDefaults = newActor && (api?.getDefaultBars?.(actorType) ?? api?.getDefaultBars?.());
	if (customDefaults) return;
	const explicit = data?.flags?.barbrawl?.resourceBars;
	const sourceBars = source.flags?.barbrawl?.resourceBars;
	const nativeDefaults =
		(sourceBars === undefined || isRecord(sourceBars)) &&
		Object.entries(sourceBars ?? {}).every(
			([id, bar]) => isRecord(bar) && ["bar1", "bar2"].includes(id) && bar.attribute === (id === "bar1" ? "PV" : "SAN")
		);
	const seed =
		newActor &&
		explicit === undefined &&
		source.flags?.ordemparanormal?.resourceBars === undefined &&
		nativeDefaults &&
		[undefined, null, "PV"].includes(source.bar1?.attribute) &&
		[undefined, null, "SAN"].includes(source.bar2?.attribute);
	const patch = planBarBrawlUpdate(source, actorType, usingWithoutSanity(), { force: seed });
	if (!patch) return;
	token.updateSource(buildBarBrawlUpdate(patch));
}

export function registerBarBrawlIntegration() {
	// Registered during setup, after Bar Brawl's own creation hooks and defaults.
	Hooks.on("preCreateActor", (actor, data) =>
		prepareResourceDefaults(actor.prototypeToken, data.prototypeToken, actor.type, { newActor: true })
	);
	Hooks.on("preCreateToken", (token, data) => prepareResourceDefaults(token, data, getActorType(token)));
	Hooks.on("preUpdateToken", (token, changes, options) => protectResourceConfiguration(token, changes, options));
	Hooks.on("preUpdateActor", (actor, changes, options) =>
		protectResourceConfiguration(actor.prototypeToken, changes, options, "prototypeToken.")
	);
	Hooks.on("renderTokenApplication", appendRestoreResourceDefaults);
	Hooks.on("userConnected", (user) => {
		if (user.isGM) void reconcileBarBrawlResources();
	});
	Hooks.on("updateUser", (_user, changes) => {
		if ("role" in changes) void reconcileBarBrawlResources();
	});
}

async function appendRestoreResourceDefaults(app, html) {
	if (!isBarBrawlActive() || !game.user.isGM || !["agent", "threat"].includes(app.actor?.type)) return;
	const resources = html.querySelector('[data-tab="resources"]');
	if (!resources || resources.querySelector(".ordem-restore-resource-bars")) return;
	const button = document.createElement("button");
	button.type = "button";
	button.className = "ordem-restore-resource-bars";
	button.textContent = game.i18n.localize("op.tokenResources.restoreDefaults");
	button.addEventListener("click", async () => {
		if (button.disabled) return;
		button.disabled = true;
		try {
			// Use the persisted document, never the configuration application's preview.
			const token = app.document?.documentName === "Token" ? app.document : app.actor.prototypeToken;
			if (token) await reconcileBarBrawlToken(token, { force: true });
			await app.render({ force: true });
		} catch (error) {
			console.error("ordemparanormal | restoring resource defaults failed", error);
			ui.notifications.error(game.i18n.localize("op.tokenResources.syncFailed"));
		} finally {
			button.disabled = false;
		}
	});
	resources.append(button);
}
