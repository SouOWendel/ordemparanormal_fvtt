/**
 * Ordem Paranormal — Condition system (P1).
 *
 * The 38 book conditions (appendix, pp. 310-311) modeled as pure data + pure
 * helpers, so the mechanical effects can be unit-tested without a Foundry runtime.
 *
 * DESIGN: conditions are registered as plain markers in `CONFIG.statusEffects`
 * (empty `changes`); their mechanical effects are computed IN CODE from the
 * actor's active statuses. This is deliberate:
 *  - Dice penalties (-1d/-2d) must NOT be modeled as ActiveEffects on
 *    `system.attributes.<attr>.value` — that path is also read by derived stats
 *    (Defense adds AGI, PV/PE read attributes), so an AE there would corrupt
 *    those. Instead the roll pipeline reads active conditions at roll time and
 *    lowers only the d20 pool (D20Die already handles pool<1 -> 2d20kl).
 *  - Flat Defense penalties must follow the book's stacking rule (p. 312):
 *    "conditions with the same effect don't stack; apply only the most severe"
 *    (e.g. desprevenido -5 + vulneravel -2 = -5, not -7). So the Defense penalty
 *    is the MAX across active conditions, applied at attack resolution
 *    (OrdemItem._compareWithDefense) rather than in prepareDerivedData — see
 *    that method for why.
 *
 * Attribute keys: dex=Agilidade, str=Força, vit=Vigor, int=Intelecto, pre=Presença.
 *
 * Out of P1 scope (documented follow-ups): per-turn effects (sangrando roll,
 * em chamas damage, morrendo/enlouquecendo turn counting), confuso's 1d6
 * behavior, asfixiado countdown, caído's range-split defense, and cascading
 * sub-conditions (agarrado also imposing imóvel, etc.).
 */

const ICON = (name) => `icons/svg/${name}.svg`;

/**
 * A dice-penalty descriptor. `scope` selects which rolls it applies to:
 *  - "tests"       : every test (attribute checks, skills AND attacks)
 *  - "skills"      : any skill test (perícia)
 *  - "attr"        : rolls using one of `keys` attributes; if `onlySkills`, only
 *                    when it's a skill roll (e.g. cego: -2d AGI/FOR *perícias*)
 *  - "skill"       : the specific skills in `keys` (e.g. desprevenido: reflexes)
 *  - "attack"      : attack rolls
 *  - "attackMelee" : melee attack rolls only
 * @typedef {{scope: string, value: number, keys?: string[], onlySkills?: boolean}} DicePenalty
 */

/**
 * @typedef {Object} ConditionDef
 * @property {string} id
 * @property {string} label         i18n key
 * @property {string} img           Token HUD icon
 * @property {string} [category]    medo | paralisia | mental | sentidos | fadiga
 * @property {string} [escalatesTo] condition id this becomes when reapplied
 * @property {DicePenalty[]} [dice] dice-pool penalties
 * @property {number} [defense]     flat Defense penalty (positive number, subtracted; MAX-stacked)
 * @property {boolean} [overlay]    render as full-token overlay
 * @property {boolean} [auto]       toggled automatically by the system (morrendo/machucado)
 */

