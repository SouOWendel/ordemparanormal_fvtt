import { describe, it, expect, vi, afterEach } from "vitest";
import {
	getResourceDefinitions,
	resolveTokenResources,
	areTokenResourcesVisible,
} from "../../../module/helpers/token-resources.mjs";
import { applyTokenResourceInput } from "../../../module/components/token-resource-hud.mjs";

afterEach(() => vi.unstubAllGlobals());

describe("token resources", () => {
	it.each([
		["agent", false, ["PV", "PE", "SAN"]],
		["agent", true, ["PV", "PD"]],
		["threat", false, ["attributes.hp"]],
		["threat", true, ["attributes.hp"]],
		["unknown", false, []],
	])("selects resources for %s, withoutSanity=%s", (type, rule, expected) => {
		expect(getResourceDefinitions(type, rule).map((resource) => resource.attribute)).toEqual(expected);
	});
	it("reads prepared synthetic values and clamps only the visual fraction", () => {
		const actor = {
			type: "agent",
			system: { PV: { value: -2, max: 10 }, PE: { value: 8, max: 4 }, SAN: { value: 0, max: 0 } },
		};
		const before = structuredClone(actor);
		expect(resolveTokenResources(actor).map(({ value, max, fraction }) => ({ value, max, fraction }))).toEqual([
			{ value: -2, max: 10, fraction: 0 },
			{ value: 8, max: 4, fraction: 1 },
			{ value: 0, max: 0, fraction: 0 },
		]);
		expect(actor).toEqual(before);
		actor.system.PE = { value: 9, max: 18 };
		expect(resolveTokenResources(actor)[1].fraction).toBe(0.5);
	});
	it("omits missing, non-finite and invalid resources", () => {
		expect(resolveTokenResources(null)).toEqual([]);
		expect(
			resolveTokenResources({ type: "agent", system: { PV: { value: NaN, max: 10 }, PE: { value: 2, max: -1 } } })
		).toEqual([]);
	});
	it.each([
		[true, false, true, false, true],
		[false, true, true, false, true],
		[false, false, true, false, false],
		[true, true, false, false, false],
		[true, true, true, true, false],
	])("limits visibility (GM=%s owner=%s hover=%s secret=%s)", (isGM, isOwner, hover, isSecret, expected) => {
		expect(areTokenResourcesVisible({ hasActor: true, isGM, isOwner, hover, isSecret })).toBe(expected);
	});
	it("allows collective highlight only for authorized viewers", () => {
		expect(areTokenResourcesVisible({ hasActor: true, isOwner: true, highlightObjects: true })).toBe(true);
		expect(areTokenResourcesVisible({ hasActor: true, isOwner: false, highlightObjects: true })).toBe(false);
	});
});

describe("resource HUD writes", () => {
	function makeHUD(rule = false) {
		vi.stubGlobal("game", { settings: { get: () => rule } });
		const actor = {
			type: "agent",
			isOwner: true,
			system: { PV: { value: 5, max: 10 }, PD: { value: 2, max: 8 } },
			modifyTokenAttribute: vi.fn().mockResolvedValue(undefined),
		};
		return {
			document: { actor },
			_parseAttributeInput: vi.fn((_attribute, resource, input) => {
				const isDelta = /^[+-]/.test(input);
				const amount = input.endsWith("%")
					? (Number(input.slice(0, -1)) / 100) * resource.max
					: Number(input.replace(/^=/, ""));
				return { value: isDelta ? resource.value + amount : amount, delta: isDelta ? amount : undefined, isDelta };
			}),
		};
	}
	it.each([
		["8", 8, false],
		["+3", 3, true],
		["-2", -2, true],
		["50%", 5, false],
		["-10%", -1, true],
		["=4", 4, false],
	])("applies %s once to the original actor", async (input, value, isDelta) => {
		const hud = makeHUD();
		await applyTokenResourceInput(hud, "PV", input);
		expect(hud.document.actor.modifyTokenAttribute).toHaveBeenCalledExactlyOnceWith("PV", value, isDelta, true);
	});
	it("rejects invalid, unauthorized and stale resources without a mutation", async () => {
		const hud = makeHUD(true);
		for (const [attribute, input] of [
			["PE", "2"],
			["PV", "bad"],
			["PV", ""],
			["PV", "Infinity"],
		]) {
			await expect(applyTokenResourceInput(hud, attribute, input)).rejects.toThrow();
		}
		hud.document.actor.isOwner = false;
		await expect(applyTokenResourceInput(hud, "PV", "2")).rejects.toThrow();
		expect(hud.document.actor.modifyTokenAttribute).not.toHaveBeenCalled();
	});
	it("does not replay a failed mutation", async () => {
		const hud = makeHUD();
		hud.document.actor.modifyTokenAttribute.mockRejectedValue(new Error("Disconnected"));
		await expect(applyTokenResourceInput(hud, "PV", "+2")).rejects.toThrow("Disconnected");
		expect(hud.document.actor.modifyTokenAttribute).toHaveBeenCalledTimes(1);
	});
});
