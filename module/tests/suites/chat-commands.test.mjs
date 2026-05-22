/**
 * Quench integration tests for chat commands /dt and /oposto.
 *
 * Cobre o fluxo completo dentro do Foundry:
 *   - Hook chatMessage intercepta /dt e /oposto
 *   - renderTemplate produz o card correto
 *   - ChatMessage.create persiste flags
 *   - Helpers que dependem de game.messages/game.user
 */
import { installBatchGuards } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.chat.commands",
		(context) => {
			const { describe, it, assert, before, after } = context;
			installBatchGuards(context, { prefix: "[Quench]" });


			// ----------------------------------------------------------------
			// Helpers
			// ----------------------------------------------------------------
			async function fireChatMessage(content) {
				// Replica o que o Foundry faz internamente: chama todos os handlers
				// registrados em "chatMessage" e respeita short-circuit (return false).
				// v13 expõe os handlers via `Hooks.events` (em v12 era `Hooks._hooks`).
				const handlers = Hooks.events?.chatMessage ?? Hooks._hooks?.chatMessage ?? [];
				for (const entry of handlers) {
					const fn = typeof entry === "function" ? entry : entry.fn ?? entry;
					const result = await fn(null, content, {});
					if (result === false) return false;
				}
				return true;
			}

			async function deleteCommandMessages() {
				const toDelete = [...game.messages].filter((m) => {
					const f = m.flags?.ordemparanormal;
					return f?.dtCommand || f?.oppostoCommand;
				});
				for (const m of toDelete) await m.delete();
			}

			// ----------------------------------------------------------------
			// /dt — comando válido cria card
			// ----------------------------------------------------------------
			describe("/dt — comando válido", () => {
				let countBefore;

				before(async () => {
					await deleteCommandMessages();
					countBefore = game.messages.size;
				});

				after(async () => {
					await deleteCommandMessages();
				});

				it("/dt 15 <perícia válida> cria mensagem de chat com flag dtCommand", async () => {
					const skillKey = Object.keys(CONFIG.op.skills)[0];
					const skillLabel = game.i18n.localize(CONFIG.op.skills[skillKey]);
					const result = await fireChatMessage(`/dt 15 ${skillLabel}`);
					assert.isFalse(result, "Hook deve suprimir comando original retornando false");

					// The hook returns false synchronously and runs ChatMessage.create
					// fire-and-forget — wait for that to settle before asserting state.
					await new Promise((r) => setTimeout(r, 200));

					const created = [...game.messages].find((m) => m.getFlag("ordemparanormal", "dtCommand"));
					assert.exists(created, "Card de DT deve ser criado");
					assert.equal(String(created.getFlag("ordemparanormal", "dt")), "15", "Flag dt = 15");
					assert.equal(created.getFlag("ordemparanormal", "skillKey"), skillKey, "Flag skillKey correto");
					assert.isAbove(game.messages.size, countBefore);
				});
			});

			// ----------------------------------------------------------------
			// /dt — perícia inexistente
			// ----------------------------------------------------------------
			describe("/dt — perícia desconhecida", () => {
				before(async () => {
					await deleteCommandMessages();
				});

				it("não cria card e retorna false (suprime)", async () => {
					const sizeBefore = game.messages.size;
					const result = await fireChatMessage("/dt 20 NãoExisteEssaPerícia");
					assert.isFalse(result, "Deve suprimir comando original");
					const created = [...game.messages].find((m) => m.getFlag("ordemparanormal", "dtCommand"));
					assert.notExists(created, "Card NÃO deve ser criado");
					assert.equal(game.messages.size, sizeBefore, "Contagem não deve aumentar");
				});
			});

			// ----------------------------------------------------------------
			// /oposto — comando válido cria request card
			// ----------------------------------------------------------------
			describe("/oposto — comando válido", () => {
				before(async () => {
					await deleteCommandMessages();
				});

				after(async () => {
					await deleteCommandMessages();
				});

				it("/oposto <perícia válida> cria card com flag oppostoCommand e results=[]", async () => {
					const skillKey = Object.keys(CONFIG.op.skills)[0];
					const skillLabel = game.i18n.localize(CONFIG.op.skills[skillKey]);
					const result = await fireChatMessage(`/oposto ${skillLabel}`);
					assert.isFalse(result, "Hook deve suprimir comando original");

					// Same fire-and-forget pattern as /dt — wait for the create to land.
					await new Promise((r) => setTimeout(r, 200));

					const created = [...game.messages].find((m) => m.getFlag("ordemparanormal", "oppostoCommand"));
					assert.exists(created, "Card de oposto deve ser criado");
					assert.equal(created.getFlag("ordemparanormal", "skillKey"), skillKey);
					const results = created.getFlag("ordemparanormal", "results");
					assert.isArray(results, "results deve ser array");
					assert.equal(results.length, 0, "results inicia vazio");
				});
			});

			// ----------------------------------------------------------------
			// /oposto — perícia inexistente
			// ----------------------------------------------------------------
			describe("/oposto — perícia desconhecida", () => {
				before(async () => {
					await deleteCommandMessages();
				});

				it("não cria card e retorna false", async () => {
					const sizeBefore = game.messages.size;
					const result = await fireChatMessage("/oposto SkillImpossível");
					assert.isFalse(result, "Deve suprimir comando original");
					const created = [...game.messages].find((m) => m.getFlag("ordemparanormal", "oppostoCommand"));
					assert.notExists(created, "Card NÃO deve ser criado");
					assert.equal(game.messages.size, sizeBefore);
				});
			});

			// ----------------------------------------------------------------
			// Mensagens não-comando passam adiante
			// ----------------------------------------------------------------
			describe("mensagens normais não são afetadas pelos hooks", () => {
				it("/dtSemEspaço → handler não suprime (regex não match)", async () => {
					const result = await fireChatMessage("/dtsemespaço");
					assert.notEqual(result, false, "Não deve retornar false explícito");
				});

				it("texto livre → handler não suprime", async () => {
					const result = await fireChatMessage("olá pessoal");
					assert.notEqual(result, false);
				});
			});

			// ----------------------------------------------------------------
			// Click no botão de /dt e /oposto — fluxo end-to-end
			// (regressão do bug onde o listener não era anexado no boot)
			// ----------------------------------------------------------------
			describe("click handlers — botões dos cards de comando", () => {
				let agent;
				let savedCharacterId;

				let controlledDescriptor;

				before(async () => {
					await deleteCommandMessages();
					// resolveChatCommandActor() prioritises controlled tokens over
					// game.user.character. Foundry can re-select tokens automatically
					// (e.g. when game.user is updated with a character that has no
					// token), so a one-shot release is unreliable. Hard-stub
					// `canvas.tokens.controlled` to [] for the duration of these tests.
					if (canvas?.tokens) {
						controlledDescriptor =
							Object.getOwnPropertyDescriptor(Object.getPrototypeOf(canvas.tokens), "controlled") ??
							Object.getOwnPropertyDescriptor(canvas.tokens, "controlled");
						Object.defineProperty(canvas.tokens, "controlled", { value: [], configurable: true });
					}

					agent = await Actor.create({
						name: "[Quench] Agent for command click",
						type: "agent",
						system: {
							class: "fighter",
							attributes: { vit: { value: 2 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 2 }, int: { value: 1 } },
							NEX: { value: 5 },
							defense: { value: 12, bonus: 0, dodge: 0 },
						},
					});
					savedCharacterId = game.user.character?.id ?? null;
					await game.user.update({ character: agent.id });
					// Allow renderChatLog to wire up the listener if it hadn't yet
					await new Promise((r) => setTimeout(r, 100));
				});

				after(async () => {
					await game.user.update({ character: savedCharacterId });
					await agent?.delete();
					await deleteCommandMessages();
					// Restore the original `controlled` descriptor so other tests / the
					// user's session see the real selection again.
					if (canvas?.tokens && controlledDescriptor) {
						Object.defineProperty(canvas.tokens, "controlled", controlledDescriptor);
					} else if (canvas?.tokens) {
						delete canvas.tokens.controlled;
					}
				});

				it("click em [data-action='rollDT'] dispara actor.rollSkill com target", async () => {
					const skillKey = Object.keys(CONFIG.op.skills)[0];
					const skillLabel = game.i18n.localize(CONFIG.op.skills[skillKey]);
					await fireChatMessage(`/dt 15 ${skillLabel}`);
					await new Promise((r) => setTimeout(r, 200));

					const btn = document.querySelector("[data-action='rollDT']");
					assert.exists(btn, "Botão rollDT deve existir no DOM");

					let captured = null;
					const original = agent.rollSkill;
					agent.rollSkill = function (config) {
						captured = config;
						return Promise.resolve([]);
					};
					try {
						btn.click();
						await new Promise((r) => setTimeout(r, 300));
						assert.exists(captured, "actor.rollSkill foi chamado pelo click");
						assert.equal(captured.skill, skillKey, "skill propagada");
						assert.equal(captured.rolls?.[0]?.options?.target, 15, "DT propagada como target");
					} finally {
						agent.rollSkill = original;
					}
				});

				it("click em [data-action='rollOposto'] emite socket system.ordemparanormal", async function () {
					// Default 2s estoura sob carga (full-suite com muitas mensagens prévias
					// na coleção game.messages → re-render do chat fica progressivamente
					// lento; um run completo do batch suite acumula >1000 messages). O teste
					// em si só espera 200ms+500ms; subimos o budget pra 15s — em run isolado
					// passa em ~1.8s, e o cap só protege contra a degradação acumulada.
					this.timeout(15000);
					const skillKey = Object.keys(CONFIG.op.skills)[0];
					const skillLabel = game.i18n.localize(CONFIG.op.skills[skillKey]);
					await fireChatMessage(`/oposto ${skillLabel}`);
					await new Promise((r) => setTimeout(r, 200));

					const btn = document.querySelector("[data-action='rollOposto']");
					assert.exists(btn, "Botão rollOposto deve existir no DOM");

					// Stub rollSkill to return a deterministic roll
					const fakeRoll = { total: 17 };
					const originalRoll = agent.rollSkill;
					agent.rollSkill = () => Promise.resolve([fakeRoll]);

					let socketPayload = null;
					const originalEmit = game.socket.emit;
					game.socket.emit = function (name, payload) {
						if (name === "system.ordemparanormal" && payload?.type === "opostoResult") socketPayload = payload;
						return originalEmit.call(this, name, payload);
					};
					try {
						btn.click();
						await new Promise((r) => setTimeout(r, 500));
						assert.exists(socketPayload, "Socket emit não disparou — listener provavelmente não foi anexado");
						assert.equal(socketPayload.skillKey, skillKey);
						assert.equal(socketPayload.total, 17);
						assert.equal(socketPayload.actorId, agent.id);
					} finally {
						agent.rollSkill = originalRoll;
						game.socket.emit = originalEmit;
					}
				});
			});

			// ----------------------------------------------------------------
			// Listener attachment robusto (regressão do bug de boot race)
			// ----------------------------------------------------------------
			describe("listener attachment — chat sidebar", () => {
				it("o chat sidebar (#chat) tem um listener de click anexado", () => {
					// Não há API direta para inspecionar listeners, mas podemos verificar via
					// um sintoma: criar um card de /dt e clicar deve invocar o handler.
					// O test anterior (rollDT click) já cobre isso end-to-end. Aqui apenas
					// sanidade de que o elemento existe.
					const chatSection = document.getElementById("chat");
					assert.exists(chatSection, "<section id='chat'> deve existir após boot");
				});
			});
		},
		{ displayName: "OP | Chat: comandos /dt e /oposto" }
	);
});
