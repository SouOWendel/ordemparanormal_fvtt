/**
 * TDD tests for OrdemActor.applyDamage()
 *
 * These tests define the expected contract BEFORE the method is implemented.
 * All tests will fail until applyDamage is added to OrdemActor (module/documents/actor.mjs).
 *
 * Contract:
 *   actor.applyDamage(amount, { damageType?, ignoreRD?, nonLethal? })
 *   → { finalDamage, blocked, newPV, conditions }
 *
 * Side effects:
 *   - Calls actor.update({ "system.PV.value": newPV }) with clamped value (min 0)
 *   - Appends condition strings to the returned conditions array (does NOT apply them yet —
 *     that requires the status-effects system from PRD.md)
 */
import { describe, it, expect, vi } from "vitest";
import { OrdemActor } from "../../../module/documents/actor.mjs";

function makeActor({ pvValue = 30, pvMax = 30, resistances = {} } = {}) {
	const actor = new OrdemActor({}, {});
	actor.isOwner = true;
	actor.system = {
		PV: { value: pvValue, max: pvMax, nonLethal: 0 },
		resistances: {
			cuttingDamage: { value: 0, vulnerable: false, immune: false },
			ballisticDamage: { value: 0, vulnerable: false, immune: false },
			fireDamage: { value: 0, vulnerable: false, immune: false },
			mentalDamage: { value: 0, vulnerable: false, immune: false },
			...resistances,
		},
	};
	actor.update = vi.fn(async (data) => {
		// Simulate the update applying to system
		if ("system.PV.value" in data) actor.system.PV.value = data["system.PV.value"];
		if ("system.PV.nonLethal" in data) actor.system.PV.nonLethal = data["system.PV.nonLethal"];
	});
	return actor;
}

// ─── dano básico sem RD ──────────────────────────────────────────────────────

describe("OrdemActor.applyDamage — dano básico sem RD", () => {
	it("reduz PV pelo valor exato quando não há RD para o tipo", async () => {
		const actor = makeActor({ pvValue: 30, pvMax: 30 });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.finalDamage).toBe(10);
		expect(result.blocked).toBe(0);
		expect(actor.system.PV.value).toBe(20);
	});

	it("chama actor.update com o novo valor de PV", async () => {
		const actor = makeActor({ pvValue: 30 });
		await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(actor.update).toHaveBeenCalledWith(expect.objectContaining({ "system.PV.value": 20 }));
	});

	it("retorna newPV com o valor atualizado", async () => {
		const actor = makeActor({ pvValue: 30 });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.newPV).toBe(20);
	});
});

// ─── dano com RD ─────────────────────────────────────────────────────────────

describe("OrdemActor.applyDamage — com RD do tipo correto", () => {
	it("subtrai RD do dano antes de aplicar", async () => {
		const actor = makeActor({
			pvValue: 30,
			resistances: { cuttingDamage: { value: 3, vulnerable: false, immune: false } },
		});
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.blocked).toBe(3);
		expect(result.finalDamage).toBe(7);
		expect(actor.system.PV.value).toBe(23);
	});

	it("dano não fica negativo quando RD >= amount (mínimo 0)", async () => {
		const actor = makeActor({
			pvValue: 30,
			resistances: { cuttingDamage: { value: 15, vulnerable: false, immune: false } },
		});
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.finalDamage).toBe(0);
		expect(actor.system.PV.value).toBe(30);
	});

	it("RD de tipo diferente não é aplicada", async () => {
		const actor = makeActor({
			pvValue: 30,
			resistances: {
				cuttingDamage: { value: 5, vulnerable: false, immune: false },
				fireDamage: { value: 0, vulnerable: false, immune: false },
			},
		});
		const result = await actor.applyDamage(10, { damageType: "fireDamage" });
		expect(result.blocked).toBe(0);
		expect(result.finalDamage).toBe(10);
	});
});

// ─── ignoreRD — Perda de Vida ────────────────────────────────────────────────

describe("OrdemActor.applyDamage — ignoreRD (Perda de Vida)", () => {
	it("ignora RD e aplica dano integral", async () => {
		const actor = makeActor({
			pvValue: 30,
			resistances: { cuttingDamage: { value: 10, vulnerable: false, immune: false } },
		});
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage", ignoreRD: true });
		expect(result.blocked).toBe(0);
		expect(result.finalDamage).toBe(10);
		expect(actor.system.PV.value).toBe(20);
	});
});

