import { describe, it, expect } from "vitest";
import {
	isMeleeAttack,
	isTrainedIn,
	getSkillBonus,
	getDodgeReactionBonus,
	hasReactionAvailable,
	getReactionEligibility,
	recomputeHit,
	shouldShowReactionButton,
} from "../../../module/helpers/reaction-helpers.mjs";

function makeAgent({ skills = {}, attributes = {}, type = "agent" } = {}) {
	const skill = (degree = 0, mod = 0, value = 0) => ({ degree: { value: degree }, mod, value });
	return {
		type,
		system: {
			attributes: {
				dex: { value: attributes.dex ?? 0 },
				str: { value: attributes.str ?? 0 },
				vit: { value: attributes.vit ?? 0 },
			},
			skills: {
				reflexes: skills.reflexes ?? skill(),
				resilience: skills.resilience ?? skill(),
				fighting: skills.fighting ?? skill(),
			},
		},
	};
}

function makeMeleeItem() {
	return { system: { types: { rangeType: { name: "melee" } }, formulas: { attack: { skill: "fighting" } } } };
}

function makeRangedItem() {
	return { system: { types: { rangeType: { name: "ranged" } }, formulas: { attack: { skill: "aim" } } } };
}

describe("isMeleeAttack", () => {
	it("true para rangeType.name = melee", () => {
		expect(isMeleeAttack(makeMeleeItem())).toBe(true);
	});

	it("false para rangeType.name = ranged", () => {
		expect(isMeleeAttack(makeRangedItem())).toBe(false);
	});

	it("fallback: rangeType ausente + skill fighting → melee", () => {
		const item = { system: { types: { rangeType: { name: "" } }, formulas: { attack: { skill: "fighting" } } } };
		expect(isMeleeAttack(item)).toBe(true);
	});

	it("fallback: rangeType ausente + skill aim → não melee", () => {
		const item = { system: { types: { rangeType: { name: "" } }, formulas: { attack: { skill: "aim" } } } };
		expect(isMeleeAttack(item)).toBe(false);
	});

	it("item null → false sem throw", () => {
		expect(isMeleeAttack(null)).toBe(false);
		expect(isMeleeAttack(undefined)).toBe(false);
	});
});

describe("isTrainedIn", () => {
	it("untrained (degree 0) → false", () => {
		const actor = makeAgent({ skills: { reflexes: { degree: { value: 0 } } } });
		expect(isTrainedIn(actor, "reflexes")).toBe(false);
	});

	it("trained (degree 5) → true", () => {
		const actor = makeAgent({ skills: { reflexes: { degree: { value: 5 } } } });
		expect(isTrainedIn(actor, "reflexes")).toBe(true);
	});

	it("veteran (degree 10) → true", () => {
		const actor = makeAgent({ skills: { fighting: { degree: { value: 10 } } } });
		expect(isTrainedIn(actor, "fighting")).toBe(true);
	});

	it("expert (degree 15) → true", () => {
		const actor = makeAgent({ skills: { resilience: { degree: { value: 15 } } } });
		expect(isTrainedIn(actor, "resilience")).toBe(true);
	});

	it("skill ausente → false", () => {
		const actor = { system: { skills: {} } };
		expect(isTrainedIn(actor, "reflexes")).toBe(false);
	});

	it("actor null → false", () => {
		expect(isTrainedIn(null, "reflexes")).toBe(false);
	});
});

