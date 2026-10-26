import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let OrdemToken;
let OrdemTokenDocument;

class Container {
	children = [];
	position = { set: vi.fn() };
	addChild(child) {
		this.children.push(child);
		child.parent = this;
		return child;
	}
	destroy({ children } = {}) {
		this.destroyed = true;
		if (children) for (const child of this.children) child.destroy?.({ children: true });
		if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
		this.parent = null;
	}
}
class Graphics extends Container {
	clear() {
		return this;
	}
	lineStyle() {
		return this;
	}
	beginFill() {
		return this;
	}
	drawRoundedRect() {
		return this;
	}
	endFill() {
		return this;
	}
}
class Text extends Container {
	anchor = { set: vi.fn() };
	scale = { set: vi.fn() };
	width = 80;
	constructor(text, style) {
		super();
		this.text = text;
		this.style = style;
	}
}

beforeEach(async () => {
	vi.resetModules();
	class BaseToken {
		bars = new Container();
		actor = {
			type: "agent",
			system: { PV: { value: 8, max: 12 }, PE: { value: 2, max: 5 }, SAN: { value: 3, max: 5 }, PD: { value: 4, max: 8 } },
		};
		document = { displayName: 50, displayBars: 50, isSecret: false };
		nameplate = { y: 104, height: 20 };
		layer = { highlightObjects: false };
		isOwner = true;
		hover = true;
		w = 100;
		h = 100;
		_applyRenderFlags() {
			this.bars.visible = true;
		}
		drawBars() {}
	}
	class BaseDocument {
		_onRelatedUpdate() {}
	}
	vi.stubGlobal("foundry", { canvas: { placeables: { Token: BaseToken } }, documents: { TokenDocument: BaseDocument } });
	vi.stubGlobal("PIXI", { Container, Graphics, Text });
	vi.stubGlobal("CONFIG", { canvasTextStyle: { clone: () => ({ fontFamily: "Signika", fontWeight: "bold" }) } });
	foundry.utils = { Color: { from: (color) => color, mix: () => 0xffffff } };
	vi.stubGlobal("game", { user: { isGM: false }, settings: { get: () => false } });
	vi.stubGlobal("canvas", { dimensions: { uiScale: 1 } });
	({ OrdemToken } = await import("../../../module/canvas/token.mjs"));
	({ OrdemTokenDocument } = await import("../../../module/documents/token.mjs"));
});
afterEach(() => vi.unstubAllGlobals());

describe("resource canvas integration", () => {
	it("draws one set below the nameplate and reuses it across refreshes", () => {
		const token = new OrdemToken();
		token.drawBars();
		const container = token.bars.children[0];
		expect(container.position.set).toHaveBeenLastCalledWith(0, 128);
		expect(container.children.map((row) => row.children[1].text)).toEqual(["PV 8 / 12", "PE 2 / 5", "SAN 3 / 5"]);
		const clear = vi.spyOn(container.children[0].children[0], "clear");
		token._applyRenderFlags({ refreshPosition: true });
		expect(clear).not.toHaveBeenCalled();
		token.actor.system.PV.value = 6;
		token.drawBars();
		expect(token.bars.children).toEqual([container]);
		expect(container.children[0].children[1].text).toBe("PV 6 / 12");
		game.settings.get = () => true;
		token.drawBars();
		expect(container.children.map((row) => row.children[1].text)).toEqual(["PV 6 / 12", "PD 4 / 8"]);
	});
	it("applies permissions after the native state refresh, even with legacy ALWAYS", () => {
		const token = new OrdemToken();
		token.drawBars();
		token.isOwner = false;
		token._applyRenderFlags({ refreshState: true });
		expect(token.bars.visible).toBe(false);
		game.user.isGM = true;
		token._applyRenderFlags({ refreshState: true });
		expect(token.bars.visible).toBe(true);
		token.document.isSecret = true;
		token._applyRenderFlags({ refreshState: true });
		expect(token.bars.visible).toBe(false);
	});
	it("rebuilds after redraw destroys the old container", () => {
		const token = new OrdemToken();
		token.drawBars();
		const previous = token.bars.children[0];
		previous.destroy({ children: true });
		token.bars = new Container();
		token.drawBars();
		expect(token.bars.children).toHaveLength(1);
		expect(token.bars.children[0]).not.toBe(previous);
		expect(token.bars.children[0].children).toHaveLength(3);
	});
	it("updates all resources after a related document change, only for rendered tokens", () => {
		const doc = new OrdemTokenDocument();
		doc.object = { renderFlags: { set: vi.fn() } };
		doc.rendered = false;
		doc._onRelatedUpdate({}, {});
		expect(doc.object.renderFlags.set).not.toHaveBeenCalled();
		doc.rendered = true;
		doc._onRelatedUpdate({}, {});
		expect(doc.object.renderFlags.set).toHaveBeenCalledExactlyOnceWith({ refreshBars: true, refreshState: true });
	});
	it.each([true, false])("registers the system renderer only without Bar Brawl (active=%s)", async (active) => {
		const baseRenderer = class {};
		game.modules = { get: () => ({ active }) };
		vi.stubGlobal("CONFIG", { Token: { objectClass: baseRenderer } });
		vi.stubGlobal("Hooks", { on: vi.fn(), once: vi.fn() });
		const { registerTokenResources } = await import("../../../module/components/token-resources.mjs");
		registerTokenResources();
		expect(CONFIG.Token.objectClass).toBe(active ? baseRenderer : OrdemToken);
		expect(CONFIG.Token.documentClass).toBe(OrdemTokenDocument);
	});
	it("reprepares each loaded actor once and refreshes sheets, HUD and affected tokens", async () => {
		const app = { render: vi.fn() };
		const actor = { reset: vi.fn(), apps: { sheet: app }, items: [] };
		const synthetic = { reset: vi.fn(), apps: {}, items: [] };
		Object.assign(game, {
			ready: true,
			actors: [actor],
			items: [],
			scenes: [{ tokens: [{ actor }, { actor: synthetic }] }],
			modules: { get: () => ({ active: false }) },
		});
		canvas.tokens = { placeables: [{ renderFlags: { set: vi.fn() } }], hud: { rendered: true, render: vi.fn() } };
		const { refreshTokenResourcesForRule } = await import("../../../module/components/token-resources.mjs");
		await refreshTokenResourcesForRule();
		expect(actor.reset).toHaveBeenCalledTimes(1);
		expect(synthetic.reset).toHaveBeenCalledTimes(1);
		expect(app.render).toHaveBeenCalledTimes(1);
		expect(canvas.tokens.hud.render).toHaveBeenCalledTimes(1);
		expect(canvas.tokens.placeables[0].renderFlags.set).toHaveBeenCalledExactlyOnceWith({
			refreshBars: true,
			refreshState: true,
		});
	});
});
