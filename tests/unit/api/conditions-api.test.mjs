/* eslint-disable prefer-spread -- `conditions.apply()` is the public method name, not Function.prototype.apply */
/**
 * Contract tests for the public condition API. These guard what third-party
 * modules are allowed to rely on — a failure here is a breaking change for them,
 * not just a refactor.
 */
import { describe, it, expect, vi } from "vitest";
import { buildConditionsApi, CONDITIONS_API_VERSION, CONDITION_HOOKS } from "../../../module/api/conditions-api.mjs";
import { CONDITION_IDS } from "../../../module/helpers/conditions.mjs";

function makeActor(active = []) {
	const set = new Set(active);
	return {
		_activeConditionIds: () => set,
		statuses: set,
		toggleStatusEffect: vi.fn(async (id, { active = true } = {}) => {
			if (active) set.add(id);
			else set.delete(id);
			// Real toggleStatusEffect hands back an ActiveEffect; the API reads the
			// applied condition off `statuses`, so the stub has to carry it.
			return { id, active, statuses: new Set([id]) };
		}),
	};
}

describe("conditions API — shape", () => {
	const api = buildConditionsApi();

	it("expõe a versão para feature-detection", () => {
		expect(api.version).toBe(CONDITIONS_API_VERSION);
		expect(typeof api.version).toBe("number");
	});

	it("expõe os nomes dos hooks públicos", () => {
		expect(api.hooks).toEqual(CONDITION_HOOKS);
		expect(api.hooks.applied).toBe("ordemparanormal.conditionApplied");
		expect(api.hooks.removed).toBe("ordemparanormal.conditionRemoved");
		expect(api.hooks.escalated).toBe("ordemparanormal.conditionEscalated");
	});

	it("o objeto da API é congelado", () => {
		expect(Object.isFrozen(api)).toBe(true);
	});

	it("tem exatamente os métodos do contrato", () => {
		for (const m of ["list", "get", "has", "isActive", "active", "apply", "remove"]) {
			expect(typeof api[m]).toBe("function");
		}
	});
});

describe("conditions API — list/get/has", () => {
	const api = buildConditionsApi();

	it("list() devolve todas as condições do sistema", () => {
		expect(api.list()).toHaveLength(CONDITION_IDS.length);
	});

	it("descritores são congelados — módulo não muta a tabela interna", () => {
		const d = api.list()[0];
		expect(Object.isFrozen(d)).toBe(true);
		expect(() => {
			"use strict";
			d.id = "hackeado";
		}).toThrow();
	});

	it("descritor tem o formato documentado", () => {
		const d = api.get("abalado");
		expect(d).toMatchObject({
			id: "abalado",
			label: expect.any(String),
			img: expect.any(String),
			overlay: expect.any(Boolean),
			defensePenalty: expect.any(Number),
		});
	});

	it("label vem localizado e labelKey guarda a chave i18n", () => {
		const d = api.get("abalado");
		expect(d.labelKey).toBe("op.conditions.abalado");
		expect(typeof d.label).toBe("string");
	});

	it("descritores mantêm identidade estável entre chamadas", () => {
		expect(api.list()).toBe(api.list());
		expect(api.get("abalado")).toBe(api.get("abalado"));
	});

	it("expõe o alvo de escalonamento", () => {
		expect(api.get("abalado").escalatesTo).toBe("apavorado");
		expect(api.get("apavorado").escalatesTo).toBeNull();
	});

	it("expõe a penalidade de Defesa como número", () => {
		expect(api.get("desprevenido").defensePenalty).toBe(5);
		expect(api.get("abalado").defensePenalty).toBe(0);
	});

	it("get/has com id desconhecido não explode", () => {
		expect(api.get("nao-existe")).toBeNull();
		expect(api.has("nao-existe")).toBe(false);
		expect(api.has("morrendo")).toBe(true);
	});
});

describe("conditions API — consulta em ator", () => {
	const api = buildConditionsApi();

	it("isActive reflete o estado do ator", () => {
		const actor = makeActor(["abalado"]);
		expect(api.isActive(actor, "abalado")).toBe(true);
		expect(api.isActive(actor, "apavorado")).toBe(false);
	});

	it("active() lista só ids conhecidos pelo sistema", () => {
		const actor = makeActor(["abalado", "efeito-de-outro-modulo"]);
		expect(api.active(actor)).toEqual(["abalado"]);
	});

	it("aceita Token/TokenDocument além de Actor", () => {
		const actor = makeActor(["caido"]);
		expect(api.isActive({ actor }, "caido")).toBe(true);
		expect(api.active({ actor })).toEqual(["caido"]);
	});

	it("alvo inválido devolve valor vazio em vez de estourar", () => {
		expect(api.isActive(null, "abalado")).toBe(false);
		expect(api.active(undefined)).toEqual([]);
	});
});

describe("conditions API — apply/remove", () => {
	const api = buildConditionsApi();

	it("apply coloca a condição", async () => {
		const actor = makeActor();
		await api.apply(actor, "abalado");
		expect(api.isActive(actor, "abalado")).toBe(true);
	});

	it("apply escalona quando a condição já está ativa", async () => {
		const actor = makeActor(["abalado"]);
		const r = await api.apply(actor, "abalado");
		expect(api.isActive(actor, "apavorado")).toBe(true);
		expect(api.isActive(actor, "abalado")).toBe(false);
		expect(r.id).toBe("apavorado");
		expect(r.escalatedFrom).toBe("abalado");
	});

	it("apply sem escalonamento reporta o id pedido e escalatedFrom null", async () => {
		const actor = makeActor();
		const r = await api.apply(actor, "abalado");
		expect(r.id).toBe("abalado");
		expect(r.escalatedFrom).toBeNull();
	});

	it("remove tira a condição", async () => {
		const actor = makeActor(["abalado"]);
		await api.remove(actor, "abalado");
		expect(api.isActive(actor, "abalado")).toBe(false);
	});

	it("condição desconhecida devolve null sem tocar no ator", async () => {
		const actor = makeActor();
		expect(await api.apply(actor, "nao-existe")).toBeNull();
		expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
	});

	it("ator ausente devolve null sem estourar", async () => {
		expect(await api.apply(null, "abalado")).toBeNull();
		expect(await api.remove(null, "abalado")).toBeNull();
	});
});