describe("getSkillBonus", () => {
	it("reflexes: dex + degree + mod + value", () => {
		const actor = makeAgent({
			attributes: { dex: 4 },
			skills: { reflexes: { degree: { value: 5 }, mod: 2, value: 1 } },
		});
		expect(getSkillBonus(actor, "reflexes")).toBe(12);
	});

	it("resilience: vit + degree + mod + value", () => {
		const actor = makeAgent({
			attributes: { vit: 3 },
			skills: { resilience: { degree: { value: 10 }, mod: 0, value: 0 } },
		});
		expect(getSkillBonus(actor, "resilience")).toBe(13);
	});

	it("fighting: str + degree + mod + value", () => {
		const actor = makeAgent({
			attributes: { str: 5 },
			skills: { fighting: { degree: { value: 5 }, mod: 1 } },
		});
		expect(getSkillBonus(actor, "fighting")).toBe(11);
	});

	it("skill desconhecida → 0", () => {
		expect(getSkillBonus(makeAgent(), "nonexistent")).toBe(0);
	});

	it("actor sem system → 0 sem throw", () => {
		expect(getSkillBonus(null, "reflexes")).toBe(0);
		expect(getSkillBonus({}, "reflexes")).toBe(0);
	});
});

describe("getDodgeReactionBonus", () => {
	it("não inclui o atributo (AGI já está em defense.value)", () => {
		const actor = makeAgent({
			attributes: { dex: 4 },
			skills: { reflexes: { degree: { value: 5 }, mod: 2, value: 1 } },
		});
		expect(getDodgeReactionBonus(actor)).toBe(8);
	});

	it("retorna 0 quando reflexes não existe", () => {
		expect(getDodgeReactionBonus({ system: { skills: {} } })).toBe(0);
		expect(getDodgeReactionBonus(null)).toBe(0);
	});
});

describe("hasReactionAvailable", () => {
	it("currentRound 0 (fora de combate) → sempre true", () => {
		expect(hasReactionAvailable(5, 0)).toBe(true);
		expect(hasReactionAvailable(null, 0)).toBe(true);
	});

	it("flag igual à rodada atual → false", () => {
		expect(hasReactionAvailable(3, 3)).toBe(false);
	});

	it("flag de rodada anterior → true", () => {
		expect(hasReactionAvailable(2, 3)).toBe(true);
	});

	it("nunca usou → true", () => {
		expect(hasReactionAvailable(null, 3)).toBe(true);
		expect(hasReactionAvailable(undefined, 3)).toBe(true);
	});
});

describe("getReactionEligibility", () => {
	const meleeItem = makeMeleeItem();
	const rangedItem = makeRangedItem();

	it("threat como defensor: nenhuma reação", () => {
		const threat = makeAgent({ type: "threat" });
		const result = getReactionEligibility(threat, meleeItem, 1, null);
		expect(result.dodge.eligible).toBe(false);
		expect(result.dodge.reason).toBe("notAgent");
		expect(result.block.eligible).toBe(false);
		expect(result.counterAttack.eligible).toBe(false);
	});

	it("Agente treinado em tudo, ataque melee, rodada disponível: 3 reações elegíveis", () => {
		const actor = makeAgent({
			attributes: { dex: 4, str: 3, vit: 2 },
			skills: {
				reflexes: { degree: { value: 5 }, mod: 0, value: 0 },
				resilience: { degree: { value: 5 }, mod: 0, value: 0 },
				fighting: { degree: { value: 5 }, mod: 0, value: 0 },
			},
		});
		const result = getReactionEligibility(actor, meleeItem, 1, null);
		expect(result.dodge.eligible).toBe(true);
		// Dodge bonus excludes AGI (already in defense.value); only degree+mod+value.
		expect(result.dodge.bonus).toBe(5);
		expect(result.block.eligible).toBe(true);
		// Block bonus is the full Fortitude skill bonus (vit + degree + mod + value).
		expect(result.block.bonus).toBe(7);
		expect(result.counterAttack.eligible).toBe(true);
	});

	it("Ataque ranged: bloqueio e contra-ataque indisponíveis (notMelee), esquiva ok", () => {
		const actor = makeAgent({
			skills: {
				reflexes: { degree: { value: 5 } },
				resilience: { degree: { value: 5 } },
				fighting: { degree: { value: 5 } },
			},
		});
		const result = getReactionEligibility(actor, rangedItem, 1, null);
		expect(result.dodge.eligible).toBe(true);
		expect(result.block.eligible).toBe(false);
		expect(result.block.reason).toBe("notMelee");
		expect(result.counterAttack.eligible).toBe(false);
		expect(result.counterAttack.reason).toBe("notMelee");
	});

	it("Reação já usada nesta rodada: tudo alreadyUsed", () => {
		const actor = makeAgent({
			skills: {
				reflexes: { degree: { value: 5 } },
				resilience: { degree: { value: 5 } },
				fighting: { degree: { value: 5 } },
			},
		});
		const result = getReactionEligibility(actor, meleeItem, 3, 3);
		expect(result.dodge.eligible).toBe(false);
		expect(result.dodge.reason).toBe("alreadyUsed");
		expect(result.block.eligible).toBe(false);
		expect(result.block.reason).toBe("alreadyUsed");
		expect(result.counterAttack.eligible).toBe(false);
		expect(result.counterAttack.reason).toBe("alreadyUsed");
	});

	it("Não treinado em Reflexos: esquiva indisponível com notTrained", () => {
		const actor = makeAgent({
			skills: { reflexes: { degree: { value: 0 } }, fighting: { degree: { value: 5 } } },
		});
		const result = getReactionEligibility(actor, meleeItem, 1, null);
		expect(result.dodge.eligible).toBe(false);
		expect(result.dodge.reason).toBe("notTrained");
		expect(result.counterAttack.eligible).toBe(true);
	});

	it("Sem combate (currentRound 0): nunca trava por reação usada", () => {
		const actor = makeAgent({ skills: { reflexes: { degree: { value: 5 } } } });
		const result = getReactionEligibility(actor, meleeItem, 0, 99);
		expect(result.dodge.eligible).toBe(true);
	});
});

