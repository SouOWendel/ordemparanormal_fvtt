/**
 * Reusable helpers for Quench test isolation.
 *
 * Why they exist
 * ==============
 * Quench shares the same `game.actors`, `game.messages`, `game.combats` and
 * `game.settings` across every batch/suite/test in the session. Vanilla
 * Mocha solves isolation with `before`/`after`, but in Quench:
 *
 *  - If a test throws or times out INSIDE a `before()`, Mocha skips the
 *    matching `after()` — the fixture survives and contaminates subsequent
 *    runs.
 *  - Settings (e.g. `core.rollMode`) and `game.user.targets` mutated in
 *    `before` + restored in `after` have the same problem, and the leak
 *    affects the whole session (every later batch).
 *  - Every world doc created and not deleted slows the chat-render pipeline
 *    progressively (each re-render iterates `game.actors` to resolve
 *    speakers).
 *
 * The standard pattern in this codebase is the `with*` style based on
 * try/finally inside the test body — cleanup runs even on failure, and each
 * test owns its fixtures (no shared state across tests of the same suite).
 *
 * Conventions
 * ===========
 *  - Every Actor/Item/Combat/ActiveEffect created in a test uses a `with*`
 *    helper — never bare `Actor.create(...)` without guaranteed cleanup.
 *  - Tests prefix fixture names with `[<suite>]` (e.g. `[reactions] Sword`)
 *    so `purgeByPrefix` can sweep orphans surgically.
 *  - Setting changes → always `withSetting`. Same for targets.
 *  - Batches that mutate world state MUST call `installBatchGuards(context, …)`
 *    at the top of the registerBatch function — defense against runs that
 *    were interrupted earlier.
 *
 * Non-goals
 * =========
 *  - These don't replace `before`/`after` for state shared across the tests
 *    of one describe (valid when setup is expensive and tests are read-only
 *    over the fixture).
 *  - They don't enforce cleanup automatically — it relies on tests being
 *    written with `with*`. For regression detection see
 *    `scripts/check-test-cleanup.mjs`.
 */

/**
 * Generic try/finally fixture lifecycle: create via `createFn`, hand to the
 * callback, delete in finally (even on throw).
 *
 * @template T
 * @param {() => Promise<T>} createFn       Function that creates and returns the fixture
 * @param {(doc: T) => Promise<unknown>} fn Callback receiving the fixture
 * @param {(doc: T) => Promise<unknown>} [destroyFn]  Custom destroy (defaults to `.delete()`)
 * @returns {Promise<unknown>} The value returned by `fn`
 */
export async function withFixture(createFn, fn, destroyFn) {
	const doc = await createFn();
	try {
		return await fn(doc);
	} finally {
		try {
			if (destroyFn) await destroyFn(doc);
			else if (doc?.delete) await doc.delete();
		} catch (err) {
			console.warn("fixtures.withFixture | cleanup failed", err);
		}
	}
}

/**
 * Create an Actor, hand it to the callback, delete it in finally.
 *
 * @param {object} data    Same as the first arg of `Actor.create`
 * @param {(actor: object) => Promise<unknown>} fn
 * @returns {Promise<unknown>}
 */
export function withActor(data, fn) {
	return withFixture(() => Actor.create(data), fn);
}

/**
 * Create an Item embedded on `actor`, hand it to the callback, delete it in
 * finally.
 *
 * @param {object} actor   Actor that will own the item
 * @param {object} data    Same as the element of `createEmbeddedDocuments("Item", [data])`
 * @param {(item: object) => Promise<unknown>} fn
 * @returns {Promise<unknown>}
 */
export function withItem(actor, data, fn) {
	return withFixture(
		async () => {
			const [item] = await actor.createEmbeddedDocuments("Item", [data]);
			return item;
		},
		fn,
		(item) => actor.deleteEmbeddedDocuments("Item", [item.id])
	);
}

