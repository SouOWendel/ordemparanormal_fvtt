import { areTokenResourcesVisible, resolveTokenResources, usingWithoutSanity } from "../helpers/token-resources.mjs";

export class OrdemToken extends foundry.canvas.placeables.Token {
	#resourceContainer;
	#rows = [];
	#layoutKey;

	drawBars() {
		if (!["agent", "threat"].includes(this.actor?.type)) {
			if (this.#resourceContainer && !this.#resourceContainer.destroyed)
				this.#resourceContainer.destroy({ children: true });
			this.#resourceContainer = undefined;
			this.#rows = [];
			return super.drawBars();
		}
		if (!this.bars) return;
		if (this.#resourceContainer?.parent !== this.bars) {
			this.#resourceContainer = this.bars.addChild(new PIXI.Container());
			this.#rows = [];
			this.#layoutKey = undefined;
		}
		const resources = resolveTokenResources(this.actor, usingWithoutSanity());
		while (this.#rows.length > resources.length) this.#rows.pop().container.destroy({ children: true });
		for (const [index, resource] of resources.entries()) {
			let row = this.#rows[index];
			if (!row) {
				const container = this.#resourceContainer.addChild(new PIXI.Container());
				const graphic = container.addChild(new PIXI.Graphics());
				const style = CONFIG.canvasTextStyle.clone();
				Object.assign(style, { fill: "#ffffff", stroke: "#000000", strokeThickness: 1, dropShadowBlur: 1 });
				const text = container.addChild(new PIXI.Text("", style));
				text.resolution = 3;
				text.anchor.set(0.5);
				row = { container, graphic, text };
				this.#rows.push(row);
			}
			row.resource = resource;
		}
		this.#layoutResources();
		this.#refreshResourceVisibility();
	}

	_applyRenderFlags(flags) {
		super._applyRenderFlags(flags);
		this.#layoutResources();
		this.#refreshResourceVisibility();
	}

	#layoutResources() {
		if (!this.#resourceContainer || this.#resourceContainer.destroyed) return;
		const scale = canvas.dimensions.uiScale ?? 1;
		const height = 16 * scale;
		const gap = 2 * scale;
		const nameBottom = this.document.displayName && this.nameplate ? this.nameplate.y + this.nameplate.height : this.h;
		const layoutKey = JSON.stringify([scale, this.w, this.h, nameBottom, this.#rows.map(({ resource }) => resource)]);
		if (layoutKey === this.#layoutKey) return;
		this.#layoutKey = layoutKey;
		this.#resourceContainer.position.set(0, Math.max(this.h, nameBottom) + 4 * scale);
		for (const [index, { container, graphic, text, resource }] of this.#rows.entries()) {
			container.position.set(0, index * (height + gap));
			const { Color } = foundry.utils;
			const color = Color.mix(Color.from(resource.empty), Color.from(resource.full), resource.fraction);
			graphic
				.clear()
				.lineStyle(scale, 0x000000, 1)
				.beginFill(0x111111, 0.85)
				.drawRoundedRect(0, 0, this.w, height, 2 * scale)
				.endFill();
			if (resource.fraction > 0)
				graphic
					.beginFill(color, 1)
					.drawRoundedRect(0, 0, this.w * resource.fraction, height, 2 * scale)
					.endFill();
			text.text = `${resource.label} ${resource.value} / ${resource.max}`;
			text.style.fontSize = 14 * scale;
			text.scale.set(1);
			if (text.width > this.w - 4 * scale) text.scale.set(Math.max(0, this.w - 4 * scale) / text.width);
			text.position.set(this.w / 2, height / 2);
		}
	}

	#refreshResourceVisibility() {
		if (!this.#resourceContainer || this.#resourceContainer.destroyed) return;
		this.bars.visible = areTokenResourcesVisible({
			hasActor: Boolean(this.actor),
			isGM: game.user.isGM,
			isOwner: this.isOwner,
			isSecret: this.document.isSecret,
			hover: this.hover,
			highlightObjects: this.layer.highlightObjects,
		});
	}
}
