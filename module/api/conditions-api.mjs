/**
 * Public condition API for third-party modules — `game.ordemparanormal.conditions`.
 *
 * This is the supported contract. Everything under `module/helpers/conditions.mjs`
 * is internal and may change without notice; importing it by path from a module
 * will break. Nothing here exposes the mutable condition table, and the objects
 * handed out are frozen.
 *
 * Applying through `apply()` (rather than `actor.toggleStatusEffect`) keeps the
 * system's own rules in play — today that means escalation, and whatever the
 * system automates later.
 *
 * @example
 * const API = game.ordemparanormal.conditions;
 * const { id, escalatedFrom } = await API.apply(actor, "abalado");
 * // applying a second time escalates: id === "apavorado", escalatedFrom === "abalado"
 *
 * @example <caption>React to conditions from any source, acting once</caption>
 * Hooks.on(API.hooks.applied, (actor, conditionId, effect, userId) => {
 *   if (game.userId !== userId) return; // the hook reaches every client
 *   console.log(`${actor.name} ficou ${conditionId}`);
 * });
 */

import { CONDITIONS, CONDITION_IDS, applyCondition, isConditionActive } from "../helpers/conditions.mjs";

/**
 * Bumped when the shape below changes in a way that could break a caller.
 * Additive changes do not bump it. Read it to feature-detect:
 * `if ((game.ordemparanormal?.conditions?.version ?? 0) >= 1) { ... }`
 * @type {number}
 */
export const CONDITIONS_API_VERSION = 1;

/**
 * Hooks the system fires as conditions change. Dot-namespaced, as dnd5e and pf2e
 * do, so system hooks are greppable and cannot collide with another package.
 *
 * All three deliver `userId` last — the id of the user whose action caused the
 * change. Every connected client receives the hook, so gate any write or any
 * outbound call with `if (game.userId !== userId) return;` or it runs once per
 * player at the table.
 * @enum {string}
 */
export const CONDITION_HOOKS = Object.freeze({
	applied: "ordemparanormal.conditionApplied",
	removed: "ordemparanormal.conditionRemoved",
	escalated: "ordemparanormal.conditionEscalated",
});

/**
 * @typedef {object} ConditionDescriptor
 * @property {string} id                  Condition id, e.g. "abalado".
 * @property {string} label               Localized name, ready to display.
 * @property {string} labelKey            The i18n key behind `label`.
 * @property {string} img                 Icon path.
 * @property {boolean} overlay            Whether it draws as a full token overlay.
 * @property {string|null} escalatesTo    Condition it becomes when re-applied, or null.
 * @property {number} defensePenalty      Flat Defense penalty, 0 when none. Informational:
 *                                        the system applies it at attack resolution, and
 *                                        equal penalties do not stack (book p. 312).
 */

/** @type {Map<string, Readonly<ConditionDescriptor>>|null} */
let _descriptors = null;
/** @type {ReadonlyArray<Readonly<ConditionDescriptor>>|null} */
let _list = null;

/**
 * Build the descriptor table once, on first use rather than at import time, so
 * `game.i18n` is loaded and `label` comes out localized. Memoised so descriptors
 * keep a stable identity — a caller may cache or compare them by reference.
 * @returns {Map<string, Readonly<ConditionDescriptor>>}
 */
function descriptors() {
	if (_descriptors) return _descriptors;
	_descriptors = new Map();
	for (const id of CONDITION_IDS) {
		const c = CONDITIONS[id];
		_descriptors.set(
			id,
			Object.freeze({
				id: c.id,
				label: globalThis.game?.i18n?.localize?.(c.label) ?? c.label,
				labelKey: c.label,
				img: c.img,
				overlay: Boolean(c.overlay),
				escalatesTo: c.escalatesTo ?? null,
				defensePenalty: c.defense ?? 0,
			})
		);
	}
	_list = Object.freeze([..._descriptors.values()]);
	return _descriptors;
}

/**
 * Resolve an Actor from an Actor, a Token, or a TokenDocument, so callers can
 * pass whatever they have on hand.
 * @param {Actor|Token|TokenDocument} target
 * @returns {Actor|null}
 */
function resolveActor(target) {
	if (!target) return null;
	// Token and TokenDocument carry the actor; an Actor has no `.actor` itself.
	if (target.actor) return target.actor;
	// Duck-typed rather than `instanceof Actor`: the check has to survive an actor
	// coming from another execution context, and it keeps the contract testable.
	if (typeof target.toggleStatusEffect === "function" || target.statuses) return target;
	return null;
}

/**
 * Which condition an effect actually carries, so `apply` can report the result
 * of an escalation rather than the id that was asked for.
 * @param {ActiveEffect} effect
 * @returns {string|null}
 */
