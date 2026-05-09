Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.item.damageRolls",
		(context) => {
			const { describe, it, assert, before, after } = context;

			async function createAgentWithSword(swordOverrides = {}) {
				const actor = await Actor.create({
					name: "[Quench] Damage Roll Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 2 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 3 }, int: { value: 1 } },
						NEX: { value: 5 },
					},
				});
				const [item] = await actor.createEmbeddedDocuments("Item", [{
					name: "[Quench] Test Sword",
					type: "armament",
					system: {
						proficiency: "simple",
						rangeType: "melee",
						formulas: {
							attack: { attr: "str", skill: "fighting", bonus: 0 },
							damage: { formula: "1d8", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
							extraFormula: "",
						},
						critical: "20",
						weight: 1,
						quantity: 1,
						using: { state: true },
						...swordOverrides,
					},
				}]);
				return { actor, item };
			}

			// ----------------------------------------------------------------
			// rollDamage — caminho básico
			// ----------------------------------------------------------------
			describe("OrdemItem.rollDamage — básico", () => {
				let actor;
				let item;
				before(async () => {
					({ actor, item } = await createAgentWithSword());
				});
				after(async () => { await actor?.delete(); });

				it("rollDamage não lança exceção", async () => {
					let threw = false;
					try {
						await item.rollDamage({ event: { altKey: false }, critical: false });
					} catch (e) {
						threw = true;
					}
					assert.isFalse(threw, "rollDamage não deve lançar exceção");
				});

				it("rollDamage retorna Roll avaliado", async () => {
					const roll = await item.rollDamage({ event: { altKey: false }, critical: false });
					assert.exists(roll, "deve retornar um roll");
					assert.isTrue(roll._evaluated, "roll deve estar avaliado");
				});

				it("rollDamage total é número positivo", async () => {
					const roll = await item.rollDamage({ event: { altKey: false }, critical: false });
					assert.isNumber(roll.total);
					assert.isAbove(roll.total, 0);
				});

				it("rollDamage produz chat message no log", async () => {
					const countBefore = game.messages.size;
					await item.rollDamage({ event: { altKey: false }, critical: false });
					assert.isAbove(game.messages.size, countBefore, "deve criar mensagem no chat");
				});
			});

			// ----------------------------------------------------------------
			// rollDamage — atributo do ator somado
			// ----------------------------------------------------------------
			describe("OrdemItem.rollDamage — bônus de atributo STR", () => {
				let actor;
				let item;
				before(async () => {
					// STR=3, arma 1d8+STR → total mínimo é 1d8+3 = 4
					({ actor, item } = await createAgentWithSword({ formulas: { damage: { formula: "1d8", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] } } }));
				});
				after(async () => { await actor?.delete(); });

				it("rollDamage com STR=3 produz total >= 4 (1d8 mínimo 1 + STR 3)", async () => {
					const roll = await item.rollDamage({ event: { altKey: false }, critical: false });
					assert.isAtLeast(roll.total, 4, "total deve ser pelo menos 1 (dado mínimo) + 3 (STR)");
				});
			});

			// ----------------------------------------------------------------
			// rollDamage — multiplicador de crítico
			// ----------------------------------------------------------------
			describe("OrdemItem.rollDamage — crítico dobra os dados", () => {
				let actor;
				let item;
				before(async () => {
					({ actor, item } = await createAgentWithSword());
				});
				after(async () => { await actor?.delete(); });

				it("com isCritical=true e lastId=true: fórmula usa 2d8 (dobro dos dados)", async () => {
					const criticalStatus = { isCritical: true, multiplier: 2, margin: 20 };
					const roll = await item.rollDamage({
						event: { altKey: false },
						critical: criticalStatus,
						lastId: true,
					});
					// 2d8 mínimo é 2; STR=3 → total >= 5
					assert.isAtLeast(roll.total, 2, "crítico deve dobrar os dados (2d8 mínimo=2)");
					assert.include(roll.formula, "2d8", "fórmula deve conter 2d8 para crítico x2");
				});
			});

			// ----------------------------------------------------------------
			// rollDamage — parts adicionais
			// ----------------------------------------------------------------
			describe("OrdemItem.rollDamage — partes adicionais de dano", () => {
				let actor;
				let item;
				before(async () => {
					({ actor, item } = await createAgentWithSword({
						formulas: {
							damage: {
								formula: "1d6",
								attr: "str",
								type: "cuttingDamage",
								bonus: 0,
								parts: [["1d4", "fireDamage"]],
							},
						},
					}));
				});
				after(async () => { await actor?.delete(); });

				it("rollDamage com parts=[1d4 fogo]: total >= 2 (1d6 min 1 + 1d4 min 1)", async () => {
					const roll = await item.rollDamage({ event: { altKey: false }, critical: false });
					// 1d6 mínimo 1 + STR 3 + 1d4 mínimo 1 = 5
					assert.isAtLeast(roll.total, 2);
				});
			});

			// ----------------------------------------------------------------
			// rollFormula — fórmula extra
			// ----------------------------------------------------------------
			describe("OrdemItem.rollFormula — fórmula extra", () => {
				let actor;
				let item;
				before(async () => {
					({ actor, item } = await createAgentWithSword({
						formulas: {
							attack: { attr: "str", skill: "fighting", bonus: 0 },
							damage: { formula: "1d8", attr: "str", type: "cuttingDamage", bonus: 0, parts: [] },
							extraFormula: "2d6",
						},
					}));
				});
				after(async () => { await actor?.delete(); });

				it("rollFormula não lança exceção quando extraFormula='2d6'", async () => {
					let threw = false;
					try {
						await item.rollFormula();
					} catch (e) {
						threw = true;
					}
					assert.isFalse(threw, "rollFormula não deve lançar exceção");
				});

				it("rollFormula retorna Roll avaliado", async () => {
					const roll = await item.rollFormula();
					assert.isTrue(roll._evaluated, "roll deve estar avaliado");
					assert.isNumber(roll.total);
				});
			});

			// ----------------------------------------------------------------
			// isCritical — bugs corrigidos (null e fórmula vazia)
			// ----------------------------------------------------------------
			describe("OrdemItem.isCritical — bugs corrigidos", () => {
				let item;
				before(async () => {
					item = await Item.create({ name: "[Quench] isCritical Bug Fixes", type: "armament" });
				});
				after(async () => { await item?.delete(); });

				it("fórmula vazia: não lança exceção", () => {
					assert.doesNotThrow(() => {
						item.isCritical({ crtalFormula: "", roll: { result: "20" } });
					});
				});

				it("fórmula vazia: usa margin=20 e multiplier=2 (defaults)", () => {
					const result = item.isCritical({ crtalFormula: "", roll: { result: "20" } });
					assert.equal(result.margin, 20);
					assert.equal(result.multiplier, 2);
				});

				it("fórmula vazia: isCritical=true para roll=20, isCritical=false para roll=19", () => {
					const hit = item.isCritical({ crtalFormula: "", roll: { result: "20" } });
					const miss = item.isCritical({ crtalFormula: "", roll: { result: "19" } });
					assert.isTrue(hit.isCritical, "roll 20 deve ser crítico com margem default 20");
					assert.isFalse(miss.isCritical, "roll 19 não deve ser crítico com margem default 20");
				});

				it("fórmula null: não lança exceção (guarda de null)", () => {
					assert.doesNotThrow(() => {
						item.isCritical({ crtalFormula: null, roll: { result: "20" } });
					});
				});

				it("fórmula null: usa defaults margin=20, multiplier=2", () => {
					const result = item.isCritical({ crtalFormula: null, roll: { result: "20" } });
					assert.equal(result.margin, 20);
					assert.equal(result.multiplier, 2);
				});
			});
		},
		{ displayName: "OP | Item: rollDamage, rollFormula & isCritical bugs" }
	);
});
