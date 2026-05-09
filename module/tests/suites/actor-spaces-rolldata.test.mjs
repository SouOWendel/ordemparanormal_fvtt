Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.spacesAndRollData",
		(context) => {
			const { describe, it, assert, before, after } = context;

			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Spaces/RollData Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 2 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 2 }, int: { value: 1 } },
						NEX: { value: 5 },
						nivel: { value: 1 },
						stage: { value: 1 },
						skills: { initiative: { degree: { label: "trained", value: 5 }, value: 0, mod: 0 } },
						...systemOverrides,
					},
				});
			}

			// ----------------------------------------------------------------
			// spaces — campos completos
			// ----------------------------------------------------------------
			describe("_prepareActorSpaces — campos de espaço", () => {
				let actor;
				before(async () => {
					// str=2 → max = 2*5 = 10 espaços; sem itens equipados → weight=0
					actor = await createAgent({ attributes: { str: { value: 2 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, int: { value: 1 } } });
				});
				after(async () => { await actor?.delete(); });

				it("spaces.max = STR(2) × 5 = 10", () => {
					assert.equal(actor.system.spaces.max, 10);
				});
				it("spaces.value = 0 (sem itens equipados)", () => {
					assert.equal(actor.system.spaces.value, 0);
				});
				it("spaces.pct = 0% (sem carga)", () => {
					assert.equal(actor.system.spaces.pct, 0);
				});
				it("spaces.over = 0 (não sobrecarregado)", () => {
					assert.equal(actor.system.spaces.over, 0);
				});
				it("spaces.pctMax é número", () => {
					assert.isNumber(actor.system.spaces.pctMax);
				});
			});

			describe("_prepareActorSpaces — STR=0 fallback", () => {
				let actor;
				before(async () => {
					actor = await createAgent({ attributes: { str: { value: 0 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, int: { value: 1 } } });
				});
				after(async () => { await actor?.delete(); });

				it("spaces.max = 2 quando STR=0 (fallback)", () => {
					assert.equal(actor.system.spaces.max, 2);
				});
			});

			describe("_prepareActorSpaces — sobrecarga com item equipado", () => {
				let actor;
				before(async () => {
					// str=1 → max=5; adicionar item peso 10 → sobrecarregado
					actor = await createAgent({
						attributes: { str: { value: 1 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, int: { value: 1 } },
					});
					await actor.createEmbeddedDocuments("Item", [{
						name: "[Quench] Heavy Item",
						type: "armament",
						system: { weight: 10, quantity: 1, using: { state: true } },
					}]);
				});
				after(async () => { await actor?.delete(); });

				it("spaces.value = 10 (peso do item)", () => {
					assert.equal(actor.system.spaces.value, 10);
				});
				it("desloc.value reduzido em 3 por sobrecarga", () => {
					// Deslocamento padrão é 9; sobrecarga -3 = 6
					assert.equal(actor.system.desloc.value, 6);
				});
				it("defense.value reduzido em 5 por sobrecarga (+ AGI)", () => {
					// base 10 - 5 sobrecarga + AGI(1) = 6
					assert.equal(actor.system.defense.value, 6);
				});
			});

			describe("_prepareActorSpaces — bonus de espaço via mochila", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						attributes: { str: { value: 2 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, int: { value: 1 } },
					});
					// Mochila militar: +2 espaços via AE
					await actor.createEmbeddedDocuments("Item", [{
						name: "[Quench] Mochila Militar",
						type: "generalEquipment",
						system: { weight: 0, quantity: 1, using: { state: true } },
						effects: [{
							name: "Mochila +2 espaços",
							changes: [{ key: "system.spaces.bonus.max", mode: 2, value: "2" }],
							disabled: false,
						}],
					}]);
				});
				after(async () => { await actor?.delete(); });

				it("spaces.max = 12 com bônus de +2 da mochila", () => {
					assert.equal(actor.system.spaces.max, 12);
				});
			});

			// ----------------------------------------------------------------
			// getRollData — rollInitiative
			// ----------------------------------------------------------------
			describe("OrdemActor.getRollData — rollInitiative", () => {
				let actor;
				before(async () => {
					// dex=3 → fórmula base "3d20kh"
					actor = await createAgent({
						attributes: { str: { value: 1 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 3 }, int: { value: 1 } },
						skills: { initiative: { degree: { label: "untrained", value: 0 }, value: 0, mod: 0 } },
					});
				});
				after(async () => { await actor?.delete(); });

				it("rollInitiative contém '3d20kh' para AGI=3", () => {
					const data = actor.getRollData();
					assert.include(data.rollInitiative, "3d20kh");
				});
				it("rollInitiative existe e é string", () => {
					const data = actor.getRollData();
					assert.isString(data.rollInitiative);
				});
			});

			describe("OrdemActor.getRollData — rollInitiative com AGI=0", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						attributes: { str: { value: 1 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 0 }, int: { value: 1 } },
					});
				});
				after(async () => { await actor?.delete(); });

				it("rollInitiative contém '2d20kl' para AGI=0", () => {
					const data = actor.getRollData();
					assert.include(data.rollInitiative, "2d20kl");
				});
			});

			describe("OrdemActor.getRollData — bônus de iniciativa por grau", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						attributes: { str: { value: 1 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 2 }, int: { value: 1 } },
						skills: { initiative: { degree: { label: "trained", value: 5 }, value: 0, mod: 2 } },
					});
				});
				after(async () => { await actor?.delete(); });

				it("rollInitiative inclui bônus de grau (5) + mod (2) = '+ 7'", () => {
					const data = actor.getRollData();
					// degree=5, mod=2 → bonus=7
					assert.include(data.rollInitiative, "+ 7");
				});
			});

			describe("OrdemActor.getRollData — chaves de AE disponíveis", () => {
				let actor;
				before(async () => {
					actor = await createAgent();
				});
				after(async () => { await actor?.delete(); });

				it("getRollData contém chave NEX", () => {
					assert.property(actor.getRollData(), "NEX");
				});
				it("getRollData contém chave PV", () => {
					assert.property(actor.getRollData(), "PV");
				});
				it("getRollData contém chave PE", () => {
					assert.property(actor.getRollData(), "PE");
				});
				it("getRollData contém chave SAN", () => {
					assert.property(actor.getRollData(), "SAN");
				});
				it("getRollData contém chave defense", () => {
					assert.property(actor.getRollData(), "defense");
				});
			});
		},
		{ displayName: "OP | Actor: spaces & getRollData" }
	);
});
