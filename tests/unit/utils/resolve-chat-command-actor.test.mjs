import { describe, it, expect, beforeEach } from "vitest";
import { resolveChatCommandActor } from "../../../module/utils.mjs";

function makeActor(id, type, { ownerOf = false } = {}) {
	return {
		id,
		name: `Actor-${id}`,
		type,
		testUserPermission(user, perm) {
			return ownerOf && perm === "OWNER" && user.id === "user-1";
		},
	};
}

function setupGame({
	controlledActor = null,
	controlledTokens = null,
	speakerActorId = null,
	isGM = false,
	actors = [],
} = {}) {
	const tokens = controlledTokens ?? (controlledActor ? [{ actor: controlledActor }] : []);
	globalThis.canvas = { tokens: { controlled: tokens } };
	globalThis.ChatMessage = class {
		static getSpeaker() {
			return { actor: speakerActorId };
		}
	};
	globalThis.game = {
		user: { id: "user-1", isGM },
		actors: {
			contents: actors,
			get(id) {
				return actors.find((a) => a.id === id) ?? null;
			},
		},
	};
}

describe("resolveChatCommandActor", () => {
	beforeEach(() => {
		// Reset between tests
		delete globalThis.canvas;
		delete globalThis.ChatMessage;
		delete globalThis.game;
	});

	it("priority 1: returns the controlled token's actor when one is selected", () => {
		const controlled = makeActor("c1", "agent");
		const owned = makeActor("o1", "agent", { ownerOf: true });
		setupGame({ controlledActor: controlled, actors: [owned, controlled], isGM: false });
		expect(resolveChatCommandActor()).toBe(controlled);
	});

	it("priority 2: falls back to game.user.character via speaker", () => {
		const character = makeActor("char-1", "agent");
		const other = makeActor("o1", "agent", { ownerOf: true });
		setupGame({ speakerActorId: "char-1", actors: [other, character], isGM: false });
		expect(resolveChatCommandActor()).toBe(character);
	});

	it("priority 3: player without token/character → first owned agent", () => {
		const owned = makeActor("o1", "agent", { ownerOf: true });
		const notOwned = makeActor("n1", "agent", { ownerOf: false });
		setupGame({ actors: [notOwned, owned], isGM: false });
		expect(resolveChatCommandActor()).toBe(owned);
	});

	it("priority 3: skips threats — only agent type qualifies for fallback", () => {
		const ownedThreat = makeActor("t1", "threat", { ownerOf: true });
		const ownedAgent = makeActor("a1", "agent", { ownerOf: true });
		setupGame({ actors: [ownedThreat, ownedAgent], isGM: false });
		expect(resolveChatCommandActor()).toBe(ownedAgent);
	});

	it("GM never falls back globally — must select token or have character", () => {
		const ownedAgent = makeActor("a1", "agent", { ownerOf: true });
		setupGame({ actors: [ownedAgent], isGM: true });
		expect(resolveChatCommandActor()).toBeNull();
	});

	it("GM with controlled token still resolves the controlled actor", () => {
		const controlled = makeActor("c1", "threat");
		setupGame({ controlledActor: controlled, actors: [controlled], isGM: true });
		expect(resolveChatCommandActor()).toBe(controlled);
	});

	it("multiple controlled tokens: prefers the one the user owns (deterministic)", () => {
		const notOwned = makeActor("a1", "agent", { ownerOf: false });
		const owned = makeActor("a2", "agent", { ownerOf: true });
		setupGame({
			controlledTokens: [{ actor: notOwned }, { actor: owned }],
			actors: [notOwned, owned],
			isGM: false,
		});
		expect(resolveChatCommandActor()).toBe(owned);
	});

	it("multiple controlled tokens, none owned: falls back to the first (stable)", () => {
		const a = makeActor("a1", "threat", { ownerOf: false });
		const b = makeActor("a2", "threat", { ownerOf: false });
		setupGame({ controlledTokens: [{ actor: a }, { actor: b }], actors: [a, b], isGM: true });
		expect(resolveChatCommandActor()).toBe(a);
	});

	it("returns null when no priority resolves (player without any owned agent)", () => {
		const notOwned = makeActor("n1", "agent", { ownerOf: false });
		setupGame({ actors: [notOwned], isGM: false });
		expect(resolveChatCommandActor()).toBeNull();
	});

	it("speaker.actor returning a stale id is ignored, falls through to owned-agent", () => {
		const owned = makeActor("o1", "agent", { ownerOf: true });
		setupGame({ speakerActorId: "deleted-id", actors: [owned], isGM: false });
		expect(resolveChatCommandActor()).toBe(owned);
	});
});
