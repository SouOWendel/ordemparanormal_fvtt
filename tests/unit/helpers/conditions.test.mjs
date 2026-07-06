import { describe, it, expect } from "vitest";
import {
	CONDITIONS,
	CONDITION_IDS,
	buildStatusEffects,
	getDicePenalty,
	getConditionDefensePenalty,
	escalationTarget,
	computeHealthConditions,
} from "../../../module/helpers/conditions.mjs";

describe("conditions — catálogo", () => {
	it("tem as 38 condições do livro + morto", () => {
		expect(CONDITION_IDS).toHaveLength(39);
		for (const key of ["abalado", "apavorado", "agarrado", "morrendo", "machucado", "surdo", "morto"]) {
			expect(CONDITIONS[key]).toBeDefined();
		}
	});

	it("buildStatusEffects gera entradas v13 válidas (id/name/img/changes)", () => {
		const effects = buildStatusEffects();
		expect(effects).toHaveLength(39);
		for (const e of effects) {
			expect(typeof e.id).toBe("string");
			expect(e.name).toMatch(/^op\.conditions\./);
			expect(e.img).toMatch(/^icons\/svg\/.+\.svg$/);
			expect(Array.isArray(e.changes)).toBe(true);
			expect(e.changes).toHaveLength(0); // marcadores puros — mecânica é computada em código
		}
		expect(effects.map((e) => e.id)).toEqual(CONDITION_IDS);
	});

	it("morto é overlay (usado por specialStatusEffects.DEFEATED)", () => {
		const morto = buildStatusEffects().find((e) => e.id === "morto");
		expect(morto.overlay).toBe(true);
	});
});

describe("getDicePenalty — penalidade de dado", () => {
	it("Abalado (-1d em TODOS os testes) aplica em atributo, perícia e ataque", () => {
		for (const kind of ["attribute", "skill", "attack"]) {
			expect(getDicePenalty(["abalado"], { kind, attribute: "dex", skill: "reflexes" })).toBe(1);
		}
	});

	it("Apavorado (-2d perícia) só em perícia", () => {
		expect(getDicePenalty(["apavorado"], { kind: "skill", skill: "stealth" })).toBe(2);
		expect(getDicePenalty(["apavorado"], { kind: "attribute", attribute: "dex" })).toBe(0);
		expect(getDicePenalty(["apavorado"], { kind: "attack", attribute: "str" })).toBe(0);
	});

	it("Fraco (-1d AGI/FOR/VIG) por atributo", () => {
		expect(getDicePenalty(["fraco"], { kind: "attribute", attribute: "dex" })).toBe(1);
		expect(getDicePenalty(["fraco"], { kind: "skill", attribute: "str", skill: "athleticism" })).toBe(1);
		expect(getDicePenalty(["fraco"], { kind: "attribute", attribute: "int" })).toBe(0);
	});

	it("Cego (-2d AGI/FOR PERÍCIAS) — só perícia, não atributo cru nem ataque", () => {
		expect(getDicePenalty(["cego"], { kind: "skill", attribute: "dex", skill: "acrobatics" })).toBe(2);
		expect(getDicePenalty(["cego"], { kind: "attribute", attribute: "dex" })).toBe(0);
		expect(getDicePenalty(["cego"], { kind: "attack", attribute: "dex" })).toBe(0);
	});

	it("Desprevenido (-1d Reflexos) só na perícia reflexes", () => {
		expect(getDicePenalty(["desprevenido"], { kind: "skill", skill: "reflexes" })).toBe(1);
		expect(getDicePenalty(["desprevenido"], { kind: "skill", skill: "perception" })).toBe(0);
	});

	it("Surdo (-2d Iniciativa)", () => {
		expect(getDicePenalty(["surdo"], { kind: "skill", skill: "initiative" })).toBe(2);
		expect(getDicePenalty(["surdo"], { kind: "skill", skill: "stealth" })).toBe(0);
	});

	it("Agarrado (-1d ataque) e Caído (-2d ataque CaC apenas)", () => {
		expect(getDicePenalty(["agarrado"], { kind: "attack" })).toBe(1);
		expect(getDicePenalty(["agarrado"], { kind: "skill", skill: "fighting" })).toBe(0);
		expect(getDicePenalty(["caido"], { kind: "attack", melee: true })).toBe(2);
		expect(getDicePenalty(["caido"], { kind: "attack", melee: false })).toBe(0);
	});

	it("Ofuscado penaliza ataque E Percepção", () => {
		expect(getDicePenalty(["ofuscado"], { kind: "attack" })).toBe(1);
		expect(getDicePenalty(["ofuscado"], { kind: "skill", skill: "perception" })).toBe(1);
		expect(getDicePenalty(["ofuscado"], { kind: "skill", skill: "stealth" })).toBe(0);
	});

	it("penalidades de dado SOMAM entre condições diferentes", () => {
		// Abalado (-1d todos) + Fraco (-1d dex) numa perícia baseada em DEX = -2
		expect(getDicePenalty(["abalado", "fraco"], { kind: "skill", attribute: "dex", skill: "acrobatics" })).toBe(2);
	});

	it("aceita Set, array, ou vazio/null", () => {
		expect(getDicePenalty(new Set(["abalado"]), { kind: "attribute", attribute: "dex" })).toBe(1);
		expect(getDicePenalty([], { kind: "attribute", attribute: "dex" })).toBe(0);
		expect(getDicePenalty(null, { kind: "attribute", attribute: "dex" })).toBe(0);
	});
});

