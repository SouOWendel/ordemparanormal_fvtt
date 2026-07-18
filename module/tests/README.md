# Test conventions — Quench (runtime) and Vitest (unit)

This project runs in two test environments:

- **Vitest** (`npm test`) — Node tests, no Foundry. Mocks live in
  [`tests/setup/foundry-mocks.mjs`](../../tests/setup/foundry-mocks.mjs).
  Use for pure logic: helpers, parsing, math, pure visibility decisions.
- **Quench** (inside Foundry, via UI or console) — tests that need the real
  runtime (chat messages, dialogs, combat hooks, document lifecycle).

This page covers mandatory conventions for Quench. For Vitest, the usual
pattern applies: `.test.mjs` files under `tests/unit/<area>/`, shared mocks
in `tests/setup/`.

---

## Why these conventions exist

Quench shares **the same `game.actors`, `game.messages`, `game.combats` and
`game.settings`** across every batch in the session. There is no reset
between batches. This means:

- An actor created in a test and never deleted lives until the next Foundry
  reload — including across subsequent Quench runs.
- Every chat re-render iterates `game.actors` to resolve speakers. Zombie
  actors piling up make the pipeline progressively slower.
- Settings (`core.rollMode`, etc.) changed in a test that fails before
  restoring affect the entire session.
- If a Mocha `before`/`after` throws, the matching hooks are skipped —
  fixtures survive.

Real symptom observed: tests passed individually, but a second consecutive
full-suite run jumped from 27s to 4 minutes with a `rollOposto` timeout.
Diagnosis in commits [`dcee34c`](../../) and [`d7fa86b`](../../).

---

## Mandatory rules

### 1. Prefix fixture names with the batch tag

```js
await Actor.create({ name: "[Quench] My Actor", type: "agent", ... });
```

This lets `purgeByPrefix("[Quench]")` (in `installBatchGuards`) sweep
orphans from earlier runs before the batch starts.

Specialised batches may use their own prefix — e.g. `[combat-qol]`,
`[reactions-test]`. Document it at the top of the file.

### 2. Call `installBatchGuards` at the top of the batch

```js
import { installBatchGuards } from "../helpers/fixtures.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch("ordemparanormal.my-batch", (context) => {
		const { describe, it, assert, before, after } = context;
		installBatchGuards(context, { prefix: "[Quench]" });

		describe("...", () => {
			/* ... */
		});
	});
});
```

`installBatchGuards` installs:

- **`before` (batch-level)**: aggressive `purgeByPrefix` — sweeps orphans
  from interrupted earlier runs.
- **`after` (batch-level)**: final `purgeByPrefix` — cleans whatever the
  batch leaked (defense in depth).
- **`afterEach`**: ONLY transient state (active combat, optionally targets).
  Does NOT purge actors/messages because describes typically share fixtures
  across `it()`s via a describe-level `before`.

### 3. For fixtures created INSIDE an `it()`, use the `with*` helpers

Instead of:

```js
it("...", async () => {
  const actor = await Actor.create({ name: "[Quench] X", ... });
  try {
    // test body
  } finally {
    await actor.delete();
  }
});
```

Use:

```js
import { withActor } from "../helpers/fixtures.mjs";

it("...", async () => {
  await withActor({ name: "[Quench] X", ... }, async (actor) => {
    // test body — delete guaranteed by the internal finally
  });
});
```

Available in [`helpers/fixtures.mjs`](helpers/fixtures.mjs):

| Helper                                  | When to use                              |
| --------------------------------------- | ---------------------------------------- |
| `withFixture(createFn, fn, destroyFn?)` | generic, any document                    |
| `withActor(data, fn)`                   | Actor                                    |
| `withItem(actor, data, fn)`             | embedded Item                            |
| `withCombat(actors, fn, { start })`     | Combat with combatants pre-populated     |
| `withSetting(ns, key, value, fn)`       | mutate a setting with guaranteed restore |
| `withTargets(tokens, fn)`               | mutate `game.user.targets` with restore  |
| `makeFakeToken(actor)`                  | minimal token-like for `withTargets`     |

### 4. For fixtures shared across a describe (created in `before`), keep

the classic `before`/`after` pattern

