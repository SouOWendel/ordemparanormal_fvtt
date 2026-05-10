import { describe, it, expect } from "vitest";
import { isOpostoSenderAuthorized } from "../../../module/utils.mjs";

/**
 * Build a fake `game`-like object with controllable `users.get` / `actors.get`.
 */
function makeDeps({ users = {}, actors = {} } = {}) {
	return {
		users: { get: (id) => users[id] },
		actors: { get: (id) => actors[id] },
	};
}

function makeUser({ id = "u1", isGM = false } = {}) {
	return { id, isGM };
}

function makeActor({ id = "a1", owners = new Set() } = {}) {
	return {
		id,
		testUserPermission: (user, level) => level === "OWNER" && owners.has(user.id),
	};
}

describe("isOpostoSenderAuthorized", () => {
	it("permits a GM sender even when the actor belongs to another user", () => {
		const gm = makeUser({ id: "gm1", isGM: true });
		const actor = makeActor({ id: "actor-of-player", owners: new Set(["player1"]) });
		const deps = makeDeps({ users: { gm1: gm }, actors: { "actor-of-player": actor } });

		expect(isOpostoSenderAuthorized({ userId: "gm1", actorId: "actor-of-player" }, deps)).toBe(true);
	});

	it("permits a non-GM sender that owns the actor", () => {
		const player = makeUser({ id: "player1" });
		const actor = makeActor({ id: "actor1", owners: new Set(["player1"]) });
		const deps = makeDeps({ users: { player1: player }, actors: { actor1: actor } });

		expect(isOpostoSenderAuthorized({ userId: "player1", actorId: "actor1" }, deps)).toBe(true);
	});

	it("rejects a non-GM sender claiming an actor they do not own (spoofing)", () => {
		const attacker = makeUser({ id: "attacker" });
		const victimActor = makeActor({ id: "victim-actor", owners: new Set(["someoneElse"]) });
		const deps = makeDeps({
			users: { attacker },
			actors: { "victim-actor": victimActor },
		});

		expect(isOpostoSenderAuthorized({ userId: "attacker", actorId: "victim-actor" }, deps)).toBe(false);
	});

	it("rejects when actorId references a non-existent actor", () => {
		const player = makeUser({ id: "player1" });
		const deps = makeDeps({ users: { player1: player }, actors: {} });

		expect(isOpostoSenderAuthorized({ userId: "player1", actorId: "ghost" }, deps)).toBe(false);
	});

	it("rejects when userId references a non-existent user", () => {
		const actor = makeActor({ id: "actor1", owners: new Set(["player1"]) });
		const deps = makeDeps({ users: {}, actors: { actor1: actor } });

		expect(isOpostoSenderAuthorized({ userId: "ghost", actorId: "actor1" }, deps)).toBe(false);
	});

	it("rejects when payload is missing userId or actorId", () => {
		const deps = makeDeps();
		expect(isOpostoSenderAuthorized({}, deps)).toBe(false);
		expect(isOpostoSenderAuthorized({ userId: "x" }, deps)).toBe(false);
		expect(isOpostoSenderAuthorized({ actorId: "x" }, deps)).toBe(false);
		expect(isOpostoSenderAuthorized(null, deps)).toBe(false);
	});
});