/** @type {Record<string, ConditionDef>} */
export const CONDITIONS = {
	abalado: {
		id: "abalado",
		label: "op.conditions.abalado",
		img: ICON("terror"),
		category: "medo",
		escalatesTo: "apavorado",
		dice: [{ scope: "tests", value: 1 }],
	},
	agarrado: {
		id: "agarrado",
		label: "op.conditions.agarrado",
		img: ICON("net"),
		category: "paralisia",
		dice: [{ scope: "attack", value: 1 }],
		defense: 5,
	},
	alquebrado: { id: "alquebrado", label: "op.conditions.alquebrado", img: ICON("degen"), category: "mental" },
	apavorado: {
		id: "apavorado",
		label: "op.conditions.apavorado",
		img: ICON("terror"),
		category: "medo",
		dice: [{ scope: "skills", value: 2 }],
	},
	asfixiado: { id: "asfixiado", label: "op.conditions.asfixiado", img: ICON("acid") },
	atordoado: { id: "atordoado", label: "op.conditions.atordoado", img: ICON("daze"), category: "mental", defense: 5 },
	caido: { id: "caido", label: "op.conditions.caido", img: ICON("falling"), dice: [{ scope: "attackMelee", value: 2 }] },
	cego: {
		id: "cego",
		label: "op.conditions.cego",
		img: ICON("blind"),
		category: "sentidos",
		defense: 5,
		dice: [{ scope: "attr", keys: ["dex", "str"], value: 2, onlySkills: true }],
	},
	confuso: { id: "confuso", label: "op.conditions.confuso", img: ICON("stoned"), category: "mental" },
	debilitado: {
		id: "debilitado",
		label: "op.conditions.debilitado",
		img: ICON("downgrade"),
		escalatesTo: "inconsciente",
		dice: [{ scope: "attr", keys: ["dex", "str", "vit"], value: 2 }],
	},
	desprevenido: {
		id: "desprevenido",
		label: "op.conditions.desprevenido",
		img: ICON("target"),
		defense: 5,
		dice: [{ scope: "skill", keys: ["reflexes"], value: 1 }],
	},
	doente: { id: "doente", label: "op.conditions.doente", img: ICON("acid") },
	emChamas: { id: "emChamas", label: "op.conditions.emChamas", img: ICON("fire") },
	enjoado: { id: "enjoado", label: "op.conditions.enjoado", img: ICON("acid") },
	enlouquecendo: { id: "enlouquecendo", label: "op.conditions.enlouquecendo", img: ICON("terror") },
	enredado: {
		id: "enredado",
		label: "op.conditions.enredado",
		img: ICON("net"),
		category: "paralisia",
		defense: 2,
		dice: [{ scope: "attack", value: 1 }],
	},
	envenenado: { id: "envenenado", label: "op.conditions.envenenado", img: ICON("poison") },
	esmorecido: {
		id: "esmorecido",
		label: "op.conditions.esmorecido",
		img: ICON("downgrade"),
		category: "mental",
		dice: [{ scope: "attr", keys: ["int", "pre"], value: 2 }],
	},
	exausto: {
		id: "exausto",
		label: "op.conditions.exausto",
		img: ICON("unconscious"),
		category: "fadiga",
		escalatesTo: "inconsciente",
		defense: 2,
		dice: [{ scope: "attr", keys: ["dex", "str", "vit"], value: 2 }],
	},
	fascinado: {
		id: "fascinado",
		label: "op.conditions.fascinado",
		img: ICON("eye"),
		category: "mental",
		dice: [{ scope: "skill", keys: ["perception"], value: 2 }],
	},
	fatigado: {
		id: "fatigado",
		label: "op.conditions.fatigado",
		img: ICON("degen"),
		category: "fadiga",
		escalatesTo: "exausto",
		defense: 2,
		dice: [{ scope: "attr", keys: ["dex", "str", "vit"], value: 1 }],
	},
	fraco: {
		id: "fraco",
		label: "op.conditions.fraco",
		img: ICON("downgrade"),
		escalatesTo: "debilitado",
		dice: [{ scope: "attr", keys: ["dex", "str", "vit"], value: 1 }],
	},
	frustrado: {
		id: "frustrado",
		label: "op.conditions.frustrado",
		img: ICON("downgrade"),
		category: "mental",
		escalatesTo: "esmorecido",
		dice: [{ scope: "attr", keys: ["int", "pre"], value: 1 }],
	},
	imovel: { id: "imovel", label: "op.conditions.imovel", img: ICON("paralysis"), category: "paralisia" },
	inconsciente: { id: "inconsciente", label: "op.conditions.inconsciente", img: ICON("unconscious"), defense: 10 },
	indefeso: { id: "indefeso", label: "op.conditions.indefeso", img: ICON("sleep"), defense: 10 },
	lento: { id: "lento", label: "op.conditions.lento", img: ICON("pawprint"), category: "paralisia" },
	machucado: { id: "machucado", label: "op.conditions.machucado", img: ICON("blood"), auto: true },
	morrendo: { id: "morrendo", label: "op.conditions.morrendo", img: ICON("skull"), auto: true },
	ofuscado: {
		id: "ofuscado",
		label: "op.conditions.ofuscado",
		img: ICON("blind"),
		category: "sentidos",
		dice: [
			{ scope: "attack", value: 1 },
			{ scope: "skill", keys: ["perception"], value: 1 },
		],
	},
	paralisado: {
		id: "paralisado",
		label: "op.conditions.paralisado",
		img: ICON("paralysis"),
		category: "paralisia",
		defense: 10,
	},
	pasmo: { id: "pasmo", label: "op.conditions.pasmo", img: ICON("daze"), category: "mental" },
	perturbado: { id: "perturbado", label: "op.conditions.perturbado", img: ICON("terror") },
	petrificado: { id: "petrificado", label: "op.conditions.petrificado", img: ICON("stoned"), defense: 10 },
	sangrando: { id: "sangrando", label: "op.conditions.sangrando", img: ICON("blood") },
	surdo: {
		id: "surdo",
		label: "op.conditions.surdo",
		img: ICON("deaf"),
		category: "sentidos",
		dice: [{ scope: "skill", keys: ["initiative"], value: 2 }],
	},
	surpreendido: { id: "surpreendido", label: "op.conditions.surpreendido", img: ICON("daze"), defense: 5 },
	vulneravel: { id: "vulneravel", label: "op.conditions.vulneravel", img: ICON("statue"), defense: 2 },
	// Not a book condition: token overlay for a defeated combatant (CONFIG.specialStatusEffects.DEFEATED).
	morto: { id: "morto", label: "op.conditions.morto", img: ICON("skull"), overlay: true, auto: true },
};

