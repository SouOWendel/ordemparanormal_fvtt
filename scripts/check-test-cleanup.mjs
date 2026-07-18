#!/usr/bin/env node
/**
 * Scan Quench test files for patterns that risk leaking state across runs.
 *
 * Heuristics (not exhaustive):
 *  1. `Actor.create(` or `Item.create(` or `Combat.create(` inside an `it()`
 *     scope WITHOUT local cleanup (no `.delete()` and no
 *     `withActor`/`withItem`/`withCombat`).
 *  2. `game.settings.set(` inside an `it()` WITHOUT `withSetting` or a
 *     try/finally that restores the original value.
 *  3. `game.user.targets` mutation without `withTargets` or an explicit
 *     restore pair.
 *  4. File missing `installBatchGuards` (despite mutating world state).
 *
 * Output: a list of warnings with file:line + suggested fix. Exit code != 0
 * when warnings exist if `--strict` is passed (use in CI to gatekeep).
 *
 * Honest limitations:
 *  - This is textual analysis, not AST. It catches the obvious patterns; it
 *    will not detect cleanup via complex closures or indirect helpers.
 *  - False positives are expected in carefully designed fixtures. Either
 *    refactor or just review manually.
 *
 * Usage: `node scripts/check-test-cleanup.mjs` or `npm run test:check-cleanup`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(__filename, "..", "..");
const SUITES_DIR = join(REPO_ROOT, "module", "tests", "suites");

// Files that are known to not create world fixtures (no guards needed).
const SKIP_FILES = new Set(["migrations.test.mjs", "sheets.test.mjs"]);

const warnings = [];
function warn(file, line, message, suggestion) {
	warnings.push({ file, line, message, suggestion });
}

/**
 * Locate the body of the `describe(...)` enclosing position `pos` in `text`.
 * Returns `null` if not nested inside any describe (rare).
 */