function conditionIdOf(effect) {
	for (const statusId of effect?.statuses ?? []) if (CONDITIONS[statusId]) return statusId;
	return null;
}

/**
 * @typedef {object} ApplyResult
 * @property {string} id                  The condition that ended up on the actor —
 *                                        differs from the requested one on escalation.
 * @property {ActiveEffect|null} effect   The resulting effect.
 * @property {string|null} escalatedFrom  The requested condition when it escalated, else null.
 */

/**
 * Build the frozen public API object.
 * @returns {Readonly<object>}
 */
export function buildConditionsApi() {
	const api = {
		version: CONDITIONS_API_VERSION,
		hooks: CONDITION_HOOKS,

		/**
		 * Every condition the system knows, as frozen descriptors. The array and its
		 * descriptors keep a stable identity between calls.
		 * @returns {ReadonlyArray<Readonly<ConditionDescriptor>>}
		 */
		list() {
			descriptors();
			return _list;
		},

		/**
		 * One condition's descriptor.
		 * @param {string} conditionId
		 * @returns {Readonly<ConditionDescriptor>|null} null when unknown.
		 */
		get(conditionId) {
			return descriptors().get(conditionId) ?? null;
		},

		/**
		 * Whether the system defines this condition. Says nothing about any actor.
		 * @param {string} conditionId
		 * @returns {boolean}
		 */
		has(conditionId) {
			return Boolean(CONDITIONS[conditionId]);
		},

		/**
		 * Whether the condition is currently on the actor.
		 * @param {Actor|Token|TokenDocument} target
		 * @param {string} conditionId
		 * @returns {boolean}
		 */
		isActive(target, conditionId) {
			const actor = resolveActor(target);
			return actor ? isConditionActive(actor, conditionId) : false;
		},

		/**
		 * Every condition id currently on the actor.
		 * @param {Actor|Token|TokenDocument} target
		 * @returns {ReadonlyArray<string>}
		 */
		active(target) {
			const actor = resolveActor(target);
			if (!actor) return Object.freeze([]);
			const ids = typeof actor._activeConditionIds === "function" ? actor._activeConditionIds() : actor.statuses;
			return Object.freeze([...(ids ?? [])].filter((id) => CONDITIONS[id]));
		},

		/**
		 * Apply a condition, honouring escalation: applying one the actor already
		 * has, and that escalates, moves it up instead of doing nothing.
		 * @param {Actor|Token|TokenDocument} target
		 * @param {string} conditionId
		 * @param {object} [options]
		 * @param {boolean} [options.active=true]  Pass false to remove instead.
		 * @returns {Promise<ApplyResult|null>} null when the actor or condition is unknown.
		 */
		async apply(target, conditionId, options = {}) {
			const actor = resolveActor(target);
			if (!actor) {
				console.warn("ordemparanormal | conditions.apply: no actor resolved from", target);
				return null;
			}
			if (!CONDITIONS[conditionId]) {
				console.warn(`ordemparanormal | conditions.apply: unknown condition "${conditionId}"`);
				return null;
			}
			const effect = (await applyCondition(actor, conditionId, options)) ?? null;
			// Read the id back off the effect: escalation can chain several steps
			// (fatigado -> exausto -> inconsciente) and only the effect knows where it stopped.
			const id = conditionIdOf(effect) ?? conditionId;
			return { id, effect, escalatedFrom: id === conditionId ? null : conditionId };
		},

		/**
		 * Remove a condition.
		 * @param {Actor|Token|TokenDocument} target
		 * @param {string} conditionId
		 * @returns {Promise<ApplyResult|null>}
		 */
		async remove(target, conditionId) {
			return api.apply(target, conditionId, { active: false });
		},
	};

	return Object.freeze(api);
}

/**
 * Re-emit ActiveEffect create/delete as condition hooks. Registering here rather
 * than inside applyCondition is deliberate: a condition toggled from the Token
 * HUD, or by the system's own PV automation, has to notify listeners too.
 * @returns {void}
 */
export function registerConditionHooks() {
	const emit = (hook) => (effect, _options, userId) => {
		const actor = effect?.parent;
		// Effects also live on Items; only actor-owned ones are conditions.
		if (!actor || actor.documentName !== "Actor") return;
		for (const statusId of effect.statuses ?? []) {
			// userId travels with the event: this fires on every client, and a
			// listener needs it to do its work exactly once.
			if (CONDITIONS[statusId]) Hooks.callAll(hook, actor, statusId, effect, userId);
		}
	};
	Hooks.on("createActiveEffect", emit(CONDITION_HOOKS.applied));
	Hooks.on("deleteActiveEffect", emit(CONDITION_HOOKS.removed));
}
