import {
	canViewTokenResources,
	isBarBrawlActive,
	resolveTokenResources,
	usingWithoutSanity,
} from "../helpers/token-resources.mjs";

const renderRevisions = new WeakMap();

export async function applyTokenResourceInput(hud, attribute, input) {
	const actor = hud.document?.actor;
	if (!actor || !actor.isOwner) throw new Error("Resource ownership required");
	const resource = resolveTokenResources(actor, usingWithoutSanity()).find((entry) => entry.attribute === attribute);
	if (!resource || !input.trim()) throw new Error("Invalid resource input");
	const parsed = hud._parseAttributeInput(attribute, resource, input.trim());
	const value = parsed.isDelta ? parsed.delta : parsed.value;
	if (!Number.isFinite(value)) throw new Error("Invalid resource value");
	return actor.modifyTokenAttribute(attribute, value, parsed.isDelta, true);
}

export async function renderTokenResourceHUD(hud, html) {
	if (isBarBrawlActive() || !["agent", "threat"].includes(hud.document?.actor?.type)) return;
	const middle = html.querySelector(".col.middle");
	if (!middle) return;
	const revision = (renderRevisions.get(hud) ?? 0) + 1;
	renderRevisions.set(hud, revision);
	const token = hud.object;
	const authorized = canViewTokenResources({
		hasActor: true,
		isGM: game.user.isGM,
		isOwner: token.isOwner,
		isSecret: hud.document.isSecret,
	});
	const resources = authorized ? resolveTokenResources(hud.document.actor, usingWithoutSanity()) : [];
	const content = await foundry.applications.handlebars.renderTemplate(
		"systems/ordemparanormal/templates/hud/token-resources.hbs",
		{ resources }
	);
	// A render hook is not awaited by Foundry. Discard work if the HUD was rebound while loading its template.
	if (hud.object !== token || renderRevisions.get(hud) !== revision || isBarBrawlActive()) return;
	middle.querySelectorAll(".attribute.bar1, .attribute.bar2, .ordem-token-resources").forEach((node) => node.remove());
	middle.insertAdjacentHTML("beforeend", content);
	for (const input of middle.querySelectorAll(".ordem-token-resources input")) {
		input.addEventListener("focus", () => input.select());
		input.addEventListener("change", async (event) => {
			event.preventDefault();
			event.stopImmediatePropagation();
			if (input.disabled) return;
			input.disabled = true;
			try {
				await applyTokenResourceInput(hud, input.dataset.resource, input.value);
			} catch (error) {
				console.error("ordemparanormal | resource HUD update failed", error);
				ui.notifications.error(game.i18n.localize("op.tokenResources.updateFailed"));
			} finally {
				input.disabled = false;
				hud.render();
			}
		});
	}
}
