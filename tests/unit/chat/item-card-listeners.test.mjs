import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import registerHooks from "../../../module/hooks.mjs";
import { OrdemItem } from "../../../module/documents/item.mjs";

function makeMessageView(action, messageId = "weapon-card", cardClass = "item-card") {
	const listeners = new Set();
	const root = {
		dataset: { messageId },
		addEventListener: (_type, listener) => listeners.add(listener),
		removeEventListener: (_type, listener) => listeners.delete(listener),
	};
	const card = {
		dataset: { itemId: "weapon" },
		classList: { contains: (name) => name === cardClass },
		closest: (selector) => (selector === ".message" ? root : null),
	};
	const button = {
		dataset: { action },
		disabled: false,
		closest: (selector) => (selector === ".chat-card" ? card : button),
	};
	const icon = { closest: (selector) => button.closest(selector) };
	return {
		root,
		button,
		icon,
		listeners,
		click(target = button) {
			const event = { target, preventDefault: vi.fn() };
			for (const listener of listeners) listener(event);
			return event;
		},
	};
}

function render(view) {
	for (const listener of Hooks._hooks.renderChatMessageHTML ?? []) listener({}, view.root);
}

describe("item card actions on rendered messages", () => {
	let weapon;
	let message;
	let savedHooks;
	let savedMessages;

	beforeEach(() => {
		savedHooks = Hooks._hooks;
		savedMessages = game.messages;
		Hooks._hooks = {};
		registerHooks();
		weapon = {
			rollAttack: vi.fn().mockResolvedValue({ criticalStatus: false, hitResult: null }),
			rollDamage: vi.fn().mockResolvedValue({}),
			rollVolleyDamage: vi.fn().mockResolvedValue({}),
		};
		message = { getFlag: vi.fn(), setFlag: vi.fn().mockResolvedValue({}) };
		game.messages = new Map([["weapon-card", message]]);
		vi.spyOn(OrdemItem, "_getChatCardActor").mockResolvedValue({ items: new Map([["weapon", weapon]]) });
	});

	afterEach(() => {
		vi.restoreAllMocks();
		Hooks._hooks = savedHooks;
		game.messages = savedMessages;
	});

	it("wires the popup and chat views independently to the native attack action", async () => {
		const chat = makeMessageView("attack");
		const popup = makeMessageView("attack");
		render(chat);
		render(popup);
		const popupClick = popup.click();
		await vi.waitFor(() => expect(weapon.rollAttack).toHaveBeenCalledTimes(1));
		expect(weapon.rollAttack).toHaveBeenLastCalledWith({ event: popupClick });
		chat.click();
		await vi.waitFor(() => expect(weapon.rollAttack).toHaveBeenCalledTimes(2));
	});

	it("uses native damage when clicking the icon inside the popup button", async () => {
		const popup = makeMessageView("damage");
		render(popup);
		const event = popup.click(popup.icon);
		await vi.waitFor(() => expect(weapon.rollDamage).toHaveBeenCalledTimes(1));
		expect(weapon.rollDamage).toHaveBeenCalledWith(expect.objectContaining({ event }));
		expect(popup.button.disabled).toBe(false);
	});

	it("preserves native volley damage and the persisted attack results", async () => {
		const attacks = [{ hit: true, isCritical: true, targetUuid: "Actor.target" }];
		message.getFlag.mockImplementation((_scope, key) => (key === "hitResult" ? { attackResults: attacks } : undefined));
		const popup = makeMessageView("damage");
		render(popup);
		const event = popup.click();
		await vi.waitFor(() => expect(weapon.rollVolleyDamage).toHaveBeenCalledExactlyOnceWith(attacks, { event }));
		expect(weapon.rollDamage).not.toHaveBeenCalled();
	});

	it("keeps one listener after repeated renders and resolves the current action wrapper", async () => {
		const popup = makeMessageView("attack");
		render(popup);
		render(popup);
		const wrappedAction = vi.spyOn(OrdemItem, "_onChatCardAction");
		popup.click();
		await vi.waitFor(() => expect(weapon.rollAttack).toHaveBeenCalledTimes(1));
		expect(popup.listeners.size).toBe(1);
		expect(wrappedAction).toHaveBeenCalledTimes(1);
		expect(Hooks._hooks.renderChatLog).toBeUndefined();
		expect(Hooks._hooks.renderChatPopout).toBeUndefined();
	});

	it("wires replacement message nodes and detached popout views", async () => {
		const replacedPopup = makeMessageView("attack");
		const popout = makeMessageView("attack");
		render(replacedPopup);
		render(popout);
		replacedPopup.click();
		await vi.waitFor(() => expect(weapon.rollAttack).toHaveBeenCalledTimes(1));
		popout.click();
		await vi.waitFor(() => expect(weapon.rollAttack).toHaveBeenCalledTimes(2));
	});

	it.each(["dt-card", "oposto-request"])("leaves %s to its command handler", (cardClass) => {
		const popup = makeMessageView("rollDT", "weapon-card", cardClass);
		render(popup);
		const action = vi.spyOn(OrdemItem, "_onChatCardAction");
		popup.click();
		expect(popup.listeners.size).toBe(1);
		expect(action).not.toHaveBeenCalled();
	});
});
