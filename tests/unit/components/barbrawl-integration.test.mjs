import { readFileSync } from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
	buildBarBrawlDefaults,
	defaultBarBrawlSource,
	classifyBarBrawlConfig,
	planBarBrawlUpdate,
	nativeResourceConfig,
} from "../../../module/helpers/barbrawl-resource-config.mjs";
import {
	reconcileBarBrawlResources,
	reconcileBarBrawlToken,
	registerBarBrawlIntegration,
	buildBarBrawlUpdate,
} from "../../../module/components/barbrawl-integration.mjs";

afterEach(() => vi.unstubAllGlobals());

function managedSource(rule = false) {
	const source = defaultBarBrawlSource("agent", rule);
	source.flags.ordemparanormal = { resourceBars: planBarBrawlUpdate(source, "agent", rule).metadata };
	return source;
}

describe("Bar Brawl defaults and legacy recognition", () => {
	it.each([
		["agent", false, ["custom", "PV", "PE", "SAN"]],
		["agent", true, ["custom", "PV", "PD"]],
		["threat", true, ["custom", "attributes.hp"]],
	])("builds %s / %s", (type, rule, attributes) => {
		expect(Object.values(buildBarBrawlDefaults(type, rule)).map((bar) => bar.attribute)).toEqual(attributes);
	});
	it.each(["agents/johannes-von-baumann", "agents/elouise-elahi-anaki", "threats/desalento"])(
		"recognizes the real legacy compendium %s",
		(name) => {
			const actor = JSON.parse(readFileSync(new URL(`../../../packs/_source/${name}.json`, import.meta.url), "utf8"));
			expect(classifyBarBrawlConfig(actor.prototypeToken, actor.type)).toBe("legacy");
		}
	);
	it("recognizes old creation defaults without enrichment", () => {
		const source = defaultBarBrawlSource("agent");
		for (const bar of Object.values(source.flags.barbrawl.resourceBars)) delete bar.order;
		expect(classifyBarBrawlConfig(source, "agent")).toBe("legacy");
	});
	it("recognizes legacy zero-based resource order with an unnumbered spacer", () => {
		const source = defaultBarBrawlSource("agent");
		delete source.flags.barbrawl.resourceBars.agentSpaceBar.order;
		for (const id of ["pv", "pe", "san"]) source.flags.barbrawl.resourceBars[id].order--;
		expect(classifyBarBrawlConfig(source, "agent")).toBe("legacy");
		const patch = planBarBrawlUpdate(source, "agent", true);
		expect(patch.remove).toEqual(["pe", "san"]);
		expect(patch.bars.pd.attribute).toBe("PD");
		expect(patch.bars.san).toBeUndefined();
	});
	it("still preserves an actual legacy reordering or invalid order", () => {
		const source = defaultBarBrawlSource("agent");
		source.flags.barbrawl.resourceBars.pe.order = 99;
		expect(planBarBrawlUpdate(source, "agent", true)).toBeNull();
		source.flags.barbrawl.resourceBars.pe.order = "invalid";
		expect(planBarBrawlUpdate(source, "agent", true)).toBeNull();
	});
	it.each(["mincolor", "position", "ownerVisibility", "order", "unknownOption"])(
		"preserves customization of %s",
		(field) => {
			const source = managedSource();
			source.flags.barbrawl.resourceBars.pe[field] = field === "order" ? 99 : "custom";
			expect(classifyBarBrawlConfig(source, "agent")).toBe("customized");
			expect(planBarBrawlUpdate(source, "agent", true)).toBeNull();
		}
	);
	it("preserves removed or added bars, native attributes, malformed flags and unknown metadata", () => {
		for (const mutate of [
			(source) => delete source.flags.barbrawl.resourceBars.pe,
			(source) => (source.flags.barbrawl.resourceBars.extra = { id: "extra", attribute: "PD" }),
			(source) => (source.bar1.attribute = "PV"),
			(source) => (source.flags.barbrawl.resourceBars = null),
			(source) => (source.flags.ordemparanormal.resourceBars.version = 42),
		]) {
			const source = managedSource();
			mutate(source);
			expect(planBarBrawlUpdate(source, "agent", true)).toBeNull();
		}
	});
	it("ignores runtime values but keeps custom spacer values significant", () => {
		const source = managedSource();
		Object.assign(source.flags.barbrawl.resourceBars.pe, { value: 3, max: 30, editable: true });
		expect(classifyBarBrawlConfig(source, "agent")).toBe("managed");
		source.flags.barbrawl.resourceBars.agentSpaceBar.value = 5;
		expect(classifyBarBrawlConfig(source, "agent")).toBe("customized");
	});
	it("switches profiles, records provenance and produces no further changes", () => {
		const source = managedSource();
		const patch = planBarBrawlUpdate(source, "agent", true);
		expect(patch.remove).toEqual(["pe", "san"]);
		expect(patch.metadata.profile).toBe("agent-determination");
		const next = managedSource(true);
		expect(planBarBrawlUpdate(next, "agent", true)).toBeNull();
		expect(planBarBrawlUpdate(next, "agent", false).remove).toEqual(["pd"]);
	});
	it("restores customized sets only explicitly", () => {
		const source = managedSource();
		source.flags.barbrawl.resourceBars.pv.mincolor = "#abcdef";
		expect(planBarBrawlUpdate(source, "agent", true, { force: true }).metadata.state).toBe("managed");
	});
	it("prepares tokens created without Bar Brawl for later optional activation", () => {
		const source = { bar1: { attribute: "PV" }, bar2: { attribute: "SAN" }, displayBars: 0, flags: {} };
		source.flags.ordemparanormal = {
			resourceBars: { version: 1, state: "pending", reference: nativeResourceConfig(source) },
		};
		expect(classifyBarBrawlConfig(source, "agent")).toBe("pending");
		expect(planBarBrawlUpdate(source, "agent", true).metadata.profile).toBe("agent-determination");
		source.bar2.attribute = "PD";
		expect(planBarBrawlUpdate(source, "agent", true)).toBeNull();
	});
	it("restoration also clears old options on retained bar IDs", () => {
		const source = managedSource();
		Object.assign(source.flags.barbrawl.resourceBars.pv, { hideFull: true, unknownOption: true });
		const patch = planBarBrawlUpdate(source, "agent", false, { force: true });
		expect(patch.removeFields).toContainEqual(["pv", "hideFull"]);
		expect(patch.removeFields).toContainEqual(["pv", "unknownOption"]);
	});
});

