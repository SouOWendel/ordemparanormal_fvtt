import { describe, it, expect } from "vitest";
import {
	damageRecipients,
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
		expect(shouldShowCombatantHP({ type: "threat" }, true)).toBe(true);
	});

	it("MJ vê HP de agent", () => {
		expect(shouldShowCombatantHP({ type: "agent" }, true)).toBe(true);
	});

	it("Player NÃO vê HP de threat", () => {
		expect(shouldShowCombatantHP({ type: "threat" }, false)).toBe(false);
	});

	it("Player vê HP de agent", () => {
		expect(shouldShowCombatantHP({ type: "agent" }, false)).toBe(true);
	});

	it("Actor null → false (defensivo)", () => {
		expect(shouldShowCombatantHP(null, true)).toBe(false);
	});

	it("Tipo desconhecido → true (não bloqueia por default)", () => {
		expect(shouldShowCombatantHP({ type: "vehicle" }, false)).toBe(true);
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