/**
 * Create a Combat with the given actors as combatants and start it, hand it
 * to the callback, delete it in finally. Orphan combats keep hooks alive and
 * pollute the tracker — this helper guarantees teardown even on failure.
 *
 * @param {object[]} actors           Initial combatants
 * @param {(combat: object) => Promise<unknown>} fn
 * @param {object} [options]
 * @param {boolean} [options.start=true]  Whether to call `startCombat()` after creating
 * @returns {Promise<unknown>}
 */
export function withCombat(actors, fn, { start = true } = {}) {
	return withFixture(async () => {
		const combat = await Combat.create({});
		await combat.createEmbeddedDocuments(
			"Combatant",
			actors.map((a, i) => ({ actorId: a.id, initiative: 100 - i }))
		);
		await combat.activate();
		if (start) await combat.startCombat();
		return combat;
	}, fn);
}

/**
 * Set/restore a global setting. Restore runs in finally — survives failures.
 * Without this, a test that changes `core.rollMode` and throws leaves the
 * whole session on gmroll (every chat message becomes a whisper).
 *
 * @param {string} namespace     "core" or other
 * @param {string} key           Setting name
 * @param {*} value              Temporary value
 * @param {() => Promise<unknown>} fn
 * @returns {Promise<unknown>}
 */
export async function withSetting(namespace, key, value, fn) {
	const previous = game.settings.get(namespace, key);
	await game.settings.set(namespace, key, value);
	try {
		return await fn();
	} finally {
		try {
			await game.settings.set(namespace, key, previous);
		} catch (err) {
			console.warn("fixtures.withSetting | restore failed", err);
		}
	}
}

/**
 * Set/restore `game.user.targets`. Use `.add()` rather than reassigning the
 * whole Set — Foundry exposes `UserTargets` (Set subclass) and `=` assignment
 * sometimes fails to swap the internal reference, causing flakiness.
 *
 * The "tokens" passed must expose at least `{ name, actor }` and ideally a
 * `_drawTargetArrows` stub (called by `UserTargets.add()`). Use
 * `makeFakeToken(actor)` if you only have the actor.
 *
 * @param {object[]} tokens   Token-likes with `.actor` and `_drawTargetArrows`
 * @param {() => Promise<unknown>} fn
 * @returns {Promise<unknown>}
 */
export async function withTargets(tokens, fn) {
	const snapshot = new Set(game.user.targets);
	game.user.targets.clear();
	for (const t of tokens) game.user.targets.add(t);
	try {
		return await fn();
	} finally {
		try {
			game.user.targets.clear();
			for (const t of snapshot) game.user.targets.add(t);
		} catch (err) {
			console.warn("fixtures.withTargets | restore failed", err);
		}
	}
}

/**
 * Build a minimal token-like for use with `withTargets`. Without a scene
 * Foundry has no real Token — this stub satisfies what rollAttack and
 * `UserTargets.add()` need.
 *
 * @param {object} actor
 * @returns {{name: string, actor: object, _drawTargetArrows: Function}}
 */
export function makeFakeToken(actor) {
	return { name: actor?.name ?? "<fake>", actor, _drawTargetArrows: () => {} };
}

/**
 * Purge world docs by name prefix — actors, messages (content/flavor),
 * combats with at least one prefixed combatant. Idempotent: ignores
 * already-deleted docs.
 *
 * Use this in the batch `before` to clean orphans from previous runs that
 * were interrupted (timeout / throw in hook / page refresh).
 *
 * @param {string} prefix    e.g. "[combat-qol]" or "[reactions]"
 * @returns {Promise<{actors: number, messages: number, combats: number}>}
 */
export async function purgeByPrefix(prefix) {
	const stats = { actors: 0, messages: 0, combats: 0 };

	// Combats first — they reference actors we're about to delete
	for (const c of [...(game.combats ?? [])]) {
		const hasMatchingCombatant = (c.combatants ?? []).some((cb) => cb.actor?.name?.startsWith?.(prefix));
		if (hasMatchingCombatant) {
			try {
				await c.delete();
				stats.combats += 1;
			} catch (_e) {
				/* already deleted */
			}
		}
	}

	const staleActors = [...game.actors].filter((a) => a.name?.startsWith?.(prefix));
	for (const a of staleActors) {
		try {
			await a.delete();
			stats.actors += 1;
		} catch (_e) {
			/* already deleted */
		}
	}

	const staleMsgs = [...game.messages].filter((m) => m.content?.includes?.(prefix) || m.flavor?.includes?.(prefix));
	for (const m of staleMsgs) {
		try {
			await m.delete();
			stats.messages += 1;
		} catch (_e) {
			/* already deleted */
		}
	}

	return stats;
}

