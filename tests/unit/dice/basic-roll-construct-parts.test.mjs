import { describe, it, expect, vi } from "vitest";

vi.mock("../../../module/applications/dialog.mjs", () => ({ default: class {} }));

import BasicRoll from "../../../module/dice/basic-roll.mjs";

describe("BasicRoll.constructParts", () => {
	it("empty parts object returns { parts: [], data: {} }", () => {
		const result = BasicRoll.constructParts({});
		expect(result).toEqual({ parts: [], data: {} });
	});

	it("null values are skipped", () => {
		const result = BasicRoll.constructParts({ bonus: null, mod: undefined });
		expect(result.parts).toHaveLength(0);
	});

	it('{ bonus: 5 } → parts: ["@bonus"], data: { bonus: 5 }', () => {
		const result = BasicRoll.constructParts({ bonus: 5 });
		expect(result.parts).toEqual(["@bonus"]);
		expect(result.data).toEqual({ bonus: 5 });
	});

	it('{ prof: 10, mod: 3 } → parts: ["@prof", "@mod"], data: { prof: 10, mod: 3 }', () => {
		const result = BasicRoll.constructParts({ prof: 10, mod: 3 });
		expect(result.parts).toEqual(["@prof", "@mod"]);
		expect(result.data).toEqual({ prof: 10, mod: 3 });
	});

	it("string values go through Roll.replaceFormulaData", () => {
		const result = BasicRoll.constructParts({ bonus: "@prof" }, { prof: 4 });
		expect(result.data.bonus).toBe("4");
	});

	it("zero value (0) is kept, not skipped", () => {
		const result = BasicRoll.constructParts({ bonus: 0 });
		expect(result.parts).toEqual(["@bonus"]);
		expect(result.data.bonus).toBe(0);
	});
});
