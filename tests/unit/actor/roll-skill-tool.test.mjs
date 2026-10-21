import { describe, it, expect, vi } from "vitest";

vi.mock("../../../module/applications/context-menu.mjs", () => ({
	default: class ContextMenu5e {},
}));

import { OrdemActor } from "../../../module/documents/actor.mjs";
import BasicRoll from "../../../module/dice/basic-roll.mjs";
import { OrdemThreatSheet } from "../../../module/sheets/threat-sheet.mjs";

describe("OrdemActor dice bonus configuration", () => {
	function makeActor() {
		return new OrdemActor({
			system: {
				attributes: { pre: { value: 2, diceBonus: 1 }, int: { value: 3, diceBonus: -1 }, dex: { value: 2, diceBonus: 1 } },
				skills: {
					religion: { value: 3, mod: 2, diceBonus: 2, degree: { value: 5 } },
					initiative: { attr: ["int"], value: 4, mod: 2, diceBonus: 2, degree: { value: 5 } },
				},
			},
		});
	}

	it("uses the selected attribute and records skill identity without adding dice bonuses to flat parts", () => {
		CONFIG.Dice.BasicRoll = BasicRoll;
		const actor = makeActor();
		const config = { parts: ["@situational"], data: { situational: 7 } };
		const formData = new Map([["attribute", "int"]]);
		actor._buildSkillToolConfig("skill", { skill: "religion", attributeId: "pre" }, config, formData, 0);
		expect(config.data.attributeId).toBe("int");
		expect(config.data.skillId).toBe("religion");
		expect(config.parts).toEqual(["@situational", "@prof", "@mod", "@extraBonus"]);
		expect(config.data).toMatchObject({ situational: 7, prof: 5, mod: 2, extraBonus: 3 });
	});

	it("clears stale skill identity for direct attribute tests", () => {
		CONFIG.Dice.BasicRoll = BasicRoll;
		const config = { data: { skillId: "religion" } };
		makeActor()._buildAttributesConfig("check", { attributeId: "pre" }, config, null, 0);
		expect(config.data.attributeId).toBe("pre");
		expect(config.data).not.toHaveProperty("skillId");
	});

	it("keeps combat initiative on dexterity and preserves numeric bonuses", () => {
		expect(makeActor().getRollData().rollInitiative).toBe("5d20kh + 7");
	});

	it("applies the shared pool to the threat sheet shortcut while preserving its numeric bonus", async () => {
		const actor = makeActor();
		const handler = OrdemThreatSheet.DEFAULT_OPTIONS.actions.onRollSkill;
		const toMessage = vi.spyOn(Roll.prototype, "toMessage");
		try {
			await handler.call(
				{ document: actor, actor },
				{ preventDefault() {} },
				{
					dataset: { key: "religion", attr: "int", label: "Religião" },
				}
			);
			expect(toMessage.mock.contexts[0].formula).toBe("4d20kh + 5");
		} finally {
			toMessage.mockRestore();
		}
	});
});

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