/**
 * Install standard guards on a Quench batch:
 *
 *  - `before` (batch-level, runs once before everything in the batch):
 *    proactive purge of actors/messages/combats by prefix — sweeps orphans
 *    from previous interrupted runs (timeout, hook throw, page refresh).
 *  - `after` (batch-level, runs once after everything): final purge of the
 *    batch's own fixtures that leaked (defense in depth).
 *  - `afterEach` (between every test): ONLY transient state — active combat,
 *    optionally targets. Does NOT purge actors/messages because describes
 *    typically share a setup actor across multiple `it()` via a
 *    describe-level `before`. Purging here would kill that setup —
 *    observed symptom: 64 failures the first time the afterEach purged
 *    aggressively.
 *
 * Use once at the top of the registerBatch function. Does NOT replace the
 * describe's own `before`/`after` — those still own describe-specific state.
 *
 * @param {object} context              Quench batch context (with before/after/afterEach)
 * @param {object} options
 * @param {string|string[]} options.prefix   Prefix(es) to purge (e.g. "[Quench]" or ["[combat-qol]","[viz"])
 * @param {boolean} [options.purgeCombats=true]   Delete orphan combats in afterEach
 * @param {boolean} [options.clearTargets=false]  Clear `game.user.targets` in afterEach.
 *   Off by default because many describes set the target once in `before` and
 *   expect it to persist across `it()`s — opt in for batches that always set
 *   targets per-test.
 */
export function installBatchGuards(context, { prefix, purgeCombats = true, clearTargets = false } = {}) {
	const prefixes = Array.isArray(prefix) ? prefix : [prefix];
	const purgeAll = async () => {
		for (const p of prefixes) {
			if (p) await purgeByPrefix(p);
		}
	};

	context.before(async () => {
		await purgeAll();
	});

	context.after(async () => {
		await purgeAll();
	});

	context.afterEach(async () => {
		// Transient state only — we don't touch actors/messages because
		// describes typically share the `before` actor across multiple `it`s.
		// Purging here would kill that setup.
		if (purgeCombats && game.combat) {
			try {
				await game.combat.delete();
			} catch (_e) {
				/* already deleted */
			}
		}
		if (clearTargets && game.user?.targets?.size) game.user.targets.clear();
	});
}

/**
 * Snapshot the world size. Use together with `assertEnvClean` at the end of
 * the batch to detect leaks individual tests missed.
 *
 * @returns {{actors: number, items: number, messages: number, combats: number}}
 */
export function snapshotEnv() {
	return {
		actors: game.actors?.size ?? 0,
		items: game.items?.size ?? 0,
		messages: game.messages?.size ?? 0,
		combats: game.combats?.size ?? 0,
	};
}

/**
 * Assert that world size returned to baseline (`snapshotEnv` taken in the
 * `before`). Use in the batch `after` to fail loudly when a test forgot to
 * clean up — we prefer immediate failure to silent leak.
 *
 * @param {ReturnType<typeof snapshotEnv>} baseline
 * @param {object} assert    Chai assert from `context`
 * @param {object} [options]
 * @param {number} [options.messageTolerance=0]  Allow N extra messages (logs/info)
 */
export function assertEnvClean(baseline, assert, { messageTolerance = 0 } = {}) {
	const now = snapshotEnv();
	assert.equal(now.actors, baseline.actors, `Actors leaked: ${baseline.actors} → ${now.actors}`);
	assert.equal(now.combats, baseline.combats, `Combats leaked: ${baseline.combats} → ${now.combats}`);
	assert.isAtMost(
		now.messages - baseline.messages,
		messageTolerance,
		`Messages leaked: ${baseline.messages} → ${now.messages} (tolerance ${messageTolerance})`
	);
}
