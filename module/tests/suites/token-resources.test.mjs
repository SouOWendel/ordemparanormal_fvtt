import { installBatchGuards, withActor, withFixture, withSetting } from "../helpers/fixtures.mjs";
import { resolveTokenResources, isBarBrawlActive } from "../../helpers/token-resources.mjs";
import { refreshTokenResourcesForRule } from "../../components/token-resources.mjs";
import { applyTokenResourceInput } from "../../components/token-resource-hud.mjs";
import { reconcileBarBrawlToken } from "../../components/barbrawl-integration.mjs";
import { classifyBarBrawlConfig } from "../../helpers/barbrawl-resource-config.mjs";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.tokenResources",
		(context) => {
			const { describe, it, assert } = context;
			installBatchGuards(context, { prefix: "[token-resources]" });
			describe("token resources — actual documents", () => {
				it("refreshes rule-dependent prepared data without persisting resource values", async () => {
					await withActor(
						{ name: "[token-resources] agent", type: "agent", system: { disableCalculations: true } },
						async (actor) => {
							const before = actor.toObject().system;
							for (const rule of [false, true, false]) {
								await withSetting("ordemparanormal", "globalPlayingWithoutSanity", rule, async () => {
									await refreshTokenResourcesForRule();
									assert.deepEqual(
										resolveTokenResources(actor, rule).map((entry) => entry.label),
										rule ? ["PV", "PD"] : ["PV", "PE", "SAN"]
									);
									for (const key of ["PV", "PE", "PD", "SAN"]) assert.deepEqual(actor.toObject().system[key], before[key]);
								});
							}
						}
					);
				});
				it("keeps linked and synthetic resource writes isolated", async () => {
					await withActor({ name: "[token-resources] threat", type: "threat" }, async (actor) => {
						await withFixture(
							() => Scene.create({ name: "[token-resources] scene" }),
							async (scene) => {
								const [linked, unlinked] = await scene.createEmbeddedDocuments("Token", [
									{ ...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true },
									{ ...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: false },
								]);
								await unlinked.actor.modifyTokenAttribute("attributes.hp", 3, false, true);
								assert.equal(resolveTokenResources(unlinked.actor)[0].value, 3);
								assert.equal(resolveTokenResources(linked.actor)[0].value, 10);
								const hud = {
									document: unlinked,
									_parseAttributeInput: (...args) => canvas.tokens.hud._parseAttributeInput(...args),
								};
								await applyTokenResourceInput(hud, "attributes.hp", "+2");
								assert.equal(unlinked.actor.system.attributes.hp.value, 5);
								assert.equal(actor.system.attributes.hp.value, 10);
								await unlinked.actor.update({ "system.attributes.hp.max": 20 });
								assert.equal(resolveTokenResources(unlinked.actor)[0].max, 20);
							}
						);
					});
				});
				it("preserves Bar Brawl customizations and explicitly restores defaults", async function () {
					if (!isBarBrawlActive()) this.skip();
					await withActor({ name: "[token-resources] customized", type: "agent" }, async (actor) => {
						await reconcileBarBrawlToken(actor.prototypeToken, { force: true });
						assert.equal(classifyBarBrawlConfig(actor.prototypeToken.toObject(), "agent"), "managed");
						await actor.update({ "prototypeToken.flags.barbrawl.resourceBars.pv.mincolor": "#123456" });
						await reconcileBarBrawlToken(actor.prototypeToken);
						assert.equal(actor.prototypeToken.flags.barbrawl.resourceBars.pv.mincolor, "#123456");
						assert.equal(classifyBarBrawlConfig(actor.prototypeToken.toObject(), "agent"), "customized");
						await reconcileBarBrawlToken(actor.prototypeToken, { force: true });
						assert.equal(actor.prototypeToken.flags.barbrawl.resourceBars.pv.mincolor, "#ff1a1a");
					});
				});
			});
		},
		{ displayName: "OP | Token resources: prepared data, synthetic Actors and optional Bar Brawl" }
	);
});
