/**
 * Chat commands handler (/dt, /oposto)
 *
 * SYNC LISTENER CONTRACT
 * ---------------------
 * Foundry's `chatMessage` hook is dispatched via `Hooks.call(...)` —
 * synchronous, short-circuits only on a literal `=== false` return. An async
 * handler returns a Promise (truthy) so the raw "/dt …" text would still be
 * posted as a regular IC message. The handler MUST be synchronous; the actual
 * work is delegated to async helpers and fired without await.
 *
 * Other cancelable hooks in this codebase that follow the same contract:
 *   - `preCreateActor`             — module/hooks.mjs
 *   - `hotbarDrop`                 — module/ordemparanormal.mjs
 *   - `op.preRoll{Name}V2`         — module/dice/basic-roll.mjs
 *   - `op.post{Name}RollConfiguration` — module/dice/basic-roll.mjs
 *   - `dropItemSheetData`          — module/sheets/item-sheet.mjs
 *   - `dropActorSheetData`         — module/sheets/actor-sheet.mjs
 *
 * Hooks dispatched via `Hooks.callAll` (e.g. `combatTurn`, `renderSettings`,
 * `targetToken`) ignore the return value, so async listeners are safe there.
 */

/**
 * Skill lookup map: normalized identifier (key OR localized label, lowercased)
 * → skill key. Populated once on `ready` from all language files declared by
 * the system, so /dt and /oposto accept either the canonical key
 * (`investigation`), the active-locale label (`Investigation` or `Investigação`),
 * or labels from any other supported locale.
 * @type {Map<string, string> | null}
 */
let _skillLookupCache = null;

export default function () {
	Hooks.once("ready", () => {
		_buildSkillLookup()
			.then((map) => {
				_skillLookupCache = map;
			})
			.catch((err) => {
				console.error("ordemparanormal | failed to build skill lookup cache", err);
				_skillLookupCache = _buildLocalSkillLookup();
			});
	});

	Hooks.on("chatMessage", (chatLog, content, messageData) => {
		const dtMatch = content.match(/^\/dt\s+(\d+)\s+(.+)$/);
		if (dtMatch) {
			_handleDtCommand(dtMatch[1], dtMatch[2]).catch((err) => {
				console.error("ordemparanormal | /dt command failed", err);
				ui.notifications.error(game.i18n.localize("op.dtCommandFailed"));
			});
			return false;
		}

		const oppostoMatch = content.match(/^\/oposto\s+(.+)$/);
		if (oppostoMatch) {
			_handleOpostoCommand(oppostoMatch[1]).catch((err) => {
				console.error("ordemparanormal | /oposto command failed", err);
				ui.notifications.error(game.i18n.localize("op.opostoCommandFailed"));
			});
			return false;
		}
	});
}

/**
 * Handle the `/dt <value> <skill>` command.
 * @param {string} dtRaw      The numeric DT value (still a string from regex).
 * @param {string} skillInput The skill identifier (key or localized label).
 */
async function _handleDtCommand(dtRaw, skillInput) {
	const skillKey = _resolveSkillKey(skillInput);
	if (!skillKey) {
		ui.notifications.warn(game.i18n.format("op.dtInvalidSkill", { skill: skillInput }));
		return;
	}

	const dt = parseInt(dtRaw, 10);
	const content = await foundry.applications.handlebars.renderTemplate(
		"systems/ordemparanormal/templates/chat/dt-card.hbs",
		{
			dt,
			skillKey,
			skillLabel: game.i18n.localize(CONFIG.op.skills[skillKey]),
		}
	);

	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker(),
		content,
		flags: { ordemparanormal: { dtCommand: true, dt, skillKey } },
	});
}

/**
 * Handle the `/oposto <skill>` command — broadcast a request and (for the GM)
 * arm a 30 s timeout to compile collected results into a ranked card.
 * @param {string} skillInput The skill identifier (key or localized label).
 */
async function _handleOpostoCommand(skillInput) {
	const skillKey = _resolveSkillKey(skillInput);
	if (!skillKey) {
		ui.notifications.warn(game.i18n.format("op.dtInvalidSkill", { skill: skillInput }));
		return;
	}

	const content = await foundry.applications.handlebars.renderTemplate(
		"systems/ordemparanormal/templates/chat/oposto-request.hbs",
		{
			skillKey,
			skillLabel: game.i18n.localize(CONFIG.op.skills[skillKey]),
		}
	);

	const msg = await ChatMessage.create({
		speaker: ChatMessage.getSpeaker(),
		content,
		flags: { ordemparanormal: { oppostoCommand: true, skillKey, results: [] } },
	});

	if (game.user.isGM) {
		setTimeout(async () => {
			const message = game.messages.get(msg.id);
			if (!message) return;
			if (message.getFlag("ordemparanormal", "resolved")) return;
			const results = message.getFlag("ordemparanormal", "results") ?? [];
			if (!results.length) return;
			await message.setFlag("ordemparanormal", "resolved", true);
			await _createOpostoResults(skillKey, results);
		}, 30000);
	}
}

/**
 * Resolve a skill key from a user-supplied identifier, accepting:
 *   - the canonical key (e.g. `investigation`)
 *   - a label from any locale supported by the system (e.g. `Investigation`,
 *     `Investigação`)
 * Comparison is case-insensitive, leading/trailing whitespace ignored.
 * Falls back to a locale-only lookup if the cross-locale cache failed to
 * build (cache stays null until `ready` finishes).
 * @param {string} input
 * @returns {string|undefined}
 */
