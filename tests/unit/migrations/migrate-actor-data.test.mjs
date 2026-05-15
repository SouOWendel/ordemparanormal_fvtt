import { describe, expect, it } from "vitest";
import { migrateActorData } from "../../../module/migrations.mjs";

describe("migrateActorData flags compatibility", () => {
	function buildActor({ className = "Combatente", version = "7.3.3" } = {}) {
		const actor = {
			items: [],
			system: {
				class: className,
				skills: {},
			},
			_stats: {
				systemVersion: version,
			},
		};
		return { actor, actorData: { system: actor.system, _stats: actor._stats } };
	}

	it("accepts bypassVersionCheck in the third parameter", async () => {
		const { actor, actorData } = buildActor();
		const update = await migrateActorData(actor, actorData, { bypassVersionCheck: true });
		expect(update["system.class"]).toBe("fighter");
	});

	it("keeps compatibility with legacy 4-argument signature", async () => {
		const { actor, actorData } = buildActor();
		const update = await migrateActorData(actor, actorData, {}, { bypassVersionCheck: true });
		expect(update["system.class"]).toBe("fighter");
	});
});