function enclosingDescribeBody(text, pos) {
	// Search backwards for `describe(` whose body braces still enclose `pos`.
	const re = /\bdescribe\s*\(\s*["'`][^"'`]+["'`]\s*,\s*(?:async\s*)?(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*\{/g;
	let last = null;
	let m;
	while ((m = re.exec(text)) !== null) {
		if (m.index > pos) break;
		// Compute body end via brace depth from the matched `{`
		const bodyOpen = m.index + m[0].length - 1; // points at the `{`
		let depth = 1;
		let i = bodyOpen + 1;
		while (i < text.length && depth > 0) {
			if (text[i] === "{") depth += 1;
			else if (text[i] === "}") depth -= 1;
			i += 1;
		}
		if (bodyOpen < pos && pos < i - 1) {
			last = text.slice(bodyOpen + 1, i - 1);
		}
	}
	return last;
}

const files = readdirSync(SUITES_DIR).filter((f) => f.endsWith(".test.mjs"));

for (const file of files) {
	if (SKIP_FILES.has(file)) continue;
	const path = join(SUITES_DIR, file);
	const text = readFileSync(path, "utf8");

	const hasGuards = /installBatchGuards\s*\(/.test(text);
	const createsWorld = /(Actor|Item|Combat|ChatMessage)\.create\s*\(/.test(text);

	if (createsWorld && !hasGuards) {
		warn(
			file,
			1,
			"creates world fixtures but does not call installBatchGuards",
			"Add `import { installBatchGuards } from '../helpers/fixtures.mjs';` and " +
				"`installBatchGuards(context, { prefix: '[<your-prefix>]' });` at the top of registerBatch."
		);
	}

	// --- itPattern: per-`it()`-scope checks
	// Find `it(...)` block starts and ends (heuristic by brace counting).
	const itRegex = /\bit\s*\(\s*["'`][^"'`]+["'`]\s*,\s*(?:async\s*)?(?:function\s*\(\s*\)|\(\s*\)\s*=>)/g;
	let m;
	while ((m = itRegex.exec(text)) !== null) {
		const itStart = m.index;
		const itStartLine = text.slice(0, itStart).split("\n").length;
		// Find body braces — match the {...} after the arrow/function decl
		const bodyOpen = text.indexOf("{", itStart);
		if (bodyOpen === -1) continue;
		let depth = 1;
		let i = bodyOpen + 1;
		while (i < text.length && depth > 0) {
			if (text[i] === "{") depth += 1;
			else if (text[i] === "}") depth -= 1;
			i += 1;
		}
		const itBody = text.slice(bodyOpen + 1, i - 1);

		// Inline create without with* / delete? Describe-level cleanup
		// (`after(...)` with `purgeMessages`/`purgeByPrefix`/`.delete()`) is
		// also accepted — find the enclosing describe and check its hooks.
		const createLocal = /(?:Actor|Item|Combat|ChatMessage)\.create\s*\(/.test(itBody);
		const hasWithHelper = /\bwith(?:Actor|Item|Combat|Fixture|Setting|Targets)\b/.test(itBody);
		const hasDelete = /\.delete\s*\(/.test(itBody);
		const describeBody = enclosingDescribeBody(text, itStart);
		const describeCleanup =
			describeBody &&
			(/\bpurge(?:Messages|ByPrefix)\b/.test(describeBody) ||
				/after\s*\(\s*async\s*\(\s*\)\s*=>\s*\{[\s\S]*?\.delete\s*\(/.test(describeBody));
		if (createLocal && !hasWithHelper && !hasDelete && !describeCleanup) {
			warn(
				file,
				itStartLine,
				"`it` creates a world doc inline without local or describe-level cleanup",
				"Use `withActor(...)`/`withItem(...)`/`withCombat(...)` instead of bare `Actor.create(...)`, " +
					"or add `after(() => purgeByPrefix('[<prefix>]'))` to the describe."
			);
		}

		// game.settings.set within it() without withSetting + restore?
		const settingSet = /game\.settings\.set\s*\(/.test(itBody);
		const usesWithSetting = /\bwithSetting\b/.test(itBody);
		const hasRestore =
			/game\.settings\.set\s*\(/g.test(itBody) && (itBody.match(/game\.settings\.set\s*\(/g) || []).length >= 2;
		if (settingSet && !usesWithSetting && !hasRestore) {
			warn(
				file,
				itStartLine,
				"`it` calls `game.settings.set` without `withSetting` or a restore",
				"Use `await withSetting(namespace, key, value, async () => { ... })`."
			);
		}

		// game.user.targets mutated without withTargets / restore?
		const targetsMutated =
			/game\.user\.targets\.(?:add|clear|delete)\s*\(/.test(itBody) || /game\.user\.targets\s*=\s*new\s+Set/.test(itBody);
		const usesWithTargets = /\bwithTargets\b/.test(itBody);
		// Looks like manual setTargets/restoreTargets pair (legacy pattern)
		const hasManualSetRestore = /\bsetTargets\b/.test(itBody) && /\brestoreTargets\b/.test(itBody);
		if (targetsMutated && !usesWithTargets && !hasManualSetRestore) {
			warn(
				file,
				itStartLine,
				"`it` mutates `game.user.targets` without `withTargets` or a manual restore",
				"Use `await withTargets([makeFakeToken(actor)], async () => { ... })`."
			);
		}
	}
}

// Output
if (!warnings.length) {
	console.log("OK check-test-cleanup: no suspicious patterns found in", files.length, "file(s)");
	process.exit(0);
}

console.log(`FAIL check-test-cleanup: ${warnings.length} warning(s)\n`);
const byFile = new Map();
for (const w of warnings) {
	if (!byFile.has(w.file)) byFile.set(w.file, []);
	byFile.get(w.file).push(w);
}
for (const [file, list] of byFile) {
	console.log(`  ${file}:`);
	for (const w of list) {
		console.log(`    L${w.line}: ${w.message}`);
		console.log(`      -> ${w.suggestion}`);
	}
	console.log("");
}
console.log(`Total: ${warnings.length} warning(s) in ${byFile.size} file(s).`);
console.log("See module/tests/README.md for the conventions.");

// Non-zero exit only when running in CI or explicitly with --strict.
const strict = process.argv.includes("--strict");
process.exit(strict ? 1 : 0);