/** Ordered list of condition ids (stable ordering for the HUD). */
export const CONDITION_IDS = Object.keys(CONDITIONS);

/**
 * Build the array assigned to `CONFIG.statusEffects` in the init hook.
 * @returns {Array<{id: string, name: string, img: string, changes: object[], overlay?: boolean}>}
 */
export function buildStatusEffects() {
	return CONDITION_IDS.map((id) => {
		const c = CONDITIONS[id];
		const entry = { id, name: c.label, img: c.img, changes: [] };
		if (c.overlay) entry.overlay = true;
		return entry;
	});
}

/**
 * Total d20-pool penalty for a specific roll, summed across the actor's active
 * conditions. (Dice penalties are summed; the book's "most severe" rule is only
 * enforced for Defense — see module header.)
 * @param {Set<string>|string[]|null} statuses  Active status ids (actor.statuses).
 * @param {Object} ctx
 * @param {"attribute"|"skill"|"attack"} ctx.kind
 * @param {string} [ctx.attribute]  attribute id in use (dex/str/vit/int/pre)
 * @param {string} [ctx.skill]      skill id in use (skill rolls)
 * @param {boolean} [ctx.melee]     true for melee attacks
 * @returns {number} number of dice to remove from the pool (>= 0)
 */
export function getDicePenalty(statuses, ctx = {}) {
	let penalty = 0;
	for (const id of _iterableStatuses(statuses)) {
		const def = CONDITIONS[id];
		if (!def?.dice) continue;
		for (const d of def.dice) {
			if (diceApplies(d, ctx)) penalty += d.value;
		}
	}
	return penalty;
}

function diceApplies(d, ctx) {
	switch (d.scope) {
		case "tests":
			return true;
		case "skills":
			return ctx.kind === "skill";
		case "attr":
			if (!d.keys?.includes(ctx.attribute)) return false;
			return d.onlySkills ? ctx.kind === "skill" : true;
		case "skill":
			return ctx.kind === "skill" && d.keys?.includes(ctx.skill);
		case "attack":
			return ctx.kind === "attack";
		case "attackMelee":
			return ctx.kind === "attack" && ctx.melee === true;
		default:
			return false;
	}
}

