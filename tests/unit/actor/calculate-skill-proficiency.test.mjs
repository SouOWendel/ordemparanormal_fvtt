import { describe, it, expect } from "vitest";
import { calculateSkillProficiency } from "../../../module/helpers/actor-calculations.mjs";

describe("calculateSkillProficiency", () => {
	it("returns 0 for untrained", () => {
		expect(calculateSkillProficiency("untrained")).toBe(0);
	});

	it("returns 5 for trained", () => {
		expect(calculateSkillProficiency("trained")).toBe(5);
	});

	it("returns 10 for veteran", () => {
		expect(calculateSkillProficiency("veteran")).toBe(10);
	});

	it("returns 15 for expert", () => {
		expect(calculateSkillProficiency("expert")).toBe(15);
	});

	it("returns 20 for master", () => {
		expect(calculateSkillProficiency("master")).toBe(20);
	});

	it("returns 25 for alfa", () => {
		expect(calculateSkillProficiency("alfa")).toBe(25);
	});

	it("returns 30 for gama", () => {
		expect(calculateSkillProficiency("gama")).toBe(30);
	});

	it("returns 35 for delta", () => {
		expect(calculateSkillProficiency("delta")).toBe(35);
	});

	it("returns 0 for unknown string", () => {
		expect(calculateSkillProficiency("ascended")).toBe(0);
	});

	it("returns 0 for empty string", () => {
		expect(calculateSkillProficiency("")).toBe(0);
	});
});
