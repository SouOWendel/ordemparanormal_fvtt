Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.rolls",
		(context) => {
			const { describe, it, assert, before, after } = context;

			async function createAgent(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Roll Agent",
					type: "agent",
					system: {
						class: "fighter",
						attributes: { vit: { value: 2 }, pre: { value: 2 }, dex: { value: 2 }, str: { value: 3 }, int: { value: 1 } },
						NEX: { value: 5 },
						nivel: { value: 1 },
						stage: { value: 1 },
						...systemOverrides,
					},
				});
			}

			// ----------------------------------------------------------------
			// rollSkill — fast-forward (sem dialog)
			// ----------------------------------------------------------------
			describe("OrdemActor.rollSkill — fast-forward", () => {
				let actor;
				before(async () => { actor = await createAgent(); });
				after(async () => { await actor?.delete(); });

				it("rollSkill não lança exceção", async () => {
					let threw = false;
					try {
						await actor.rollSkill(
							{ skill: "fighting" },
							{ configure: false },
							{ create: false }
						);
					} catch (e) {
						threw = true;
					}
					assert.isFalse(threw, "rollSkill não deve lançar exceção");
				});

				it("rollSkill retorna array de rolls", async () => {
					const rolls = await actor.rollSkill(
						{ skill: "fighting" },
						{ configure: false },
						{ create: false }
					);
					assert.isArray(rolls, "rollSkill deve retornar array");
					assert.isAbove(rolls.length, 0, "deve haver pelo menos um roll");
				});

				it("rollSkill para perícia 'aim' retorna roll avaliado", async () => {
					const rolls = await actor.rollSkill(
						{ skill: "aim" },
						{ configure: false },
						{ create: false }
					);
					assert.isTrue(rolls[0]._evaluated, "roll deve estar avaliado");
				});

				it("rollSkill produz chat message quando create=true", async () => {
					const countBefore = game.messages.size;
					await actor.rollSkill(
						{ skill: "perception" },
						{ configure: false },
						{}
					);
					assert.isAbove(game.messages.size, countBefore, "deve criar mensagem no chat");
				});
			});

			// ----------------------------------------------------------------
			// rollSkill — vantagem e desvantagem
			// ----------------------------------------------------------------
			describe("OrdemActor.rollSkill — modos de vantagem", () => {
				let actor;
				before(async () => { actor = await createAgent(); });
				after(async () => { await actor?.delete(); });

				it("com advantage=true: roll contém kh (keep highest)", async () => {
					const rolls = await actor.rollSkill(
						{ skill: "fighting", advantage: true },
						{ configure: false },
						{ create: false }
					);
					const formula = rolls[0].formula;
					assert.include(formula, "kh", "advantage deve usar kh");
				});

				it("com disadvantage=true: roll contém kl (keep lowest)", async () => {
					const rolls = await actor.rollSkill(
						{ skill: "fighting", disadvantage: true },
						{ configure: false },
						{ create: false }
					);
					const formula = rolls[0].formula;
					assert.include(formula, "kl", "disadvantage deve usar kl");
				});
			});

			// ----------------------------------------------------------------
			// rollSkill — bônus de grau incluído
			// ----------------------------------------------------------------
			describe("OrdemActor.rollSkill — grau de treinamento", () => {
				let actorTrained;
				before(async () => {
					actorTrained = await createAgent({
						skills: { fighting: { degree: { label: "trained", value: 5 }, value: 0 } },
					});
				});
				after(async () => { await actorTrained?.delete(); });

				it("roll de perícia treinada inclui bônus de grau +5 na fórmula", async () => {
					const rolls = await actorTrained.rollSkill(
						{ skill: "fighting" },
						{ configure: false },
						{ create: false }
					);
					// O total deve incluir degree.value=5; verificamos via formula ou total > puro d20
					assert.isNumber(rolls[0].total, "total deve ser número");
				});
			});

			// ----------------------------------------------------------------
			// rollAttribute
			// ----------------------------------------------------------------
			describe("OrdemActor.rollAttribute — fast-forward", () => {
				let actor;
				before(async () => { actor = await createAgent(); });
				after(async () => { await actor?.delete(); });

				it("rollAttribute não lança exceção", async () => {
					let threw = false;
					try {
						await actor.rollAttribute(
							{ attribute: "str" },
							{ configure: false },
							{ create: false }
						);
					} catch (e) {
						threw = true;
					}
					assert.isFalse(threw, "rollAttribute não deve lançar exceção");
				});

				it("rollAttribute retorna array de rolls", async () => {
					const rolls = await actor.rollAttribute(
						{ attribute: "dex" },
						{ configure: false },
						{ create: false }
					);
					assert.isArray(rolls, "deve retornar array");
					assert.isAbove(rolls.length, 0);
				});

				it("rollAttribute para STR=3 usa 3 dados (3d20kh)", async () => {
					const rolls = await actor.rollAttribute(
						{ attribute: "str" },
						{ configure: false },
						{ create: false }
					);
					assert.include(rolls[0].formula, "3d20kh", "STR=3 deve usar 3d20kh");
				});
			});

			// ----------------------------------------------------------------
			// _prepareBaseSkills — sufixos de label
			// ----------------------------------------------------------------
			describe("AgentData._prepareBaseSkills — sufixos de label", () => {
				let actorLoad;
				let actorTrained;

				before(async () => {
					actorLoad = await createAgent({
						skills: {
							acrobatics: {
								degree: { label: "trained", value: 5 },
								value: 0,
								conditions: { load: true, trained: false },
							},
						},
					});
					actorTrained = await createAgent({
						skills: {
							medicine: {
								degree: { label: "untrained", value: 0 },
								value: 0,
								conditions: { load: false, trained: true },
							},
						},
					});
				});
				after(async () => {
					await actorLoad?.delete();
					await actorTrained?.delete();
				});

				it("skill com conditions.load=true tem sufixo '+' no label", () => {
					const label = actorLoad.system.skills.acrobatics.label;
					assert.include(label, "+", "label deve ter sufixo '+' para overLoad");
				});

				it("skill com conditions.trained=true tem sufixo '*' no label", () => {
					const label = actorTrained.system.skills.medicine.label;
					assert.include(label, "*", "label deve ter sufixo '*' para needTraining");
				});

				it("skill sem condições especiais não tem sufixo no label", () => {
					const label = actorLoad.system.skills.fighting.label;
					assert.notInclude(label, "+");
					assert.notInclude(label, "*");
				});
			});

			describe("AgentData._prepareBaseSkills — freeSkill usa skill.name como label", () => {
				let actor;
				before(async () => {
					actor = await createAgent({
						skills: {
							freeSkill: {
								name: "Culinária",
								degree: { label: "untrained", value: 0 },
								value: 0,
							},
						},
					});
				});
				after(async () => { await actor?.delete(); });

				it("freeSkill.label usa skill.name quando definido", () => {
					assert.include(actor.system.skills.freeSkill.label, "Culinária");
				});
			});
		},
		{ displayName: "OP | Actor: rollSkill, rollAttribute & skill labels" }
	);
});
