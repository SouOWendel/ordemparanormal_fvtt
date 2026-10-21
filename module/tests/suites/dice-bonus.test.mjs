import { installBatchGuards, withActor, withItem, withTargets } from "../helpers/fixtures.mjs";
import SkillToolRollConfigurationDialog from "../../applications/skill-tool-configuration-dialog.mjs";
import { OrdemThreatSheet } from "../../sheets/threat-sheet.mjs";

const prefix = "[dice-bonus]";

Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.diceBonus",
		(context) => {
			const { describe, it, assert } = context;
			installBatchGuards(context, { prefix, purgeCombats: false });

			const actorData = (type) => ({
				name: `${prefix} ${type}`,
				type,
				system: {
					attributes: { pre: { value: 2 }, int: { value: 3 }, dex: { value: 2 } },
					skills: { will: { attr: ["pre"] }, freeSkill: { name: "Xadrez", attr: ["int"] } },
				},
			});
			const effectData = (key, value) => ({
				name: `${prefix} ${value}`,
				changes: [{ key, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(value) }],
			});
			const skillRoll = async (actor, skill, config = {}) => {
				const [roll] = await actor.rollSkill({ skill, ...config }, { configure: false }, { create: false });
				return roll;
			};
			const assertPool = (roll, number, modifier) => {
				assert.equal(roll.dice[0].number, number);
				assert.deepEqual(roll.dice[0].modifiers, modifier ? [modifier] : []);
			};

			for (const type of ["agent", "threat"]) {
				describe(`${type} native dice bonuses`, () => {
					it("initializes legacy data and accepts negative integer bonuses", async function () {
						this.timeout(10000);
						await withActor(actorData(type), async (actor) => {
							for (const key of ["dex", "int", "pre", "str", "vit"]) {
								assert.strictEqual(actor.system.attributes[key].diceBonus, 0);
							}
							for (const skill of Object.values(actor.system.skills)) assert.strictEqual(skill.diceBonus, 0);
							await actor.update({ "system.attributes.pre.diceBonus": -3 });
							assert.strictEqual(actor.system.attributes.pre.diceBonus, -3);
						});
					});

					it("stacks ADD +1, +2 and -1, and reverses disable, re-enable and deletion", async function () {
						this.timeout(15000);
						await withActor(actorData(type), async (actor) => {
							const key = "system.attributes.pre.diceBonus";
							const [one, two, minus] = await actor.createEmbeddedDocuments("ActiveEffect", [
								effectData(key, 1),
								effectData(key, 2),
								effectData(key, -1),
							]);
							const check = async (bonus) => {
								assert.strictEqual(actor.system.attributes.pre.diceBonus, bonus);
								assert.strictEqual(actor.system.attributes.pre.value, 2);
								const [roll] = await actor.rollAttribute({ attribute: "pre" }, { configure: false }, { create: false });
								assertPool(roll, 2 + bonus, "kh");
							};
							await check(2);
							actor.reset();
							await check(2);
							await two.update({ disabled: true });
							await check(0);
							await two.update({ disabled: false });
							await check(2);
							await one.delete();
							await check(1);
							await two.delete();
							await minus.delete();
							await check(0);
						});
					});

					it("combines attribute and skill effects on resistance tests without changing flat modifiers", async function () {
						this.timeout(10000);
						await withActor(actorData(type), async (actor) => {
							await actor.update({
								"system.skills.will.value": 3,
								"system.skills.will.degree.label": "trained",
							});
							await actor.createEmbeddedDocuments("ActiveEffect", [
								effectData("system.attributes.pre.diceBonus", 1),
								effectData("system.skills.will.diceBonus", 2),
							]);
							const roll = await skillRoll(actor, "will", { target: 15 });
							assertPool(roll, 5, "kh");
							assert.equal(roll.data.prof, 5);
							assert.equal(roll.data.extraBonus, 3);
							assert.equal(roll.options.target, 15);
							const [direct] = await actor.rollAttribute({ attribute: "pre" }, { configure: false }, { create: false });
							assertPool(direct, 3, "kh");
						});
					});

					it("uses freeSkill and the attribute selected in the roll dialog without duplicate configuration", async function () {
						this.timeout(10000);
						await withActor(actorData(type), async (actor) => {
							await actor.createEmbeddedDocuments("ActiveEffect", [
								effectData("system.attributes.int.diceBonus", 1),
								effectData("system.attributes.pre.diceBonus", -2),
								effectData("system.skills.freeSkill.diceBonus", 1),
							]);
							assertPool(await skillRoll(actor, "freeSkill"), 5, "kh");
							const dialog = new SkillToolRollConfigurationDialog(
								{
									skill: "freeSkill",
									attributeId: "int",
									rolls: [{ options: {} }],
								},
								{},
								{ buildConfig: actor._buildSkillToolConfig.bind(actor, "skill") }
							);
							try {
								const config = dialog._buildConfig({ options: {} }, new Map([["attribute", "pre"]]), 0);
								const roll = CONFIG.Dice.D20Roll.fromConfig(config, {});
								assertPool(roll, 1, null);
								for (const mode of [1, -1, 0, 0]) {
									roll.options.advantageMode = mode;
									roll.configureModifiers();
									assertPool(roll, mode === 0 ? 1 : 2, mode === 1 ? "kh" : mode === -1 ? "kl" : null);
								}
							} finally {
								await dialog.close();
							}
						});
					});

					it("applies bonuses transferred from an item and removes them with the item", async function () {
						this.timeout(10000);
						await withActor(actorData(type), async (actor) => {
							await withItem(
								actor,
								{
									name: `${prefix} transferred bonus`,
									type: "armament",
									effects: [{ ...effectData("system.skills.freeSkill.diceBonus", 2), transfer: true }],
								},
								async () => {
									assert.equal(actor.system.skills.freeSkill.diceBonus, 2);
									assertPool(await skillRoll(actor, "freeSkill"), 5, "kh");
								}
							);
							assert.equal(actor.system.skills.freeSkill.diceBonus, 0);
						});
					});

					it("applies advantage after positive and negative bonuses using native normalization", async function () {
						this.timeout(15000);
						await withActor(actorData(type), async (actor) => {
							for (const [bonus, mode, number, modifier] of [
								[1, 0, 3, "kh"],
								[1, 1, 4, "kh"],
								[1, -1, 2, "kh"],
								[-1, 0, 1, null],
								[-2, 0, 2, "kl"],
								[-3, 0, 2, "kl"],
								[-2, 1, 1, null],
								[-1, -1, 2, "kl"],
							]) {
								await actor.update({ "system.skills.will.diceBonus": bonus });
								const roll = await skillRoll(actor, "will", { advantage: mode === 1, disadvantage: mode === -1 });
								assertPool(roll, number, modifier);
							}
							const evaluated = await skillRoll(actor, "will");
							const snapshot = JSON.stringify(evaluated);
							await actor.update({ "system.skills.will.diceBonus": 10 });
							const restored = Roll.fromJSON(snapshot);
							assert.equal(restored.total, evaluated.total);
							assert.equal(restored.formula, evaluated.formula);
						});
					});

					it("preserves dexterity initiative and applies prepared bonuses to weapon attacks", async function () {
						this.timeout(15000);
						await withActor(actorData(type), async (actor) => {
							await actor.update({ "system.skills.initiative.attr": ["int"] });
							await actor.createEmbeddedDocuments("ActiveEffect", [
								effectData("system.attributes.dex.diceBonus", 1),
								effectData("system.skills.initiative.diceBonus", 2),
								effectData("system.skills.fighting.diceBonus", -2),
							]);
							assert.match(actor.getRollData().rollInitiative, /^5d20kh/);
							await withItem(
								actor,
								{
									name: `${prefix} weapon`,
									type: "armament",
									system: {
										numberOfAttacks: 2,
										critical: "20",
										formulas: { attack: { attr: "dex", skill: "fighting", bonus: "4" } },
									},
								},
								async (item) => {
									await withTargets([], async () => {
										const { roll } = await item.rollAttack({});
										assertPool(roll, 1, null);
										assert.equal(roll.data.attackBonus, "4");
										const messages = [...game.messages].filter(
											(m) => m.getFlag("ordemparanormal", "messageRoll")?.itemUuid === item.uuid
										);
										assert.lengthOf(messages, 2);
										for (const message of messages) assertPool(message.rolls[0], 1, null);
									});
								}
							);
						});
					});
				});
			}

			describe("threat shortcut and proficiency overrides", () => {
				it("keeps degree.override and applies bonuses in the registered sheet shortcut", async function () {
					this.timeout(10000);
					await withActor(actorData("threat"), async (actor) => {
						await actor.update({
							"system.skills.will.degree.override": 7,
							"system.attributes.pre.diceBonus": 1,
							"system.skills.will.diceBonus": 2,
						});
						assert.equal((await skillRoll(actor, "will")).data.prof, 7);
						const handler = OrdemThreatSheet.DEFAULT_OPTIONS.actions.onRollSkill;
						await handler.call(
							{ document: actor, actor },
							{ preventDefault() {} },
							{
								dataset: { key: "will", attr: "pre", label: `${prefix} will` },
							}
						);
						const message = [...game.messages].reverse().find((m) => m.flavor?.includes(`${prefix} will`));
						assert.exists(message);
						assertPool(message.rolls[0], 5, "kh");
						assert.include(message.rolls[0].formula, "7");
					});
				});
			});
		},
		{ displayName: "OP | Native dice bonuses" }
	);
});
