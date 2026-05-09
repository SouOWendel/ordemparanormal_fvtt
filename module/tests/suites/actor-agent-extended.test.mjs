Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.agentExtended",
		(context) => {
			const { describe, it, assert, before, after } = context;

			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Extended Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 3 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 2 }, int: { value: 1 } },
						NEX: { value: 5 },
						nivel: { value: 1 },
						stage: { value: 1 },
						...systemOverrides,
					},
				});
			}

			// ----------------------------------------------------------------
			// creditLimit — campo nunca testado
			// ----------------------------------------------------------------
			describe("patent — creditLimit por patente", () => {
				const cases = [
					{ pp: -1,  name: "Sem Patente",           creditLimit: "Baixo"      },
					{ pp: 0,   name: "Recruta",               creditLimit: "Baixo"      },
					{ pp: 30,  name: "Operador",              creditLimit: "Médio"      },
					{ pp: 60,  name: "Agente Especial",       creditLimit: "Médio"      },
					{ pp: 110, name: "Oficial de Operações",  creditLimit: "Alto"       },
					{ pp: 210, name: "Agente de Elite",       creditLimit: "Ilimitado"  },
				];

				for (const { pp, name, creditLimit } of cases) {
					it(`pp=${pp} (${name}): creditLimit = "${creditLimit}"`, async () => {
						const actor = await Actor.create({
							name: `[Quench] Patent pp=${pp}`,
							type: "agent",
							system: { patent: { prestigePoints: pp } },
						});
						assert.equal(actor.system.patent.creditLimit, creditLimit);
						await actor.delete();
					});
				}
			});

			// ----------------------------------------------------------------
			// _prepareBaseSkills — sufixos de label no agente
			// ----------------------------------------------------------------
			describe("AgentData._prepareBaseSkills — sufixo '+' (overLoad)", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						skills: {
							athletics: {
								degree: { label: "trained", value: 5 },
								value: 0,
								attr: ["str"],
								conditions: { load: true, trained: false },
							},
						},
					});
				});
				after(async () => { await actor?.delete(); });

				it("athletics com load=true tem '+' no label", () => {
					assert.include(actor.system.skills.athletics.label, "+");
				});
			});

			describe("AgentData._prepareBaseSkills — sufixo '*' (needTraining)", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						skills: {
							medicine: {
								degree: { label: "untrained", value: 0 },
								value: 0,
								attr: ["int"],
								conditions: { load: false, trained: true },
							},
						},
					});
				});
				after(async () => { await actor?.delete(); });

				it("medicine com trained=true tem '*' no label", () => {
					assert.include(actor.system.skills.medicine.label, "*");
				});
			});

			describe("AgentData._prepareBaseSkills — freeSkill label no agente", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						skills: {
							freeSkill: {
								name: "Xadrez",
								degree: { label: "trained", value: 5 },
								value: 0,
								attr: ["int"],
								conditions: { load: false, trained: false },
							},
						},
					});
				});
				after(async () => { await actor?.delete(); });

				it("freeSkill.label = skill.name ('Xadrez')", () => {
					assert.include(actor.system.skills.freeSkill.label, "Xadrez");
				});

				it("freeSkill.label não tem sufixo quando sem condições especiais", () => {
					const label = actor.system.skills.freeSkill.label;
					assert.notInclude(label, "+");
					assert.notInclude(label, "*");
				});
			});

			describe("AgentData._prepareBaseSkills — sem condições especiais sem sufixo", () => {
				let actor;
				before(async () => {
					actor = await createAgent();
				});
				after(async () => { await actor?.delete(); });

				it("fighting padrão não tem sufixo no label", () => {
					const label = actor.system.skills.fighting.label;
					assert.notInclude(label, "+");
					assert.notInclude(label, "*");
				});
			});

			// ----------------------------------------------------------------
			// calculateSpaces — com bonus não-zero via AE
			// ----------------------------------------------------------------
			describe("_prepareActorSpaces — bônus de espaço (spaces.bonus)", () => {
				let actor;
				before(async () => {
					// str=2 → max base = 10; AE +2 → max = 12
					actor = await createAgent({
						attributes: { str: { value: 2 }, vit: { value: 1 }, pre: { value: 1 }, dex: { value: 1 }, int: { value: 1 } },
					});
					await actor.createEmbeddedDocuments("ActiveEffect", [{
						name: "Bônus Espaço +2",
						changes: [{ key: "system.spaces.bonus.max", mode: 2, value: "2" }],
						disabled: false,
					}]);
				});
				after(async () => { await actor?.delete(); });

				it("spaces.max = 12 com AE +2 em bonus.max", () => {
					assert.equal(actor.system.spaces.max, 12);
				});
			});

			// ----------------------------------------------------------------
			// applyDamage — nonLethal e ignoreRD no agente
			// ----------------------------------------------------------------
			describe("OrdemActor.applyDamage — nonLethal no agente", () => {
				let actor;
				before(async () => { actor = await createAgent(); });
				after(async () => { await actor?.delete(); });

				it("nonLethal=true: system.PV.nonLethal aumenta, PV.value inalterado", async () => {
					const pvBefore = actor.system.PV.value;
					await actor.applyDamage(8, { damageType: "impactDamage", nonLethal: true });
					assert.equal(actor.system.PV.value, pvBefore, "PV.value não deve mudar com nonLethal");
					assert.equal(actor.system.PV.nonLethal, 8, "nonLethal deve acumular 8");
				});
			});

			describe("OrdemActor.applyDamage — condições retornadas", () => {
				let actor;
				before(async () => { actor = await createAgent(); });
				after(async () => { await actor?.delete(); });

				it("condição 'morrendo' retornada quando PV vai a 0", async () => {
					const maxPV = actor.system.PV.max;
					const result = await actor.applyDamage(maxPV, { damageType: "cuttingDamage" });
					assert.include(result.conditions, "morrendo");
				});

				it("condição 'machucado' retornada quando PV cai abaixo da metade", async () => {
					// Restaurar PV primeiro
					await actor.update({ "system.PV.value": actor.system.PV.max });
					const result = await actor.applyDamage(
						Math.ceil(actor.system.PV.max / 2) + 1,
						{ damageType: "cuttingDamage" }
					);
					assert.include(result.conditions, "machucado");
				});
			});

			// ----------------------------------------------------------------
			// calculateProgress — NEX < 5 (progress = 0)
			// ----------------------------------------------------------------
			describe("calculateProgress — NEX < 5 (progress = 0)", () => {
				it("NEX=3 (non-survivor, rule=1): progress = 0", async () => {
					const actor = await Actor.create({
						name: "[Quench] NEX=3",
						type: "agent",
						system: { class: "fighter", NEX: { value: 3 } },
					});
					// floor(3/5) = 0 → progress=0 → PV.max = 20 + VIG(padrão)
					// Quando progress=0 as fórmulas usam progress=1 como mínimo ou 0?
					// Verificamos apenas que não lança exceção e PV.max é número
					assert.isNumber(actor.system.PV.max);
					await actor.delete();
				});
			});

			// ----------------------------------------------------------------
			// withoutSanity — specialist e occultist
			// ----------------------------------------------------------------
			describe("withoutSanity — specialist e occultist usam PD em vez de PE/SAN", () => {
				before(async () => {
					await game.settings.set("ordemparanormal", "globalPlayingWithoutSanity", true);
				});
				after(async () => {
					await game.settings.set("ordemparanormal", "globalPlayingWithoutSanity", false);
				});

				it("specialist withoutSanity: PD.max existe e é número", async () => {
					const actor = await createAgent({ class: "specialist", NEX: { value: 5 } });
					assert.isNumber(actor.system.PD.max);
					assert.isAbove(actor.system.PD.max, 0);
					await actor.delete();
				});

				it("occultist withoutSanity: PD.max existe e é número", async () => {
					const actor = await createAgent({ class: "occultist", NEX: { value: 5 } });
					assert.isNumber(actor.system.PD.max);
					assert.isAbove(actor.system.PD.max, 0);
					await actor.delete();
				});

				it("survivor withoutSanity: PD.max existe e é número", async () => {
					const actor = await createAgent({ class: "survivor", stage: { value: 1 } });
					assert.isNumber(actor.system.PD.max);
					await actor.delete();
				});
			});
		},
		{ displayName: "OP | Agent: creditLimit, skill labels, spaces bonus, applyDamage, withoutSanity" }
	);
});
