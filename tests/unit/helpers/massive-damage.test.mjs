import { describe, it, expect } from "vitest";
import { isMassiveDamage, massiveDamageDT } from "../../../module/helpers/massive-damage.mjs";

describe("isMassiveDamage — trigger (book p. 87)", () => {
	it("dano exatamente na metade do PV total, sem zerar, dispara", () => {
		expect(isMassiveDamage(15, 30, 15)).toBe(true);
	});

	it("dano acima da metade dispara", () => {
		expect(isMassiveDamage(20, 30, 10)).toBe(true);
	});

	it("dano abaixo da metade não dispara", () => {
		expect(isMassiveDamage(14, 30, 16)).toBe(false);
	});

	it("dano que ZERA o PV não dispara (vira Morrendo normal, não Dano Massivo)", () => {
		expect(isMassiveDamage(30, 30, 0)).toBe(false);
	});

	it("maxPV 0/negativo nunca dispara", () => {
		expect(isMassiveDamage(999, 0, 0)).toBe(false);
	});
});

describe("massiveDamageDT — DT 15 +2 a cada 10 pontos de dano", () => {
	it("dano < 10 → DT base 15", () => {
		expect(massiveDamageDT(5)).toBe(15);
		expect(massiveDamageDT(9)).toBe(15);
	});

	it("dano 10-19 → DT 17 (arredonda pra baixo)", () => {
		expect(massiveDamageDT(10)).toBe(17);
		expect(massiveDamageDT(19)).toBe(17);
	});

	it("dano 25 → DT 19 (2 grupos de 10)", () => {
		expect(massiveDamageDT(25)).toBe(19);
	});

	it("dano 0 → DT 15", () => {
		expect(massiveDamageDT(0)).toBe(15);
	});
});
