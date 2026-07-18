import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import registerChatCommands, { _testing } from "../../../module/chat/chat-commands.mjs";

function getChatMessageHandler() {
	const handlers = globalThis.Hooks._hooks.chatMessage;
	return handlers[handlers.length - 1];
}

function resetHooks() {
	globalThis.Hooks._hooks = {};
}

/**
 * Inject a deterministic skill lookup map so tests don't depend on fetch().
 * The default mock covers the canonical keys + their en/pt-BR labels.
 */
function primeSkillCache() {
	_testing.setCache(
		new Map([
			["investigation", "investigation"],
			["investigação", "investigation"],
			["fighting", "fighting"],
			["melee", "fighting"],
			["luta", "fighting"],
			["stealth", "stealth"],
			["furtividade", "stealth"],
		])
	);
}

/**
 * The chatMessage hook handler is synchronous (returns false to suppress the
 * raw command); the actual rendering and message creation runs as
 * fire-and-forget Promises. Tests must flush queued microtasks before asserting
 * on the side-effects.
 */
async function flushMicrotasks(rounds = 4) {
	for (let i = 0; i < rounds; i++) await Promise.resolve();
}

describe("chat-commands — /dt", () => {
	let renderSpy;
	let createSpy;
	let warnSpy;

	beforeEach(() => {
		resetHooks();
		renderSpy = vi
			.spyOn(globalThis.foundry.applications.handlebars, "renderTemplate")
			.mockResolvedValue("<div>card</div>");
		createSpy = vi.spyOn(globalThis.ChatMessage, "create").mockResolvedValue({ id: "msg-1" });
		warnSpy = vi.spyOn(globalThis.ui.notifications, "warn").mockImplementation(() => {});
		registerChatCommands();
		primeSkillCache();
	});

	afterEach(() => {
		_testing.resetCache();
		vi.restoreAllMocks();
	});

	it("retorna false SINCRONAMENTE (crítico para Foundry suprimir o comando original)", () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "/dt 15 investigation", {});
		// MUST be the literal value false, not a Promise — Foundry checks `=== false`.
		expect(result).toBe(false);
	});

	it("renderiza dt-card e cria ChatMessage com flag dtCommand", async () => {
		const handler = getChatMessageHandler();
		handler(null, "/dt 15 investigation", {});
		await flushMicrotasks();
		expect(renderSpy).toHaveBeenCalledWith(
			expect.stringContaining("dt-card.hbs"),
			expect.objectContaining({ dt: 15, skillKey: "investigation" })
		);
		expect(createSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				flags: expect.objectContaining({
					ordemparanormal: expect.objectContaining({ dtCommand: true, skillKey: "investigation" }),
				}),
			})
		);
	});

	it("aceita perícia case-insensitive", async () => {
		const handler = getChatMessageHandler();
		handler(null, "/dt 20 STEALTH", {});
		await flushMicrotasks();
		expect(renderSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ skillKey: "stealth", dt: 20 }));
	});

	it("warn + suprime quando perícia é desconhecida", async () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "/dt 15 perícia-inexistente", {});
		expect(result).toBe(false);
		await flushMicrotasks();
		expect(warnSpy).toHaveBeenCalled();
		expect(createSpy).not.toHaveBeenCalled();
	});

	it("ignora mensagens que não começam com /dt", async () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "olá mundo", {});
		expect(result).toBeUndefined();
		await flushMicrotasks();
		expect(renderSpy).not.toHaveBeenCalled();
		expect(createSpy).not.toHaveBeenCalled();
	});

	it("ignora /dt sem valor numérico", async () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "/dt abc fighting", {});
		expect(result).toBeUndefined();
		await flushMicrotasks();
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it("aceita label em pt-BR mesmo quando idioma ativo é diferente", async () => {
		const handler = getChatMessageHandler();
		handler(null, "/dt 18 Investigação", {});
		await flushMicrotasks();
		expect(renderSpy).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ skillKey: "investigation", dt: 18 })
		);
	});

	it("aceita label em inglês mesmo quando idioma ativo é diferente", async () => {
		const handler = getChatMessageHandler();
		handler(null, "/dt 12 Melee", {});
		await flushMicrotasks();
		expect(renderSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ skillKey: "fighting", dt: 12 }));
	});

	it("aceita key canônica direta", async () => {
		const handler = getChatMessageHandler();
		handler(null, "/dt 22 stealth", {});
		await flushMicrotasks();
		expect(renderSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ skillKey: "stealth", dt: 22 }));
	});
});