function _resolveSkillKey(input) {
	if (typeof input !== "string") return undefined;
	const normalized = input.trim().toLowerCase();
	const cache = _skillLookupCache ?? _buildLocalSkillLookup();
	return cache.get(normalized);
}

/**
 * Build the normalized lookup map using only the active locale + canonical
 * keys. Used as the fallback when fetching every system language file fails
 * (e.g. early calls before `ready` finishes, file 404s).
 * @returns {Map<string, string>}
 */
function _buildLocalSkillLookup() {
	const map = new Map();
	for (const [key, locKey] of Object.entries(CONFIG.op?.skills ?? {})) {
		map.set(key.toLowerCase(), key);
		const label = game.i18n.localize(locKey);
		if (label && label !== locKey) map.set(label.toLowerCase(), key);
	}
	return map;
}

/**
 * Resolve the list of language files declared by the system. v13 exposes the
 * raw manifest under `_source` while leaving the live `languages` accessor
 * empty in some boot states; we fall through to fetching `system.json` so the
 * cross-locale lookup remains reliable.
 * @returns {Promise<Array<{lang: string, path: string}>>}
 */
async function _resolveSystemLanguages() {
	const fromSource = game.system?._source?.languages;
	if (Array.isArray(fromSource) && fromSource.length) return fromSource;
	const fromManifest = game.system?.manifest?.languages;
	if (Array.isArray(fromManifest) && fromManifest.length) return fromManifest;
	try {
		const sysId = game.system?.id ?? "ordemparanormal";
		const resp = await fetch(`/systems/${sysId}/system.json`);
		if (resp.ok) {
			const json = await resp.json();
			if (Array.isArray(json.languages)) return json.languages;
		}
	} catch (err) {
		console.warn("ordemparanormal | could not read system.json languages list", err);
	}
	return [];
}

/**
 * Build the cross-locale lookup map by fetching every language file declared
 * in `system.json`. Foundry lang files store keys in nested objects (e.g.
 * `{ "op.skill": { "stealth": "Stealth" } }`), so labels are resolved with a
 * dot-notation walk rather than a flat lookup.
 * @returns {Promise<Map<string, string>>}
 */
async function _buildSkillLookup() {
	const map = _buildLocalSkillLookup();
	const langs = await _resolveSystemLanguages();
	const sysId = game.system?.id ?? "ordemparanormal";

	await Promise.all(
		langs.map(async (lang) => {
			if (!lang?.path) return;
			// system.json paths are relative to the system root — prefix with the
			// system folder so the fetch resolves regardless of route prefix.
			const fullPath = lang.path.startsWith("systems/") ? `/${lang.path}` : `/systems/${sysId}/${lang.path}`;
			try {
				const resp = await fetch(fullPath);
				if (!resp.ok) return;
				const data = await resp.json();
				for (const [key, locKey] of Object.entries(CONFIG.op?.skills ?? {})) {
					const label = _getDeep(data, locKey);
					if (typeof label === "string" && label.length) map.set(label.toLowerCase(), key);
				}
			} catch (err) {
				console.warn(`ordemparanormal | could not load lang file ${fullPath}`, err);
			}
		})
	);

	return map;
}

/**
 * Read a value from a Foundry lang file using a dot-notation path.
 *
 * Foundry lang files mix flat dotted keys (`"op.skill": { stealth: "..." }`)
 * with deeply nested objects, so `data["op"]["skill"]["stealth"]` would fail
 * even though `data["op.skill"]["stealth"]` resolves. We try every possible
 * split point of the path against the literal keys until one resolves.
 */
function _getDeep(obj, path) {
	if (!obj || typeof path !== "string") return undefined;
	if (path in obj) return obj[path];

	const parts = path.split(".");
	// Greedy → narrow: try the longest prefix as a flat key, then descend.
	for (let i = parts.length - 1; i > 0; i--) {
		const head = parts.slice(0, i).join(".");
		if (!(head in obj)) continue;
		let val = obj[head];
		for (const p of parts.slice(i)) {
			if (val && typeof val === "object") val = val[p];
			else {
				val = undefined;
				break;
			}
		}
		if (val !== undefined) return val;
	}
	return undefined;
}

/**
 * Helper para criar card de resultados do teste oposto.
 * @param {string} skillKey
 * @param {Array<{actorName: string, total: number}>} results
 */
async function _createOpostoResults(skillKey, results) {
	results.sort((a, b) => b.total - a.total);
	const content = await foundry.applications.handlebars.renderTemplate(
		"systems/ordemparanormal/templates/chat/oposto-results.hbs",
		{
			skillLabel: game.i18n.localize(CONFIG.op.skills[skillKey]),
			results: results.map((r, i) => ({
				...r,
				rank: i + 1,
				winnerClass: i === 0 ? "winner" : "",
				winnerIcon: i === 0 ? " 🥇" : "",
			})),
		}
	);
	await ChatMessage.create({ speaker: ChatMessage.getSpeaker(), content });
}

// Test-only export: lets unit tests reset the cache between runs without
// hitting the production fetch path.
export const _testing = {
	resetCache() {
		_skillLookupCache = null;
	},
	setCache(map) {
		_skillLookupCache = map;
	},
};
