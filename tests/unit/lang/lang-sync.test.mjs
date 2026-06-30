import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Recursively flatten a Foundry lang JSON into dot-notation keys.
 * Foundry lang files mix flat keys ("op.skill.foo") with nested objects
 * ({ "op.skill": { foo: "..." } }), so we follow whatever structure exists.
 */
function flattenKeys(obj, prefix = "", out = new Set()) {
	if (obj == null || typeof obj !== "object") return out;
	for (const [k, v] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === "object" && !Array.isArray(v)) {
			flattenKeys(v, path, out);
		} else {
			out.add(path);
		}
	}
	return out;
}

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const ptBR = JSON.parse(readFileSync(resolve(REPO_ROOT, "lang/pt-BR.json"), "utf8"));
const en = JSON.parse(readFileSync(resolve(REPO_ROOT, "lang/en.json"), "utf8"));

const ptBRKeys = flattenKeys(ptBR);
const enKeys = flattenKeys(en);

describe("lang files — pt-BR ↔ en", () => {
	it("pt-BR e en têm a mesma quantidade de chaves", () => {
		expect(ptBRKeys.size).toBe(enKeys.size);
	});

	it("toda chave de pt-BR existe em en (regression: adicionar só em um idioma)", () => {
		const missingInEn = [...ptBRKeys].filter((k) => !enKeys.has(k));
		expect(missingInEn, `Chaves em pt-BR mas faltando em en:\n${missingInEn.join("\n")}`).toEqual([]);
	});

	it("toda chave de en existe em pt-BR", () => {
		const missingInPt = [...enKeys].filter((k) => !ptBRKeys.has(k));
		expect(missingInPt, `Chaves em en mas faltando em pt-BR:\n${missingInPt.join("\n")}`).toEqual([]);
	});

	it("nenhum valor de chave é vazio (regressão: chaves traduzidas a meio caminho)", () => {
		function findEmpty(obj, prefix = "", out = []) {
			if (obj == null || typeof obj !== "object") return out;
			for (const [k, v] of Object.entries(obj)) {
				const path = prefix ? `${prefix}.${k}` : k;
				if (v && typeof v === "object" && !Array.isArray(v)) findEmpty(v, path, out);
				else if (v === "" || v == null) out.push(path);
			}
			return out;
		}
		const emptyPt = findEmpty(ptBR);
		const emptyEn = findEmpty(en);
		expect(emptyPt, `pt-BR keys with empty value:\n${emptyPt.join("\n")}`).toEqual([]);
		expect(emptyEn, `en keys with empty value:\n${emptyEn.join("\n")}`).toEqual([]);
	});
});
