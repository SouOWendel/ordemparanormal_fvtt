import { afterEach, describe, expect, it, vi } from "vitest";
import registerEnrichers from "../../../module/settings/enrichers.mjs";

function makeElement(tagName) {
	return {
		tagName,
		className: "",
		style: {},
		children: [],
		classList: {
			add(...classes) {
				this.classes = [...classes];
			},
		},
		appendChild(child) {
			this.children.push(child);
			return child;
		},
	};
}

function installDocumentMock() {
	const documentMock = {
		createElement: vi.fn((tagName) => makeElement(tagName)),
		createTextNode: vi.fn((text) => ({ nodeType: "text", textContent: text })),
	};
	globalThis.document = documentMock;
	return documentMock;
}

afterEach(() => {
	vi.restoreAllMocks();
	if (globalThis.document) {
		delete globalThis.document;
	}
	CONFIG.TextEditor = { enrichers: [] };
	CONFIG.TextEditor.enrichers = [];
});

describe("registerEnrichers", () => {
	it("registers the DisplayDice enricher", () => {
		CONFIG.TextEditor = { enrichers: [] };
		CONFIG.TextEditor.enrichers = [];

		registerEnrichers();

		expect(CONFIG.TextEditor.enrichers).toHaveLength(1);
		expect(CONFIG.TextEditor.enrichers[0].pattern).toBeInstanceOf(RegExp);
		expect(CONFIG.TextEditor.enrichers[0].pattern.source).toContain("@DisplayDice");
	});

	it("renders the requested dice icons and sign", async () => {
		const documentMock = installDocumentMock();
		CONFIG.TextEditor = { enrichers: [] };
		CONFIG.TextEditor.enrichers = [];
		registerEnrichers();

		const enricher = CONFIG.TextEditor.enrichers[0].enricher;
		const container = await enricher(["@DisplayDice[qtd:2|sign:minus|dc:d10]", "qtd:2|sign:minus|dc:d10"]);

		expect(documentMock.createElement).toHaveBeenCalledWith("span");
		expect(documentMock.createTextNode).toHaveBeenCalledWith("–");
		expect(container.children).toHaveLength(3);
		expect(container.children[0]).toEqual({ nodeType: "text", textContent: "–" });
		expect(container.children[1].className).toBe("fa-solid fa-dice-d10");
		expect(container.children[2].className).toBe("fa-solid fa-dice-d10");
		expect(container.classList.classes).toEqual(["op-dice-display"]);
	});
});
