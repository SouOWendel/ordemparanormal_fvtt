import { OrdemToken } from "../canvas/token.mjs";
import { OrdemTokenDocument } from "../documents/token.mjs";
import { isBarBrawlActive } from "../helpers/token-resources.mjs";
import { reconcileBarBrawlResources, registerBarBrawlIntegration } from "./barbrawl-integration.mjs";
import { renderTokenResourceHUD } from "./token-resource-hud.mjs";

export function registerTokenResources() {
	CONFIG.Token.documentClass = OrdemTokenDocument;
	if (!isBarBrawlActive()) CONFIG.Token.objectClass = OrdemToken;
	Hooks.on("renderTokenHUD", (hud, html) => {
		void renderTokenResourceHUD(hud, html).catch((error) =>
			console.error("ordemparanormal | resource HUD render failed", error)
		);
	});
	Hooks.once("setup", registerBarBrawlIntegration);
	Hooks.once("ready", () => void reconcileBarBrawlResources());
}

export async function refreshTokenResourcesForRule() {
	if (!game.ready) return;
	const actors = new Set(game.actors);
	for (const scene of game.scenes) {
		for (const token of scene.tokens) if (!token.isLazyDelta && token.actor) actors.add(token.actor);
	}
	for (const actor of actors) actor.reset();
	for (const actor of actors) {
		for (const app of Object.values(actor.apps)) app.render(false);
		for (const item of actor.items) for (const app of Object.values(item.apps)) app.render(false);
	}
	for (const item of game.items) for (const app of Object.values(item.apps)) app.render(false);
	for (const token of canvas?.tokens?.placeables ?? []) token.renderFlags.set({ refreshBars: true, refreshState: true });
	if (canvas?.tokens?.hud?.rendered) canvas.tokens.hud.render();
	await reconcileBarBrawlResources();
}
