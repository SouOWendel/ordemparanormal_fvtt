import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OrdemCombat } from "../../../module/documents/combat.mjs";

function makeCombatant(initiative, dex = 0) {
	return {
		initiative,
		actor: { system: { attributes: { dex: { value: dex } } } },
	};
}

describe("OrdemCombat._sortCombatants — ordenação básica por iniciativa", () => {
	it("maior iniciativa vem antes", () => {
		const combat = new OrdemCombat({}, {});
		const a = makeCombatant(15, 2);
		const b = makeCombatant(10, 4);
		expect(combat._sortCombatants(a, b)).toBeLessThan(0);
	});

	it("menor iniciativa vem depois", () => {
		const combat = new OrdemCombat({}, {});
		const a = makeCombatant(5);
		const b = makeCombatant(20);
		expect(combat._sortCombatants(a, b)).toBeGreaterThan(0);
	});

	it("null initiative vai para o fim", () => {
		const combat = new OrdemCombat({}, {});
		const a = makeCombatant(null);
		const b = makeCombatant(10);
		expect(combat._sortCombatants(a, b)).toBeGreaterThan(0);
	});
});

describe("OrdemCombat._sortCombatants — desempate por Agilidade (tiebreaker=dex)", () => {
	beforeEach(() => {
		game.settings.get = vi.fn((_, key) => (key === "initiativeTiebreaker" ? "dex" : undefined));
	});
	afterEach(() => vi.restoreAllMocks());

	it("empate: maior dex vem antes", () => {
		const combat = new OrdemCombat({}, {});
		const a = makeCombatant(10, 2);
		const b = makeCombatant(10, 4);
		expect(combat._sortCombatants(a, b)).toBeGreaterThan(0); // b tem mais dex → b < a
	});

	it("empate: dex igual retorna 0 (estável)", () => {
		const combat = new OrdemCombat({}, {});
		const a = makeCombatant(10, 3);
		const b = makeCombatant(10, 3);
		expect(combat._sortCombatants(a, b)).toBe(0);
	});

	it("empate: actor null não lança exceção, usa dex=0", () => {
		const combat = new OrdemCombat({}, {});
		const a = { initiative: 10, actor: null };
		const b = makeCombatant(10, 3);
		expect(() => combat._sortCombatants(a, b)).not.toThrow();
	});
});

describe("OrdemCombat._sortCombatants — desempate desativado (tiebreaker=none)", () => {
	beforeEach(() => {
		game.settings.get = vi.fn((_, key) => (key === "initiativeTiebreaker" ? "none" : undefined));
	});
	afterEach(() => vi.restoreAllMocks());

	it("empate com tiebreaker=none retorna 0 independente de dex", () => {
		const combat = new OrdemCombat({}, {});
		const a = makeCombatant(10, 1);
		const b = makeCombatant(10, 5);
		expect(combat._sortCombatants(a, b)).toBe(0);
	});
});

describe("OrdemCombat.rollAll — desempate por re-roll (tiebreaker=reroll)", () => {
	beforeEach(() => {
		game.settings.get = vi.fn((_, key) => (key === "initiativeTiebreaker" ? "reroll" : undefined));
	});
	afterEach(() => vi.restoreAllMocks());

	it("re-roll ativado quando valores de iniciativa são iguais", async () => {
		const mockRoll = { total: 15, evaluate: vi.fn(async () => mockRoll) };
		const c1 = { ...makeCombatant(10, 2), id: "c1", getInitiativeRoll: vi.fn(() => mockRoll) };
		const c2 = { ...makeCombatant(10, 3), id: "c2", getInitiativeRoll: vi.fn(() => mockRoll) };
		const combat = new OrdemCombat({}, {});
		combat.combatants = [c1, c2];
		combat.updateEmbeddedDocuments = vi.fn(async () => []);

		await combat.rollAll();

		expect(c1.getInitiativeRoll).toHaveBeenCalled();
		expect(c2.getInitiativeRoll).toHaveBeenCalled();
		expect(combat.updateEmbeddedDocuments).toHaveBeenCalledWith(
			"Combatant",
			expect.arrayContaining([
				expect.objectContaining({ _id: "c1", initiative: expect.any(Number) }),
				expect.objectContaining({ _id: "c2", initiative: expect.any(Number) }),
			])
		);
	});

	it("sem re-roll quando valores de iniciativa são diferentes", async () => {
		const c1 = { ...makeCombatant(10, 2), id: "c1", getInitiativeRoll: vi.fn() };
		const c2 = { ...makeCombatant(15, 3), id: "c2", getInitiativeRoll: vi.fn() };
		const combat = new OrdemCombat({}, {});
		combat.combatants = [c1, c2];
		combat.updateEmbeddedDocuments = vi.fn(async () => []);

		await combat.rollAll();

		expect(c1.getInitiativeRoll).not.toHaveBeenCalled();
		expect(c2.getInitiativeRoll).not.toHaveBeenCalled();
		expect(combat.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("sem re-roll quando combatant não tem actor", async () => {
		const mockRoll = { total: 12, evaluate: vi.fn(async () => mockRoll) };
		const c1 = { initiative: 10, actor: null, id: "c1", getInitiativeRoll: vi.fn() };
		const c2 = { ...makeCombatant(10, 3), id: "c2", getInitiativeRoll: vi.fn(() => mockRoll) };
		const combat = new OrdemCombat({}, {});
		combat.combatants = [c1, c2];
		combat.updateEmbeddedDocuments = vi.fn(async () => []);

		await combat.rollAll();

		expect(c1.getInitiativeRoll).not.toHaveBeenCalled();
		expect(c2.getInitiativeRoll).toHaveBeenCalled();
		expect(combat.updateEmbeddedDocuments).toHaveBeenCalledWith("Combatant", [expect.objectContaining({ _id: "c2" })]);
	});
});
