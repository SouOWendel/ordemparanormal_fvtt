import { describe, it, expect } from "vitest";
import { calculatePatent } from "../../../module/helpers/actor-calculations.mjs";

describe("calculatePatent", () => {
	it('returns "Sem Patente" for PP=-1', () => {
		expect(calculatePatent(-1).name).toBe("Sem Patente");
	});

	it('returns "Recruta" for PP=0 with itemLimit1=2 and no other limits', () => {
		const result = calculatePatent(0);
		expect(result.name).toBe("Recruta");
		expect(result.itemLimit1).toBe(2);
		expect(result.itemLimit2).toBeNull();
		expect(result.itemLimit3).toBeNull();
		expect(result.itemLimit4).toBeNull();
	});

	it('returns "Recruta" for PP=19', () => {
		expect(calculatePatent(19).name).toBe("Recruta");
	});

	it('returns "Operador" for PP=20 with itemLimit1=3 and itemLimit2=1', () => {
		const result = calculatePatent(20);
		expect(result.name).toBe("Operador");
		expect(result.itemLimit1).toBe(3);
		expect(result.itemLimit2).toBe(1);
		expect(result.itemLimit3).toBeNull();
		expect(result.itemLimit4).toBeNull();
	});

	it('returns "Agente Especial" for PP=50', () => {
		expect(calculatePatent(50).name).toBe("Agente Especial");
	});

	it('returns "Oficial de Operações" for PP=100', () => {
		expect(calculatePatent(100).name).toBe("Oficial de Operações");
	});

	it('returns "Agente de Elite" for PP=200 with all limits filled', () => {
		const result = calculatePatent(200);
		expect(result.name).toBe("Agente de Elite");
		expect(result.itemLimit1).toBe(3);
		expect(result.itemLimit2).toBe(3);
		expect(result.itemLimit3).toBe(3);
		expect(result.itemLimit4).toBe(2);
	});
});