/**
 * Flat Defense penalty from active conditions. Per book p. 312, same-effect
 * penalties don't stack — the most severe applies. So this is the MAX, not sum.
 * @param {Set<string>|string[]|null} statuses
 * @returns {number} positive number to subtract from Defense (0 if none)
 */
export function getConditionDefensePenalty(statuses) {
	let max = 0;
	for (const id of _iterableStatuses(statuses)) {
		const def = CONDITIONS[id];
		if (def?.defense && def.defense > max) max = def.defense;
	}
	return max;
}

/**
 * Normalize a statuses argument (Set, Array, or null/undefined) to something
 * iterable with `for...of`. Sets and Arrays are both natively iterable, so no
 * copy is made — this only exists to make garbage input a silent no-op
 * instead of throwing.
 * @param {Set<string>|string[]|null|undefined} statuses
 * @returns {Iterable<string>}
 */
function _iterableStatuses(statuses) {
	if (statuses instanceof Set || Array.isArray(statuses)) return statuses;
	return [];
}

/**
 * The active-condition source for an actor, preferring `_activeConditionIds()`
 * (OrdemActor's own derivation, re-verified against the live effect list) and
 * falling back to `actor.statuses` for an actor that doesn't expose it (e.g. a
 * bare/mock Actor in a test). Extracted so callers don't repeat the `?.() ??`
 * fallback chain at every call site.
 * @param {Actor} actor
 * @returns {Set<string>|undefined}
 */
export function activeConditionsOf(actor) {
	return actor?._activeConditionIds?.() ?? actor?.statuses;
}

/**
 * The condition id this one escalates to when reapplied, or null.
 * @param {string} id
 * @returns {string|null}
 */
export function escalationTarget(id) {
	return CONDITIONS[id]?.escalatesTo ?? null;
}

/**
 * Which health conditions should be active for a given PV state.
 * Morrendo when PV <= 0; Machucado when PV <= half max (and not morrendo... the
 * book lets both coexist, but morrendo implies machucado — we keep both so the
 * "at half or less" marker is accurate).
 * @param {number} pv
 * @param {number} maxPv
 * @returns {{morrendo: boolean, machucado: boolean}}
 */
export function computeHealthConditions(pv, maxPv) {
	const morrendo = pv <= 0;
	const machucado = maxPv > 0 && pv <= maxPv / 2;
	return { morrendo, machucado };
}

/**
 * Apply (or remove) a condition on an actor, honoring escalation. When applying
 * a condition the actor already has and that escalates (e.g. abalado -> apavorado),
 * the original is removed and the escalation target is applied instead (which may
 * itself escalate: fraco -> debilitado -> inconsciente).
 * @param {Actor} actor
 * @param {string} id
 * @param {{active?: boolean}} [options]
 * @returns {Promise<unknown>}
 */
export async function applyCondition(actor, id, { active = true } = {}) {
	if (!CONDITIONS[id]) return null;
	if (!active) return actor.toggleStatusEffect(id, { active: false });

	const target = escalationTarget(id);
	if (target && isConditionActive(actor, id)) {
		await actor.toggleStatusEffect(id, { active: false });
		return applyCondition(actor, target, { active: true });
	}
	return actor.toggleStatusEffect(id, { active: true, overlay: Boolean(CONDITIONS[id].overlay) });
}

/**
 * Whether a condition is currently active on an actor. Delegates to
 * `actor._activeConditionIds()` (OrdemActor) so there's one walk of
 * `allApplicableEffects()`, not two — falls back to `actor.statuses` only
 * when `_activeConditionIds` isn't available (e.g. a bare/mock Actor).
 * @param {Actor} actor
 * @param {string} id
 * @returns {boolean}
 */
export function isConditionActive(actor, id) {
	if (typeof actor?._activeConditionIds === "function") return actor._activeConditionIds().has(id);
	return actor?.statuses?.has?.(id) ?? false;
}