// ─── dano não-letal ──────────────────────────────────────────────────────────

describe("OrdemActor.applyDamage — nonLethal", () => {
	it("incrementa system.PV.nonLethal, não altera system.PV.value", async () => {
		const actor = makeActor({ pvValue: 30 });
		await actor.applyDamage(8, { damageType: "impactDamage", nonLethal: true });
		expect(actor.system.PV.nonLethal).toBe(8);
		expect(actor.system.PV.value).toBe(30);
	});

	it("chama actor.update com system.PV.nonLethal", async () => {
		const actor = makeActor({ pvValue: 30 });
		await actor.applyDamage(8, { damageType: "impactDamage", nonLethal: true });
		expect(actor.update).toHaveBeenCalledWith(expect.objectContaining({ "system.PV.nonLethal": 8 }));
	});
});

// ─── PV clamped em 0 ─────────────────────────────────────────────────────────

describe("OrdemActor.applyDamage — PV não fica negativo", () => {
	it("PV é clampado em 0 quando dano excede PV atual", async () => {
		const actor = makeActor({ pvValue: 5 });
		await actor.applyDamage(20, { damageType: "cuttingDamage" });
		expect(actor.system.PV.value).toBe(0);
	});

	it("retorna newPV = 0 quando dano excede PV atual", async () => {
		const actor = makeActor({ pvValue: 5 });
		const result = await actor.applyDamage(20, { damageType: "cuttingDamage" });
		expect(result.newPV).toBe(0);
	});
});

// ─── condição Morrendo ────────────────────────────────────────────────────────

describe("OrdemActor.applyDamage — condição Morrendo", () => {
	it("inclui 'morrendo' em conditions quando PV chega a 0", async () => {
		const actor = makeActor({ pvValue: 10 });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.conditions).toContain("morrendo");
	});

	it("inclui 'morrendo' quando dano excede PV atual", async () => {
		const actor = makeActor({ pvValue: 5 });
		const result = await actor.applyDamage(20, { damageType: "cuttingDamage" });
		expect(result.conditions).toContain("morrendo");
	});

	it("não inclui 'morrendo' quando PV ainda é positivo após dano", async () => {
		const actor = makeActor({ pvValue: 20 });
		const result = await actor.applyDamage(5, { damageType: "cuttingDamage" });
		expect(result.conditions).not.toContain("morrendo");
	});
});

// ─── condição Machucado ───────────────────────────────────────────────────────

describe("OrdemActor.applyDamage — condição Machucado", () => {
	it("inclui 'machucado' quando PV cai para exatamente metade do máximo", async () => {
		const actor = makeActor({ pvValue: 30, pvMax: 30 });
		const result = await actor.applyDamage(15, { damageType: "cuttingDamage" });
		expect(result.conditions).toContain("machucado");
	});

	it("inclui 'machucado' quando PV cai abaixo da metade do máximo", async () => {
		const actor = makeActor({ pvValue: 30, pvMax: 30 });
		const result = await actor.applyDamage(20, { damageType: "cuttingDamage" });
		expect(result.conditions).toContain("machucado");
	});

	it("não inclui 'machucado' quando PV ainda está acima de metade", async () => {
		const actor = makeActor({ pvValue: 30, pvMax: 30 });
		const result = await actor.applyDamage(5, { damageType: "cuttingDamage" });
		expect(result.conditions).not.toContain("machucado");
	});

	it("inclui tanto 'machucado' quanto 'morrendo' quando PV vai a 0", async () => {
		const actor = makeActor({ pvValue: 30, pvMax: 30 });
		const result = await actor.applyDamage(30, { damageType: "cuttingDamage" });
		expect(result.conditions).toContain("machucado");
		expect(result.conditions).toContain("morrendo");
	});
});

// ─── socket delegation (isOwner = false) ─────────────────────────────────────

