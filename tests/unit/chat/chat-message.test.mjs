import { describe, it, expect } from "vitest";
import { resolveIsCreator, classifyD20Roll } from "../../../module/documents/chat-message.mjs";

// ─── resolveIsCreator ────────────────────────────────────────────────────────

describe("resolveIsCreator", () => {
	const makeMessage = (authorId) => ({ author: { id: authorId } });
	const makeActor = (isOwner) => ({ isOwner });
	const makeUser = (id, isGM = false) => ({ id, isGM });

	it("true when user is GM", () => {
		const msg = makeMessage("author-1");
		const user = makeUser("gm-1", true);
		expect(resolveIsCreator(msg, null, user)).toBe(true);
	});

	it("true when user is the message author", () => {
		const msg = makeMessage("user-1");
		const user = makeUser("user-1", false);
		expect(resolveIsCreator(msg, null, user)).toBe(true);
	});

	it("true when user is owner of the actor", () => {
		const msg = makeMessage("other-user");
		const actor = makeActor(true);
		const user = makeUser("user-1", false);
		expect(resolveIsCreator(msg, actor, user)).toBe(true);
	});

	it("false when user is not GM, not author, and not actor owner", () => {
		const msg = makeMessage("other-user");
		const actor = makeActor(false);
		const user = makeUser("user-1", false);
		expect(resolveIsCreator(msg, actor, user)).toBe(false);
	});

	it("false when actor is null and user is not GM nor author", () => {
		const msg = makeMessage("other-user");
		const user = makeUser("user-1", false);
		expect(resolveIsCreator(msg, null, user)).toBe(false);
	});

	it("true when both author and owner — still true (not double-counted)", () => {
		const msg = makeMessage("user-1");
		const actor = makeActor(true);
		const user = makeUser("user-1", false);
		expect(resolveIsCreator(msg, actor, user)).toBe(true);
	});
});

// ─── classifyD20Roll ──────────────────────────────────────────────────────────

describe("classifyD20Roll", () => {
	function makeD20Roll({ isCritical = false, isFumble = false, isSuccess = false, isFailure = false } = {}) {
		return { isCritical, isFumble, isSuccess, isFailure };
	}

	it("returns 'critical' when isCritical is true", () => {
		expect(classifyD20Roll(makeD20Roll({ isCritical: true }))).toBe("critical");
	});

	it("returns 'fumble' when isFumble is true (and not critical)", () => {
		expect(classifyD20Roll(makeD20Roll({ isFumble: true }))).toBe("fumble");
	});

	it("returns 'success' when isSuccess is true (and not critical or fumble)", () => {
		expect(classifyD20Roll(makeD20Roll({ isSuccess: true }))).toBe("success");
	});

	it("returns 'failure' when isFailure is true (and not critical, fumble, or success)", () => {
		expect(classifyD20Roll(makeD20Roll({ isFailure: true }))).toBe("failure");
	});

	it("returns null when none of the flags are true", () => {
		expect(classifyD20Roll(makeD20Roll())).toBeNull();
	});

	it("'critical' takes precedence over 'success'", () => {
		expect(classifyD20Roll(makeD20Roll({ isCritical: true, isSuccess: true }))).toBe("critical");
	});

	it("'critical' takes precedence over 'fumble'", () => {
		expect(classifyD20Roll(makeD20Roll({ isCritical: true, isFumble: true }))).toBe("critical");
	});

	it("'fumble' takes precedence over 'failure'", () => {
		expect(classifyD20Roll(makeD20Roll({ isFumble: true, isFailure: true }))).toBe("fumble");
	});
});