```js
describe("...", () => {
  let actor;
  before(async () => { actor = await Actor.create({ name: "[Quench] X", ... }); });
  after(async () => { await actor?.delete(); });

  it("test 1", () => { /* uses actor */ });
  it("test 2", () => { /* uses actor */ });
});
```

⚠ Risk: if `before` throws, `after` is skipped and the fixture leaks.
`installBatchGuards` mitigates by sweeping orphans on the next run, but
you should make sure `before` doesn't fail silently. When in doubt, prefer
`withActor` inside the `it()`.

### 5. Settings always via `withSetting`

```js
await withSetting("core", "rollMode", "gmroll", async () => {
	// test body
});
```

⚠ Never:

```js
before(() => game.settings.set(...));  // BUG: if after is skipped, leaks to the whole session
after(() => game.settings.set(...));
```

### 6. Mutate `game.user.targets` only via `withTargets`

`game.user.targets` is a `UserTargets` (Set subclass). Reassigning the
whole Set (`game.user.targets = new Set(...)`) is flaky — Foundry
sometimes doesn't swap the internal reference. Use `withTargets`, which
clears + adds on the real Set, restoring from a snapshot.

The tokens must expose `.actor` and `_drawTargetArrows` (called by
`UserTargets.add`). Use `makeFakeToken(actor)` for a minimal stub.

### 7. Timeouts: 2s is tight, bump to 5–15s where needed

```js
it("...", async function () {
	this.timeout(5000); // or 15000 for tests with long waits
	// ...
});
```

⚠ Use `async function () { ... }`, not arrow — Mocha needs `this`.

Tests with `setTimeout` (waiting for Foundry async hooks) often need 5s+
because the environment loads progressively.

---

## Test review checklist

Before approving a PR that adds/modifies Quench tests:

- [ ] Fixtures (Actor/Item/Combat) created in `it()` use a `with*` helper?
- [ ] Fixtures in describe `before`/`after` use prefixed names?
- [ ] Setting mutations via `withSetting`?
- [ ] `game.user.targets` mutations via `withTargets`?
- [ ] `installBatchGuards(context, { prefix })` at the top of the batch?
- [ ] Timeout adequate for the number of async waits?
- [ ] Ran full Quench 2× consecutive without reload to detect leaks?

---

## Diagnosing flakiness

If a test passes in isolation but fails on a full-suite run:

1. Check execution order. Quench runs batches in the order they were
   registered ([`module/tests/quench-entry.mjs`](quench-entry.mjs)).
2. Inspect `game.actors.size`, `game.messages.size`, `game.combats.size`
   in the console before and after the problem batch. Growth = leak.
3. Use `snapshotEnv()` + `assertEnvClean(baseline, assert)` in the batch
   `before`/`after` to fail immediately on leak.
4. Disable batches via the Quench UI until you find the one leaving state.

---

## Hook failures are invisible — read `stats.failures`

When `stats.failures > json.failures.length` in the report, the missing
entries are **hook failures** (a `before`/`after`/`beforeEach`/`afterEach`
threw). The Quench results UI only renders test failures, and the JSON
report's `failures` array also only includes tests — so a hook failure
shows as `N failed | M passed` in the counter with nothing visibly red.

Capture them by patching `mocha._runnerClass.prototype.fail`:

```js
const Runner = globalThis.quench.mocha._runnerClass;
const orig = Runner.prototype.fail;
Runner.prototype.fail = function (test, err) {
	console.log("[mocha fail]", test?.type, test?.fullTitle?.() ?? test?.title, err?.message);
	return orig.apply(this, arguments);
};
// then run quench.runBatches(...) — hook failures will log
```

Common cause in this codebase: a describe-level `after` deleting a doc
that the batch-level `afterEach` (from `installBatchGuards`) already
deleted. Guard with `if (doc && game.combats.has(doc.id))` etc., or wrap
the delete in `try/catch`.

---

## References

- Original-problem fix commits: [`dcee34c`](../../), [`d7fa86b`](../../).
- Quench docs (don't cover cleanup/isolation):
  https://ethaks.github.io/FVTT-Quench/
- Mocha hooks lifecycle: https://mochajs.org/#hooks
- Foundry v13 API (use the `/foundry-vtt-module-dev` and
  `/foundry-vtt-system-dev` skills before validating API behaviour).