describe("OrdemActor.applyDamage — socket delegation quando !isOwner", () => {
	it("emite socket ao invés de chamar update quando não é owner", async () => {
		const actor = makeActor();
		actor.isOwner = false;
		actor.uuid = "Actor.mock-uuid";
		const emitSpy = vi.spyOn(game.socket, "emit");

		await actor.applyDamage(10, { damageType: "cuttingDamage" });

		expect(emitSpy).toHaveBeenCalledWith(
			"system.ordemparanormal",
			expect.objectContaining({ type: "applyDamage", actorUuid: "Actor.mock-uuid", amount: 10 })
		);
		expect(actor.update).not.toHaveBeenCalled();
		emitSpy.mockRestore();
	});

	it("retorna finalDamage e blocked corretos mesmo via socket", async () => {
		const actor = makeActor({ resistances: { cuttingDamage: { value: 3 } } });
		actor.isOwner = false;
		actor.uuid = "Actor.mock-uuid";
		vi.spyOn(game.socket, "emit").mockImplementation(() => {});

		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.finalDamage).toBe(7);
		expect(result.blocked).toBe(3);
		expect(result.newPV).toBeNull();
		vi.restoreAllMocks();
	});

	it("PV.value permanece inalterado localmente (update é remoto)", async () => {
		const actor = makeActor({ pvValue: 30 });
		actor.isOwner = false;
		actor.uuid = "Actor.mock-uuid";
		vi.spyOn(game.socket, "emit").mockImplementation(() => {});

		await actor.applyDamage(15, { damageType: "cuttingDamage" });
		expect(actor.system.PV.value).toBe(30);
		vi.restoreAllMocks();
	});
});

// ─── ameaças (system.attributes.hp) ──────────────────────────────────────────

function makeThreatActor({ hpValue = 30, hpMax = 30, resistances = {} } = {}) {
	const actor = new OrdemActor({}, {});
	actor.type = "threat";
	actor.isOwner = true;
	actor.system = {
		attributes: { hp: { value: hpValue, max: hpMax } },
		resistances: {
			cuttingDamage: { value: 0 },
			ballisticDamage: { value: 0 },
			...resistances,
		},
	};
	actor.update = vi.fn(async (data) => {
		if ("system.attributes.hp.value" in data) actor.system.attributes.hp.value = data["system.attributes.hp.value"];
	});
	return actor;
}

describe("OrdemActor.applyDamage — ameaça (system.attributes.hp)", () => {
	it("reduz hp da ameaça pelo dano sem RD", async () => {
		const actor = makeThreatActor({ hpValue: 30 });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.finalDamage).toBe(10);
		expect(actor.system.attributes.hp.value).toBe(20);
	});

	it("usa system.attributes.hp.value no update (não system.PV.value)", async () => {
		const actor = makeThreatActor({ hpValue: 30 });
		await actor.applyDamage(5, { damageType: "cuttingDamage" });
		expect(actor.update).toHaveBeenCalledWith({ "system.attributes.hp.value": 25 });
	});

	it("hp não fica negativo (clamp em 0)", async () => {
		const actor = makeThreatActor({ hpValue: 5 });
		const result = await actor.applyDamage(100, { damageType: "cuttingDamage" });
		expect(result.newPV).toBe(0);
		expect(actor.system.attributes.hp.value).toBe(0);
	});

	it("não reporta 'morrendo' para ameaças (reconcileHealthConditions não se aplica a threats)", async () => {
		const actor = makeThreatActor({ hpValue: 10, hpMax: 10 });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.conditions).not.toContain("morrendo");
	});

	it("não reporta 'machucado' para ameaças (reconcileHealthConditions não se aplica a threats)", async () => {
		const actor = makeThreatActor({ hpValue: 20, hpMax: 20 });
		const result = await actor.applyDamage(11, { damageType: "cuttingDamage" });
		expect(result.conditions).not.toContain("machucado");
	});

	it("RD da ameaça é aplicada corretamente", async () => {
		const actor = makeThreatActor({ resistances: { cuttingDamage: { value: 3 } } });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage" });
		expect(result.finalDamage).toBe(7);
		expect(result.blocked).toBe(3);
	});

	it("ignoreRD=true ignora RD da ameaça", async () => {
		const actor = makeThreatActor({ resistances: { cuttingDamage: { value: 5 } } });
		const result = await actor.applyDamage(10, { damageType: "cuttingDamage", ignoreRD: true });
		expect(result.finalDamage).toBe(10);
		expect(result.blocked).toBe(0);
	});
});
