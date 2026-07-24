import { describe, it, expect } from "vitest";
import { ritualAreaShapeKey, formatRitualArea } from "../../../module/helpers/ritual-area.mjs";

describe("ritualAreaShapeKey", () => {
	it("cone e sphere usam o formato raio/diâmetro", () => {
		expect(ritualAreaShapeKey("cone")).toBe("op.areaLabelSphereCone");
		expect(ritualAreaShapeKey("sphere")).toBe("op.areaLabelSphereCone");
	});

	it("cube e line usam o formato flat", () => {
		expect(ritualAreaShapeKey("cube")).toBe("op.areaLabelCubeLine");
		expect(ritualAreaShapeKey("line")).toBe("op.areaLabelCubeLine");
	});
});

describe("formatRitualArea (ghost read 1.1 fix)", () => {
	it("vazio quando não é ritual de área (target != 'area')", () => {
		expect(formatRitualArea({ area: { name: "sphere", size: "10", type: "radius" }, target: "creature" })).toBe("");
	});

	it("vazio quando não tem area.name", () => {
		expect(formatRitualArea({ area: { name: "", size: "", type: "" }, target: "area" })).toBe("");
	});

	it("vazio quando system é undefined/null", () => {
		expect(formatRitualArea(undefined)).toBe("");
		expect(formatRitualArea(null)).toBe("");
	});

	it("escolhe a chave certa pra sphere (mock i18n.format retorna a chave)", () => {
		expect(formatRitualArea({ area: { name: "sphere", size: "10", type: "radius" }, target: "area" })).toBe(
			"op.areaLabelSphereCone"
		);
	});

	it("escolhe a chave certa pra cube", () => {
		expect(formatRitualArea({ area: { name: "cube", size: "10", type: "" }, target: "area" })).toBe(
			"op.areaLabelCubeLine"
		);
	});
});
