import { afterEach, describe, expect, it, vi } from "vitest";
import { OrdemItem } from "../../../module/documents/item.mjs";

function makeItem(systemOverride = {}) {
	const item = new OrdemItem({}, {});
	item.system = systemOverride;
	item.toObject = () => ({
		system: systemOverride,
	});
	return item;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("OrdemItem.getChatData", () => {
	it("enriches description and chatDescription with the item roll data", async () => {
		const enrichHTML = vi.fn().mockImplementation(async (content) => `<p>${content}</p>`);
		const item = makeItem({
			description: "<p>description</p>",
			chatDescription: "<p>chat description</p>",
		});
		item.getRollData = () => ({ item: { damage: { formula: "1d8" } } });

		const originalTextEditor = foundry.applications.ux.TextEditor.implementation;
		foundry.applications.ux.TextEditor.implementation = {
			...originalTextEditor,
			enrichHTML,
		};

		try {
			const data = await item.getChatData({ preserveLinks: true });

			expect(enrichHTML).toHaveBeenCalledTimes(2);
			expect(enrichHTML).toHaveBeenNthCalledWith(
				1,
				"<p>description</p>",
				expect.objectContaining({
					relativeTo: item,
					rollData: { item: { damage: { formula: "1d8" } } },
					preserveLinks: true,
				})
			);
			expect(enrichHTML).toHaveBeenNthCalledWith(
				2,
				"<p>chat description</p>",
				expect.objectContaining({
					relativeTo: item,
					rollData: { item: { damage: { formula: "1d8" } } },
					preserveLinks: true,
				})
			);
			expect(data.description).toBe("<p><p>description</p></p>");
			expect(data.chatDescription).toBe("<p><p>chat description</p></p>");
		} finally {
			foundry.applications.ux.TextEditor.implementation = originalTextEditor;
		}
	});
});
