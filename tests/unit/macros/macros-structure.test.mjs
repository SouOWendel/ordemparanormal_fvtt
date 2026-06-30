import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const MACROS_DIR = resolve(REPO_ROOT, "packs/_source/macros");

const macroFiles = readdirSync(MACROS_DIR).filter((f) => f.endsWith(".json"));
const macros = macroFiles.map((file) => ({
	file,
	data: JSON.parse(readFileSync(resolve(MACROS_DIR, file), "utf8")),
}));

const ID_RE = /^[a-zA-Z0-9]{16}$/;

describe("macros — structural validation (Foundry v13 schema)", () => {
	it("compendium has the expected 4 macros", () => {
		expect(macros.map((m) => m.file).sort()).toEqual([
			"aplicar-dano-rapido.json",
			"descanso-curto.json",
			"rolar-iniciativa.json",
			"rolar-pericia.json",
		]);
	});

	it.each(macros)("$file: _id is exactly 16 alphanumeric chars (Foundry v13 requirement)", ({ data }) => {
		expect(data._id).toMatch(ID_RE);
	});

	it.each(macros)("$file: declares an author (Foundry v13 macro field is required)", ({ data }) => {
		expect(data.author).toBeTruthy();
		expect(data.author).toMatch(ID_RE);
	});

	it.each(macros)("$file: type is 'script'", ({ data }) => {
		expect(data.type).toBe("script");
	});

	it.each(macros)("$file: command is non-empty string", ({ data }) => {
		expect(typeof data.command).toBe("string");
		expect(data.command.length).toBeGreaterThan(0);
	});

	it.each(macros)("$file: command JS parses without syntax errors", ({ data }) => {
		// Wrap in async function so top-level await is valid (macros run inside one).
		expect(() => new Function("return (async () => {" + data.command + "})()")).not.toThrow();
	});

	it.each(macros)("$file: _key matches the canonical pattern '!macros!<_id>'", ({ data }) => {
		expect(data._key).toBe(`!macros!${data._id}`);
	});

	it("no two macros share the same _id (compendium uniqueness)", () => {
		const ids = macros.map((m) => m.data._id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(macros)("$file: doesn't use the deprecated v1 Dialog API", ({ data }) => {
		// Dialog.prompt / Dialog.confirm were the v1 (FormApplication-based) API.
		// In v13 they still work but log deprecation warnings; we want DialogV2.
		// Allow the global "Dialog" only if it's part of "DialogV2" / "ApplicationV2".
		const usesV1Dialog = /\bDialog\s*\.\s*(prompt|confirm|wait)\b/.test(data.command);
		expect(usesV1Dialog, "Use foundry.applications.api.DialogV2 instead").toBe(false);
	});

	it.each(macros)("$file: any localized key (op.X) referenced exists in lang/en.json", ({ data }) => {
		const en = JSON.parse(readFileSync(resolve(REPO_ROOT, "lang/en.json"), "utf8"));
		const flat = new Set();
		(function flatten(obj, prefix = "") {
			for (const [k, v] of Object.entries(obj ?? {})) {
				const path = prefix ? `${prefix}.${k}` : k;
				if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path);
				else flat.add(path);
			}
		})(en);

		// Match string-literal calls to game.i18n.localize("...") only.
		const referenced = [...data.command.matchAll(/game\.i18n\.localize\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
		const missing = referenced.filter((key) => !flat.has(key));
		expect(missing, `Localization keys used in macro but missing in lang files:\n${missing.join("\n")}`).toEqual([]);
	});
});
