import { describe, it, expect, vi } from "vitest";

vi.mock("../../../module/applications/context-menu.mjs", () => ({
	default: class ContextMenu5e {},
}));

import { OrdemActor } from "../../../module/documents/actor.mjs";

describe("OrdemActor — private method contract (GAP 6 regression)", () => {
	it("does not expose rollAttributeCheck as a public method", () => {
		// #rollSkillTool was calling this.rollAttributeCheck() — a public name —
		// but the method is declared private as #rollAttributeCheck.
		// Fixed to this.#rollAttributeCheck(). This test verifies the contract.
		expect(typeof OrdemActor.prototype.rollAttributeCheck).toBe("undefined");
	});

	it("exposes rollSkill and rollAttribute as public methods", () => {
		expect(typeof OrdemActor.prototype.rollSkill).toBe("function");
		expect(typeof OrdemActor.prototype.rollAttribute).toBe("function");
	});
});