describe("reconciliation adapter", () => {
	function environment({ active = true, authority = true, generation = 14 } = {}) {
		const source = managedSource();
		const token = {
			id: "token",
			actor: { type: "agent" },
			toObject: () => structuredClone(source),
			update: vi.fn().mockResolvedValue(undefined),
		};
		const actors = [];
		vi.stubGlobal("game", {
			user: { id: "gm", isGM: true },
			users: [{ id: authority ? "gm" : "other", isGM: true, active: true }],
			actors,
			scenes: [{ tokens: [token] }],
			release: { generation },
			modules: { get: () => ({ active }) },
			settings: { get: () => true },
		});
		vi.stubGlobal("ui", { notifications: { error: vi.fn() } });
		game.i18n = { localize: (key) => key };
		return { token, source, actors };
	}
	it.each([{ active: false }, { authority: false }])(
		"does not mutate without the backend or authority: %j",
		async (options) => {
			const { token } = environment(options);
			await reconcileBarBrawlResources();
			expect(token.update).not.toHaveBeenCalled();
		}
	);
	it("updates scene tokens and actor prototypes without copying their resources", async () => {
		const { token, actors } = environment({ generation: 13 });
		const actor = { documentName: "Actor", type: "agent", update: vi.fn().mockResolvedValue(undefined) };
		actor.prototypeToken = { ...token, parent: actor };
		actors.push(actor);
		await reconcileBarBrawlResources();
		expect(token.update).toHaveBeenCalledTimes(1);
		expect(actor.update).toHaveBeenCalledTimes(1);
		expect(token.update.mock.calls[0][0]["flags.barbrawl.resourceBars"]["-=pe"]).toBeNull();
		expect(Object.keys(actor.update.mock.calls[0][0]).every((key) => key.startsWith("prototypeToken."))).toBe(true);
	});
	it("accepts Foundry-style iterable collections without Array.flatMap", async () => {
		const { token } = environment({ generation: 13 });
		game.actors = new Set();
		game.scenes = new Set(game.scenes);
		await reconcileBarBrawlResources();
		expect(token.update).toHaveBeenCalledTimes(1);
	});
	it("uses v14 operators and v13 deletion syntax", () => {
		environment();
		class Deletion {}
		vi.stubGlobal("foundry", {
			data: { operators: { ForcedDeletion: Deletion, ForcedReplacement: { create: (value) => value } } },
		});
		const patch = planBarBrawlUpdate(managedSource(), "agent", true);
		expect(buildBarBrawlUpdate(patch)["flags.barbrawl.resourceBars"].pe).toBeInstanceOf(Deletion);
		game.release.generation = 13;
		expect(buildBarBrawlUpdate(patch)["flags.barbrawl.resourceBars"]["-=pe"]).toBeNull();
	});
	it("abandons an update if configuration changed after planning", async () => {
		const { token, source } = environment({ generation: 13 });
		token.toObject = vi
			.fn()
			.mockReturnValueOnce(structuredClone(source))
			.mockImplementation(() => {
				const changed = structuredClone(source);
				changed.flags.barbrawl.resourceBars.pv.mincolor = "#abcdef";
				return changed;
			});
		await reconcileBarBrawlToken(token);
		expect(token.update).not.toHaveBeenCalled();
	});
	it("reports a failed write once and continues with the next document", async () => {
		const { token } = environment({ generation: 13 });
		const failure = { ...token, update: vi.fn().mockRejectedValue(new Error("Disconnected")) };
		game.scenes[0].tokens.unshift(failure);
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			await reconcileBarBrawlResources();
			await reconcileBarBrawlResources();
			expect(failure.update).toHaveBeenCalledTimes(1);
			expect(token.update).toHaveBeenCalledTimes(2);
			expect(ui.notifications.error).toHaveBeenCalledTimes(1);
		} finally {
			log.mockRestore();
		}
	});
	it("serializes reconciliation requests and skips already applied profiles", async () => {
		const { token } = environment({ generation: 13 });
		let source = managedSource();
		token.toObject = () => structuredClone(source);
		token.update.mockImplementation(async (update) => {
			source = defaultBarBrawlSource("agent", true);
			source.flags.ordemparanormal = { resourceBars: update["flags.ordemparanormal.==resourceBars"] };
		});
		await Promise.all([reconcileBarBrawlResources(), reconcileBarBrawlResources()]);
		expect(token.update).toHaveBeenCalledTimes(1);
	});
	it("guards the final pre-update boundary", () => {
		const { token } = environment({ generation: 13 });
		const hooks = new Map();
		vi.stubGlobal("Hooks", { on: (name, callback) => hooks.set(name, callback) });
		registerBarBrawlIntegration();
		expect(hooks.get("preUpdateToken")(token, {}, { ordemResourceBars: { expected: { bars: {} } } })).toBe(false);
	});
	it("a second GM can explicitly restore defaults", async () => {
		const { token } = environment({ authority: false, generation: 13 });
		await reconcileBarBrawlToken(token, { force: true });
		expect(token.update).toHaveBeenCalledTimes(1);
	});
	it("preserves module defaults and manually imported sets during Actor creation", () => {
		environment({ generation: 13 });
		const hooks = new Map();
		vi.stubGlobal("Hooks", { on: (name, callback) => hooks.set(name, callback) });
		registerBarBrawlIntegration();
		const source = managedSource();
		source.flags.barbrawl.resourceBars.pv.mincolor = "#123456";
		const prototypeToken = { toObject: () => source, updateSource: vi.fn() };
		hooks.get("preCreateActor")({ type: "agent", prototypeToken }, { prototypeToken: source });
		expect(prototypeToken.updateSource).not.toHaveBeenCalled();
		game.modules.get = () => ({ active: true, api: { getDefaultBars: () => ({ custom: {} }) } });
		hooks.get("preCreateActor")({ type: "agent", prototypeToken }, {});
		expect(prototypeToken.updateSource).not.toHaveBeenCalled();
	});
	it("records optional integration provenance without writing Bar Brawl flags when inactive", () => {
		environment({ active: false });
		const hooks = new Map();
		vi.stubGlobal("Hooks", { on: (name, callback) => hooks.set(name, callback) });
		registerBarBrawlIntegration();
		const source = { bar1: { attribute: "PV" }, bar2: { attribute: "SAN" }, displayBars: 0 };
		const prototypeToken = { toObject: () => source, updateSource: vi.fn() };
		hooks.get("preCreateActor")({ type: "agent", prototypeToken }, {});
		expect(prototypeToken.updateSource).toHaveBeenCalledExactlyOnceWith({
			"flags.ordemparanormal.resourceBars": { version: 1, state: "pending", reference: nativeResourceConfig(source) },
		});
	});
});
