import { describe, it, expect } from "vitest";
import {
	CONDITIONS,
	CONDITION_IDS,
	buildStatusEffects,
	getDicePenalty,
	getConditionDefensePenalty,
	escalationTarget,
	computeHealthConditions,
	resolveHealthWriterId,
	resolveDamageLethality,
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

describe("computeHealthConditions — Morrendo/Machucado/Inconsciente", () => {
	it("PV 0 → morrendo + machucado + inconsciente (livro p. 88)", () => {
		expect(computeHealthConditions(0, 30)).toEqual({ morrendo: true, machucado: true, inconsciente: true });
	});
	it("PV negativo também conta como 0 PV", () => {
		expect(computeHealthConditions(-5, 30)).toEqual({ morrendo: true, machucado: true, inconsciente: true });
	});
	it("PV na metade → só machucado", () => {
		expect(computeHealthConditions(15, 30)).toEqual({ morrendo: false, machucado: true, inconsciente: false });
	});
	it("PV acima da metade → nenhum", () => {
		expect(computeHealthConditions(16, 30)).toEqual({ morrendo: false, machucado: false, inconsciente: false });
		expect(computeHealthConditions(30, 30)).toEqual({ morrendo: false, machucado: false, inconsciente: false });
	});
	it("max 0 não marca machucado", () => {
		expect(computeHealthConditions(0, 0)).toEqual({ morrendo: true, machucado: false, inconsciente: true });
	});
});

describe("computeHealthConditions — dano não letal (livro p. 87)", () => {
	it("não letal igual ao PV restante derruba inconsciente, sem morrendo", () => {
		expect(computeHealthConditions(20, 30, 20)).toEqual({
			morrendo: false,
			machucado: false,
			inconsciente: true,
		});
	});

	it("não letal acima do PV restante também derruba", () => {
		expect(computeHealthConditions(20, 30, 25).inconsciente).toBe(true);
	});

	it("não letal abaixo do PV restante não derruba", () => {
		expect(computeHealthConditions(20, 30, 19).inconsciente).toBe(false);
	});

	it("não letal nunca causa morrendo", () => {
		expect(computeHealthConditions(1, 30, 999).morrendo).toBe(false);
	});

	it("não letal não altera machucado (é sobre PV totais)", () => {
		expect(computeHealthConditions(20, 30, 20).machucado).toBe(false);
	});

	it("ausente ou negativo é tratado como 0", () => {
		expect(computeHealthConditions(10, 30).inconsciente).toBe(false);
		expect(computeHealthConditions(10, 30, -5).inconsciente).toBe(false);
	});
});

describe("resolveHealthWriterId — quem escreve as condições automáticas", () => {
	const owner = { id: "u-owner", active: true, isGM: false };
	const other = { id: "u-other", active: true, isGM: false };
	const gm = { id: "u-gm", active: true, isGM: true };
	const actor = { testUserPermission: (u) => u.id === "u-owner" };

	it("elege o MJ ativo quando há um conectado", () => {
		expect(resolveHealthWriterId([owner, gm, other], actor)).toBe("u-gm");
	});

	it("ignora o MJ desconectado", () => {
		expect(resolveHealthWriterId([owner, { ...gm, active: false }], actor)).toBe("u-owner");
	});

	it("sem MJ, elege o dono ativo do ator", () => {
		expect(resolveHealthWriterId([other, owner], actor)).toBe("u-owner");
	});

	it("sem MJ e sem dono ativo, ninguém escreve", () => {
		expect(resolveHealthWriterId([other], actor)).toBeNull();
		expect(resolveHealthWriterId([{ ...owner, active: false }], actor)).toBeNull();
	});

	it("é estável: todo cliente elege o mesmo escritor", () => {
		const users = [owner, gm, other];
		expect(resolveHealthWriterId(users, actor)).toBe(resolveHealthWriterId([...users].reverse(), actor));
	});

	it("não estoura sem usuários ou sem ator", () => {
		expect(resolveHealthWriterId(undefined, actor)).toBeNull();
		expect(resolveHealthWriterId([other], undefined)).toBeNull();
	});
});

describe("resolveDamageLethality — letalidade do ataque no clique de dano", () => {
	it("a escolha do ataque atual vence o padrão da arma", () => {
		expect(
			resolveDamageLethality({ fromThisAttack: true, inMemory: true, fromCard: undefined, weaponDefault: false })
		).toBe(true);
		expect(
			resolveDamageLethality({ fromThisAttack: true, inMemory: false, fromCard: undefined, weaponDefault: true })
		).toBe(false);
	});

	it("card antigo não herda o ataque em memória — a conversão não foi paga nele", () => {
		expect(
			resolveDamageLethality({ fromThisAttack: false, inMemory: true, fromCard: undefined, weaponDefault: false })
		).toBe(false);
	});

	it("depois de um reload, a letalidade vem do card", () => {
		expect(
			resolveDamageLethality({ fromThisAttack: true, inMemory: undefined, fromCard: true, weaponDefault: false })
		).toBe(true);
		expect(
			resolveDamageLethality({ fromThisAttack: false, inMemory: undefined, fromCard: false, weaponDefault: true })
		).toBe(false);
	});

	it("dano sem ataque por trás cai no padrão da arma", () => {
		expect(resolveDamageLethality({ weaponDefault: true })).toBe(true);
		expect(resolveDamageLethality({ weaponDefault: false })).toBe(false);
		expect(resolveDamageLethality({})).toBe(false);
	});
});