describe("recomputeHit", () => {
	it("rollTotal igual à defesa base → hit", () => {
		const r = recomputeHit(14, 14, 0);
		expect(r.hit).toBe(true);
		expect(r.targetDefense).toBe(14);
	});

	it("dodge bonus pode transformar hit em miss", () => {
		const r = recomputeHit(14, 12, 5);
		expect(r.targetDefense).toBe(17);
		expect(r.hit).toBe(false);
	});

	it("dodge bonus 0 mantém comportamento padrão", () => {
		const r = recomputeHit(20, 12);
		expect(r.targetDefense).toBe(12);
		expect(r.hit).toBe(true);
	});

	it("crit que vira miss por esquiva: hit recalculado vira false", () => {
		const r = recomputeHit(18, 14, 8);
		expect(r.targetDefense).toBe(22);
		expect(r.hit).toBe(false);
	});
});

describe("shouldShowReactionButton", () => {
	const eligibility = {
		dodge: { eligible: true },
		block: { eligible: false, reason: "notMelee" },
		counterAttack: { eligible: true },
	};

	it("oculta tudo quando reaction já aplicada", () => {
		expect(
			shouldShowReactionButton({
				type: "dodge",
				eligibility,
				isOwnerOfDefender: true,
				isGM: false,
				alreadyApplied: true,
			})
		).toBe(false);
	});

	it("oculta para usuários que não são owner nem GM", () => {
		expect(shouldShowReactionButton({ type: "dodge", eligibility, isOwnerOfDefender: false, isGM: false })).toBe(false);
	});

	it("mostra para GM mesmo sem ownership", () => {
		expect(shouldShowReactionButton({ type: "dodge", eligibility, isOwnerOfDefender: false, isGM: true })).toBe(true);
	});

	it("mostra para owner do defensor", () => {
		expect(shouldShowReactionButton({ type: "counterAttack", eligibility, isOwnerOfDefender: true, isGM: false })).toBe(
			true
		);
	});

	it("skip sempre visível para owner/GM", () => {
		expect(shouldShowReactionButton({ type: "skip", eligibility, isOwnerOfDefender: true, isGM: false })).toBe(true);
	});

	it("retorna falsy quando eligibility[type] não existe", () => {
		expect(shouldShowReactionButton({ type: "dodge", eligibility: {}, isOwnerOfDefender: true, isGM: false })).toBe(
			false
		);
	});
});
