import { describe, it, expect } from "vitest";
// import { AmmunitionData } from "../../../module/data/items/ammunition-data.mjs";
import { ArmamentData } from "../../../module/data/items/armament-data.mjs";
import { GeneralEquipmentData } from "../../../module/data/items/general-equipment-data.mjs";
import { ProtectionData } from "../../../module/data/items/protection-data.mjs";
import { AbilityData } from "../../../module/data/items/ability-data.mjs";
import { RitualData } from "../../../module/data/items/ritual-data.mjs";
import { ClassData } from "../../../module/data/items/class-data.mjs";
import { OriginData } from "../../../module/data/items/origin-data.mjs";
import { PathData } from "../../../module/data/items/path-data.mjs";

describe("ArmamentData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = ArmamentData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("description");
		expect(keys).toContain("weight");
		expect(keys).toContain("category");
		expect(keys).toContain("using");
		expect(keys).toContain("quantity");
		expect(keys).toContain("proficiency");
		expect(keys).toContain("types");
		expect(keys).toContain("critical");
		expect(keys).toContain("range");
		expect(keys).toContain("formulas");
		expect(keys).toContain("penalty");
		expect(keys).toContain("conditions");
	});

	it("formulas schema has attack, damage, extraFormula", () => {
		const schema = ArmamentData.defineSchema();
		const formulaKeys = Object.keys(schema.formulas.fields);
		expect(formulaKeys).toContain("attack");
		expect(formulaKeys).toContain("damage");
		expect(formulaKeys).toContain("extraFormula");
	});

	it("conditions schema has all 6 boolean flags", () => {
		const schema = ArmamentData.defineSchema();
		const condKeys = Object.keys(schema.conditions.fields);
		expect(condKeys).toContain("improvised");
		expect(condKeys).toContain("throwable");
		expect(condKeys).toContain("agile");
		expect(condKeys).toContain("automatic");
		expect(condKeys).toContain("adaptableGrip");
		expect(condKeys).toContain("pistolBlow");
	});

	it("migrateData returns data unchanged", () => {
		const data = { description: "test" };
		expect(ArmamentData.migrateData(data)).toBe(data);
	});

	it("stores proficiency as a string enum", () => {
		const schema = ArmamentData.defineSchema();

		expect(schema.proficiency.constructor.name).toBe("StringField");
	});
});

describe("GeneralEquipmentData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = GeneralEquipmentData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("description");
		expect(keys).toContain("weight");
		expect(keys).toContain("category");
		expect(keys).toContain("using");
		expect(keys).toContain("type");
		expect(keys).toContain("quantity");
	});
});

describe("ProtectionData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = ProtectionData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("description");
		expect(keys).toContain("weight");
		expect(keys).toContain("category");
		expect(keys).toContain("using");
		expect(keys).toContain("defense");
		expect(keys).toContain("penalty");
		expect(keys).toContain("quantity");
	});
});

describe("AbilityData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = AbilityData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("id");
		expect(keys).toContain("abilityType");
		expect(keys).toContain("preRequisite");
		expect(keys).toContain("description");
		expect(keys).toContain("activation");
	});

	it("includes cost and costType (previously read by sheets but missing from schema)", () => {
		const schema = AbilityData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("cost");
		expect(keys).toContain("costType");
	});
});

describe("RitualData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = RitualData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("description");
		expect(keys).toContain("circle");
		expect(keys).toContain("element");
		expect(keys).toContain("target");
		expect(keys).toContain("execution");
		expect(keys).toContain("range");
		expect(keys).toContain("area");
		expect(keys).toContain("duration");
		expect(keys).toContain("resistance");
		expect(keys).toContain("studentForm");
		expect(keys).toContain("trueForm");
	});

	it("includes skillResis and targetQtd (previously written by template but missing from schema)", () => {
		const schema = RitualData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("skillResis");
		expect(keys).toContain("targetQtd");
	});

	it("area schema has name, size, type", () => {
		const schema = RitualData.defineSchema();
		const areaKeys = Object.keys(schema.area.fields);
		expect(areaKeys).toContain("name");
		expect(areaKeys).toContain("size");
		expect(areaKeys).toContain("type");
	});
});

describe("ClassData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = ClassData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("id");
		expect(keys).toContain("description");
		expect(keys).toContain("hpInitial");
		expect(keys).toContain("hpPerLevel");
		expect(keys).toContain("peInitial");
		expect(keys).toContain("pePerLevel");
		expect(keys).toContain("sanInitial");
		expect(keys).toContain("sanPerLevel");
		expect(keys).toContain("skillCount");
		expect(keys).toContain("grantedSkills");
		expect(keys).toContain("proficiencies");
		expect(keys).toContain("abilities");
		expect(keys).toContain("disableCalculations");
		expect(keys).toContain("isSurvivor");
	});

	it("has singleton metadata enabled", () => {
		expect(ClassData.metadata.singleton).toBe(true);
	});
});

describe("OriginData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = OriginData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("id");
		expect(keys).toContain("description");
		expect(keys).toContain("grantedSkills");
		expect(keys).toContain("ability");
	});

	it("has singleton metadata enabled", () => {
		expect(OriginData.metadata.singleton).toBe(true);
	});
});

describe("PathData.defineSchema()", () => {
	it("returns all top-level keys", () => {
		const schema = PathData.defineSchema();
		const keys = Object.keys(schema);
		expect(keys).toContain("id");
		expect(keys).toContain("description");
		expect(keys).toContain("preRequisite");
		expect(keys).toContain("abilities");
	});

	it("has singleton metadata enabled", () => {
		expect(PathData.metadata.singleton).toBe(true);
	});
});

// describe("AmmunitionData.defineSchema()", () => {
// 	it("returns all top-level keys", () => {
// 		const schema = AmmunitionData.defineSchema();
// 		const keys = Object.keys(schema);
// 		expect(keys).toContain("description");
//		expect(keys).toContain("weight");
// 		expect(keys).toContain("category");
// 		expect(keys).toContain("using");
// 		expect(keys).toContain("type");
// 		expect(keys).toContain("defense");
// 		expect(keys).toContain("quantity");
// 	});

// 	it("migrateData returns data unchanged", () => {
// 		const data = { type: "9mm" };
// 		expect(AmmunitionData.migrateData(data)).toBe(data);
// 	});
// });
