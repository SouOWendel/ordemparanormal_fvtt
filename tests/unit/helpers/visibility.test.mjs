import { describe, it, expect } from "vitest";
import {
	damageRecipients,
	isAttackParticipant,
	shouldShowCombatantHP,
	shouldShowDefenseValue,
} from "../../../module/helpers/visibility.mjs";

// ---------------------------------------------------------------------------
// damageRecipients (bug #5)
// ---------------------------------------------------------------------------

const gm = { id: "gm1", isGM: true };
const playerA = { id: "pA", isGM: false };
const playerB = { id: "pB", isGM: false };
const users = [gm, playerA, playerB];

function fakeActor({ ownedBy = [] } = {}) {
	const owners = new Set(ownedBy);
	return {
		testUserPermission(user, perm) {
			return perm === "OWNER" && owners.has(user.id);
		},
	};
}

describe("damageRecipients", () => {
	it("threat (sem dono player) → apenas MJ recebe", () => {
		const threat = fakeActor({ ownedBy: [] });
		expect(damageRecipients(threat, users)).toEqual(["gm1"]);
	});

	it("agente com dono A → MJ + A recebem; B não", () => {
		const agent = fakeActor({ ownedBy: ["pA"] });
		const ids = damageRecipients(agent, users);
		expect(ids).toContain("gm1");
		expect(ids).toContain("pA");
		expect(ids).not.toContain("pB");
		expect(ids).toHaveLength(2);
	});

	it("agente com múltiplos donos → MJ + todos os donos", () => {
		const agent = fakeActor({ ownedBy: ["pA", "pB"] });
		const ids = damageRecipients(agent, users);
		expect(new Set(ids)).toEqual(new Set(["gm1", "pA", "pB"]));
	});

	it("alvo null → apenas MJ", () => {
		expect(damageRecipients(null, users)).toEqual(["gm1"]);
	});

	it("users vazia → array vazio", () => {
		const agent = fakeActor({ ownedBy: ["pA"] });
		expect(damageRecipients(agent, [])).toEqual([]);
	});

	it("users null → array vazio (sem crash)", () => {
		expect(damageRecipients(fakeActor(), null)).toEqual([]);
	});

	it("alvo sem testUserPermission (e.g. token órfão) → apenas MJ", () => {
		expect(damageRecipients({}, users)).toEqual(["gm1"]);
	});

	it("dedup: GM que também é owner não duplica", () => {
		const gmOwner = { id: "gm1", isGM: true };
		const target = fakeActor({ ownedBy: ["gm1"] });
		expect(damageRecipients(target, [gmOwner])).toEqual(["gm1"]);
	});
});

// ---------------------------------------------------------------------------
// shouldShowCombatantHP (bug #4)
// ---------------------------------------------------------------------------

describe("shouldShowCombatantHP", () => {
	it("MJ vê HP de threat", () => {
		expect(shouldShowCombatantHP({ type: "threat" }, true, false)).toBe(true);
	});

	it("MJ vê HP de agent (mesmo sem ownership)", () => {
		expect(shouldShowCombatantHP({ type: "agent" }, true, false)).toBe(true);
	});

	it("Player NÃO vê HP de threat", () => {
		expect(shouldShowCombatantHP({ type: "threat" }, false, false)).toBe(false);
	});

	it("Player dono vê PV do próprio agente", () => {
		expect(shouldShowCombatantHP({ type: "agent" }, false, true)).toBe(true);
	});

	it("Player NÃO-dono NÃO vê PV de outro agente (regressão do review)", () => {
		expect(shouldShowCombatantHP({ type: "agent" }, false, false)).toBe(false);
	});

	it("Player não-dono NÃO vê threat mesmo que diga que é dono (defensivo)", () => {
		expect(shouldShowCombatantHP({ type: "threat" }, false, true)).toBe(false);
	});

	it("Actor null → false (defensivo)", () => {
		expect(shouldShowCombatantHP(null, true, true)).toBe(false);
	});

	it("Tipo desconhecido → true (não bloqueia por default)", () => {
		expect(shouldShowCombatantHP({ type: "vehicle" }, false, false)).toBe(true);
	});

	it("viewerOwnsActor omitido → trata como false", () => {
		expect(shouldShowCombatantHP({ type: "agent" }, false)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// shouldShowDefenseValue (bug #6)
// ---------------------------------------------------------------------------

describe("shouldShowDefenseValue", () => {
	it("MJ sempre vê a Defesa", () => {
		expect(shouldShowDefenseValue({ viewerIsGM: true, viewerOwnsTarget: false })).toBe(true);
		expect(shouldShowDefenseValue({ viewerIsGM: true, viewerOwnsTarget: true })).toBe(true);
	});

	it("Dono do alvo vê a Defesa", () => {
		expect(shouldShowDefenseValue({ viewerIsGM: false, viewerOwnsTarget: true })).toBe(true);
	});

	it("Outros jogadores NÃO veem a Defesa", () => {
		expect(shouldShowDefenseValue({ viewerIsGM: false, viewerOwnsTarget: false })).toBe(false);
	});

	it("Sempre retorna boolean (nunca undefined/null)", () => {
		const out = shouldShowDefenseValue({ viewerIsGM: false, viewerOwnsTarget: 0 });
		expect(typeof out).toBe("boolean");
		expect(out).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// isAttackParticipant (review round 2: hide hit/miss from third parties)
// ---------------------------------------------------------------------------

describe("isAttackParticipant", () => {
	it("GM sempre é participante (vê tudo)", () => {
		expect(
			isAttackParticipant({
				viewerIsGM: true,
				viewerId: "gm1",
				attackerUserId: "someoneElse",
				viewerOwnsTarget: false,
			})
		).toBe(true);
	});

	it("Atacante é participante (id bate com attackerUserId)", () => {
		expect(
			isAttackParticipant({
				viewerIsGM: false,
				viewerId: "pA",
				attackerUserId: "pA",
				viewerOwnsTarget: false,
			})
		).toBe(true);
	});

	it("Dono do alvo é participante (sem ser atacante)", () => {
		expect(
			isAttackParticipant({
				viewerIsGM: false,
				viewerId: "pB",
				attackerUserId: "pA",
				viewerOwnsTarget: true,
			})
		).toBe(true);
	});

	it("Terceiro (nem GM, nem atacante, nem dono) NÃO é participante", () => {
		expect(
			isAttackParticipant({
				viewerIsGM: false,
				viewerId: "pC",
				attackerUserId: "pA",
				viewerOwnsTarget: false,
			})
		).toBe(false);
	});

	it("attackerUserId nulo NÃO falsa-positiva (id viewer vazio também ignorado)", () => {
		expect(
			isAttackParticipant({
				viewerIsGM: false,
				viewerId: "pA",
				attackerUserId: null,
				viewerOwnsTarget: false,
			})
		).toBe(false);
		expect(
			isAttackParticipant({
				viewerIsGM: false,
				viewerId: null,
				attackerUserId: "pA",
				viewerOwnsTarget: false,
			})
		).toBe(false);
	});

	it("Sempre retorna boolean", () => {
		const out = isAttackParticipant({
			viewerIsGM: 0,
			viewerId: "x",
			attackerUserId: "y",
			viewerOwnsTarget: 0,
		});
		expect(typeof out).toBe("boolean");
		expect(out).toBe(false);
	});
});