describe("getConditionDefensePenalty — MAX (mesmo efeito não acumula, p. 312)", () => {
	it("desprevenido (-5) + vulnerável (-2) = -5 (não -7)", () => {
		expect(getConditionDefensePenalty(["desprevenido", "vulneravel"])).toBe(5);
	});

	it("indefeso (-10) domina", () => {
		expect(getConditionDefensePenalty(["indefeso", "desprevenido", "vulneravel"])).toBe(10);
	});

	it("vulnerável sozinho = -2; nenhuma = 0", () => {
		expect(getConditionDefensePenalty(["vulneravel"])).toBe(2);
		expect(getConditionDefensePenalty([])).toBe(0);
		expect(getConditionDefensePenalty(null)).toBe(0);
	});
});

describe("escalationTarget — escalonamento", () => {
	it("cadeias do livro", () => {
		expect(escalationTarget("abalado")).toBe("apavorado");
		expect(escalationTarget("fraco")).toBe("debilitado");
		expect(escalationTarget("debilitado")).toBe("inconsciente");
		expect(escalationTarget("fatigado")).toBe("exausto");
		expect(escalationTarget("exausto")).toBe("inconsciente");
		expect(escalationTarget("frustrado")).toBe("esmorecido");
	});

	it("condições sem escalonamento retornam null", () => {
		expect(escalationTarget("apavorado")).toBeNull();
		expect(escalationTarget("vulneravel")).toBeNull();
		expect(escalationTarget("inexistente")).toBeNull();
	});
});

describe("computeHealthConditions — Morrendo/Machucado", () => {
	it("PV 0 → morrendo + machucado", () => {
		expect(computeHealthConditions(0, 30)).toEqual({ morrendo: true, machucado: true });
	});
	it("PV na metade → só machucado", () => {
		expect(computeHealthConditions(15, 30)).toEqual({ morrendo: false, machucado: true });
	});
	it("PV acima da metade → nenhum", () => {
		expect(computeHealthConditions(16, 30)).toEqual({ morrendo: false, machucado: false });
		expect(computeHealthConditions(30, 30)).toEqual({ morrendo: false, machucado: false });
	});
	it("max 0 não marca machucado", () => {
		expect(computeHealthConditions(0, 0)).toEqual({ morrendo: true, machucado: false });
	});
});