describe("chat-commands — /oposto", () => {
	let renderSpy;
	let createSpy;
	let warnSpy;

	beforeEach(() => {
		resetHooks();
		vi.useFakeTimers();
		renderSpy = vi
			.spyOn(globalThis.foundry.applications.handlebars, "renderTemplate")
			.mockResolvedValue("<div>card</div>");
		createSpy = vi.spyOn(globalThis.ChatMessage, "create").mockResolvedValue({ id: "msg-oposto-1" });
		warnSpy = vi.spyOn(globalThis.ui.notifications, "warn").mockImplementation(() => {});
		registerChatCommands();
		primeSkillCache();
	});

	afterEach(() => {
		_testing.resetCache();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("retorna false sincronamente", () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "/oposto fighting", {});
		expect(result).toBe(false);
	});

	it("renderiza oposto-request e cria ChatMessage com flag oppostoCommand", async () => {
		const handler = getChatMessageHandler();
		handler(null, "/oposto fighting", {});
		await vi.advanceTimersByTimeAsync(0);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.stringContaining("oposto-request.hbs"),
			expect.objectContaining({ skillKey: "fighting" })
		);
		expect(createSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				flags: expect.objectContaining({
					ordemparanormal: expect.objectContaining({
						oppostoCommand: true,
						skillKey: "fighting",
						results: [],
					}),
				}),
			})
		);
	});

	it("warn quando perícia desconhecida", async () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "/oposto inválida", {});
		expect(result).toBe(false);
		await vi.advanceTimersByTimeAsync(0);
		expect(warnSpy).toHaveBeenCalled();
		expect(createSpy).not.toHaveBeenCalled();
	});

	it("ignora /oposto sem perícia", async () => {
		const handler = getChatMessageHandler();
		const result = handler(null, "/oposto", {});
		expect(result).toBeUndefined();
		await vi.advanceTimersByTimeAsync(0);
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it("agrega resultados em ordem decrescente após timeout (rank + winner para 1º)", async () => {
		const handler = getChatMessageHandler();
		const aggregated = [
			{ actorName: "Bob", total: 12 },
			{ actorName: "Alice", total: 25 },
			{ actorName: "Carol", total: 18 },
		];
		const fakeMessage = {
			getFlag: (scope, key) => {
				if (scope === "ordemparanormal" && key === "results") return aggregated;
				return null;
			},
			setFlag: vi.fn().mockResolvedValue(undefined),
		};
		globalThis.game.messages = { get: () => fakeMessage };

		handler(null, "/oposto fighting", {});
		await vi.advanceTimersByTimeAsync(0);
		renderSpy.mockClear();
		createSpy.mockClear();

		await vi.advanceTimersByTimeAsync(30000);

		expect(fakeMessage.setFlag).toHaveBeenCalledWith("ordemparanormal", "resolved", true);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.stringContaining("oposto-results.hbs"),
			expect.objectContaining({
				results: [
					expect.objectContaining({ actorName: "Alice", total: 25, rank: 1, winnerClass: "winner" }),
					expect.objectContaining({ actorName: "Carol", total: 18, rank: 2, winnerClass: "" }),
					expect.objectContaining({ actorName: "Bob", total: 12, rank: 3, winnerClass: "" }),
				],
			})
		);
		expect(createSpy).toHaveBeenCalledTimes(1);
	});

	it("não cria card de resultados se já foi resolvido (flag resolved=true)", async () => {
		const handler = getChatMessageHandler();
		const fakeMessage = {
			getFlag: (scope, key) => {
				if (scope === "ordemparanormal" && key === "resolved") return true;
				if (scope === "ordemparanormal" && key === "results") return [{ actorName: "X", total: 10 }];
				return null;
			},
			setFlag: vi.fn().mockResolvedValue(undefined),
		};
		globalThis.game.messages = { get: () => fakeMessage };

		handler(null, "/oposto fighting", {});
		await vi.advanceTimersByTimeAsync(0);
		renderSpy.mockClear();
		createSpy.mockClear();

		await vi.advanceTimersByTimeAsync(30000);

		expect(createSpy).not.toHaveBeenCalled();
		expect(fakeMessage.setFlag).not.toHaveBeenCalled();
	});

	it("não cria card de resultados se nenhum jogador rolou no timeout", async () => {
		const handler = getChatMessageHandler();
		const fakeMessage = { getFlag: () => null, setFlag: vi.fn().mockResolvedValue(undefined) };
		globalThis.game.messages = { get: () => fakeMessage };

		handler(null, "/oposto fighting", {});
		await vi.advanceTimersByTimeAsync(0);
		renderSpy.mockClear();
		createSpy.mockClear();

		await vi.advanceTimersByTimeAsync(30000);

		expect(createSpy).not.toHaveBeenCalled();
	});

	it("não cria card de resultados se mensagem original foi deletada", async () => {
		const handler = getChatMessageHandler();
		globalThis.game.messages = { get: () => null };

		handler(null, "/oposto fighting", {});
		await vi.advanceTimersByTimeAsync(0);
		renderSpy.mockClear();
		createSpy.mockClear();

		await vi.advanceTimersByTimeAsync(30000);

		expect(createSpy).not.toHaveBeenCalled();
	});

	it("não inicia timeout para usuários não-GM", async () => {
		globalThis.game.user.isGM = false;
		const handler = getChatMessageHandler();
		handler(null, "/oposto fighting", {});
		await vi.advanceTimersByTimeAsync(0);
		renderSpy.mockClear();
		createSpy.mockClear();

		await vi.advanceTimersByTimeAsync(30000);

		expect(createSpy).not.toHaveBeenCalled();
		globalThis.game.user.isGM = true;
	});
});
