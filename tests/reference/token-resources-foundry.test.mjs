import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	defaultBarBrawlSource,
	planBarBrawlUpdate,
	classifyBarBrawlConfig,
} from "../../module/helpers/barbrawl-resource-config.mjs";
import { reconcileBarBrawlToken, registerBarBrawlIntegration } from "../../module/components/barbrawl-integration.mjs";

const root = process.env.ORDEM_FOUNDRY_REFERENCE;

describe.skipIf(!root)("resource bar updates using read-only Foundry reference utilities", () => {
	let utilities;
	let source;
	let token;
	let hooks;
	beforeEach(async () => {
		utilities = await import(pathToFileURL(join(root, "common/utils/helpers.mjs")).href);
		const operators = await import(pathToFileURL(join(root, "common/data/operators.mjs")).href);
		vi.stubGlobal("foundry", { utils: utilities, data: { operators } });
		vi.stubGlobal("game", {
			release: { generation: 14 },
			user: { id: "gm", isGM: true },
			users: [{ id: "gm", isGM: true, active: true }],
			modules: { get: () => ({ active: true }) },
			settings: { get: () => true },
		});
		hooks = new Map();
		vi.stubGlobal("Hooks", { on: (name, callback) => hooks.set(name, callback) });
		registerBarBrawlIntegration();
		source = defaultBarBrawlSource("agent");
		source.flags.ordemparanormal = { resourceBars: planBarBrawlUpdate(source, "agent", false).metadata };
		token = {
			actor: { type: "agent" },
			toObject: () => utilities.deepClone(source),
			update: vi.fn(async (update, options) => {
				if (hooks.get("preUpdateToken")(token, update, options) === false) return;
				source = utilities.mergeObject(source, update, { inplace: false, applyOperators: true });
			}),
		};
	});
	afterEach(() => vi.unstubAllGlobals());

	it("merges real v14 deletion operators and keeps the resulting profile managed", async () => {
		await reconcileBarBrawlToken(token);
		expect(Object.keys(source.flags.barbrawl.resourceBars)).toEqual(["agentSpaceBar", "pv", "pd"]);
		expect(classifyBarBrawlConfig(source, "agent")).toBe("managed");
		await reconcileBarBrawlToken(token);
		expect(token.update).toHaveBeenCalledTimes(1);
		game.settings.get = () => false;
		await reconcileBarBrawlToken(token);
		expect(Object.keys(source.flags.barbrawl.resourceBars)).toEqual(["agentSpaceBar", "pv", "pe", "san"]);
		expect(classifyBarBrawlConfig(source, "agent")).toBe("managed");
	});
	it("upgrades legacy zero-based order to PV/PD without keeping SAN", async () => {
		delete source.flags.ordemparanormal;
		delete source.flags.barbrawl.resourceBars.agentSpaceBar.order;
		for (const id of ["pv", "pe", "san"]) source.flags.barbrawl.resourceBars[id].order--;
		await reconcileBarBrawlToken(token);
		expect(token.update).toHaveBeenCalledTimes(1);
		expect(Object.keys(source.flags.barbrawl.resourceBars)).toEqual(["agentSpaceBar", "pv", "pd"]);
		expect(classifyBarBrawlConfig(source, "agent")).toBe("managed");
	});
	it("clears old customization fields during explicit restoration", async () => {
		Object.assign(source.flags.barbrawl.resourceBars.pv, { hideFull: true, extraOption: "custom" });
		await reconcileBarBrawlToken(token, { force: true });
		expect(source.flags.barbrawl.resourceBars.pv).not.toHaveProperty("hideFull");
		expect(source.flags.barbrawl.resourceBars.pv).not.toHaveProperty("extraOption");
		expect(classifyBarBrawlConfig(source, "agent")).toBe("managed");
	});
	it("distinguishes an unchanged form submission from manual edits", () => {
		const unchanged = { "flags.barbrawl.resourceBars.pv.mincolor": "#ff1a1a" };
		hooks.get("preUpdateToken")(token, unchanged, {});
		expect(unchanged).not.toHaveProperty("flags.ordemparanormal.resourceBars.state");
		const changed = { "flags.barbrawl.resourceBars.pv.mincolor": "#123456" };
		hooks.get("preUpdateToken")(token, changed, {});
		expect(changed["flags.ordemparanormal.resourceBars.state"]).toBe("customized");
	});
	it("recognizes manual v14 deletions and preserves the entire remaining set", async () => {
		const changes = { "flags.barbrawl.resourceBars.pe": new foundry.data.operators.ForcedDeletion() };
		hooks.get("preUpdateToken")(token, changes, {});
		source = utilities.mergeObject(source, changes, { inplace: false, applyOperators: true });
		await reconcileBarBrawlToken(token);
		expect(token.update).not.toHaveBeenCalled();
		expect(source.flags.barbrawl.resourceBars.san).toBeDefined();
		expect(source.flags.barbrawl.resourceBars.pd).toBeUndefined();
	});
});
