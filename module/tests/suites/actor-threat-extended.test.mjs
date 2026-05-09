Hooks.once("quenchReady", (quench) => {
	quench.registerBatch(
		"ordemparanormal.actor.threatExtended",
		(context) => {
			const { describe, it, assert, before, after } = context;

			async function createThreat(systemOverrides = {}) {
				return Actor.create({
					name: "[Quench] Extended Threat",
					type: "threat",
					system: {
						attributes: {
							hp: { value: 30, max: 30 },
							dex: { value: 2 },
							int: { value: 1 },
							pre: { value: 2 },
							str: { value: 3 },
							vit: { value: 2 },
						},
						skills: {
							fighting:   { degree: { label: "trained",  value: 5  }, value: 2, attr: ["str"] },
							aim:        { degree: { label: "veteran",  value: 10 }, value: 0, attr: ["dex"] },
							resilience: { degree: { label: "expert",   value: 15 }, value: 0, attr: ["vit"] },
							reflexes:   { degree: { label: "trained",  value: 5  }, value: 1, attr: ["dex"] },
							will:       { degree: { label: "untrained",value: 0  }, value: 0, attr: ["pre"] },
							initiative: { degree: { label: "trained",  value: 5  }, value: 0, attr: ["dex"] },
							perception: { degree: { label: "veteran",  value: 10 }, value: 3, attr: ["pre"] },
							freeSkill:  { name: "Intimidação", degree: { label: "expert", value: 15 }, value: 0, attr: ["pre"] },
						},
						elements: { main: "blood", others: "" },
						disturbingPresence: { dt: 14, mentalDamage: "1d6", immuneNex: 25 },
						defense: { value: 14, skillResistances: [], damageResistances: "" },
						resistances: {
							cuttingDamage:    { value: 3, vulnerable: false, immune: false },
							ballisticDamage:  { value: 0, vulnerable: false, immune: false },
							fireDamage:       { value: 0, vulnerable: true,  immune: false },
							deathDamage:      { value: 0, vulnerable: false, immune: true  },
						},
						...systemOverrides,
					},
				});
			}

			// ----------------------------------------------------------------
			// Skills que faltavam: resilience, reflexes, will, initiative, perception
			// ----------------------------------------------------------------
			describe("ThreatData._prepareBaseSkills — todas as perícias", () => {
				let threat;
				before(async () => { threat = await createThreat(); });
				after(async () => { await threat?.delete(); });

				it("resilience degree 'expert' → degree.value = 15", () => {
					assert.equal(threat.system.skills.resilience.degree.value, 15);
				});
				it("reflexes degree 'trained' → degree.value = 5", () => {
					assert.equal(threat.system.skills.reflexes.degree.value, 5);
				});
				it("will degree 'untrained' → degree.value = 0", () => {
					assert.equal(threat.system.skills.will.degree.value, 0);
				});
				it("initiative degree 'trained' → degree.value = 5", () => {
					assert.equal(threat.system.skills.initiative.degree.value, 5);
				});
				it("perception degree 'veteran' → degree.value = 10", () => {
					assert.equal(threat.system.skills.perception.degree.value, 10);
				});
			});

			// ----------------------------------------------------------------
			// defaultAttrs — atribuição automática de attr
			// ----------------------------------------------------------------
			describe("ThreatData._prepareBaseSkills — defaultAttrs auto-assignment", () => {
				let threat;
				before(async () => {
					// Cria skill sem attr definido para forçar o defaultAttrs
					threat = await createThreat({
						skills: {
							fighting:   { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							aim:        { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							resilience: { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							reflexes:   { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							will:       { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							initiative: { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							perception: { degree: { label: "trained", value: 5 }, value: 0, attr: [] },
							freeSkill:  { name: "Teste", degree: { label: "untrained", value: 0 }, value: 0, attr: [] },
						},
					});
				});
				after(async () => { await threat?.delete(); });

				it("fighting sem attr recebe attr=['str'] do defaultAttrs", () => {
					assert.include(threat.system.skills.fighting.attr, "str");
				});
				it("aim sem attr recebe attr=['dex'] do defaultAttrs", () => {
					assert.include(threat.system.skills.aim.attr, "dex");
				});
				it("resilience sem attr recebe attr=['vit'] do defaultAttrs", () => {
					assert.include(threat.system.skills.resilience.attr, "vit");
				});
				it("reflexes sem attr recebe attr=['dex'] do defaultAttrs", () => {
					assert.include(threat.system.skills.reflexes.attr, "dex");
				});
				it("will sem attr recebe attr=['pre'] do defaultAttrs", () => {
					assert.include(threat.system.skills.will.attr, "pre");
				});
				it("initiative sem attr recebe attr=['dex'] do defaultAttrs", () => {
					assert.include(threat.system.skills.initiative.attr, "dex");
				});
				it("perception sem attr recebe attr=['pre'] do defaultAttrs", () => {
					assert.include(threat.system.skills.perception.attr, "pre");
				});
			});

			// ----------------------------------------------------------------
			// freeSkill — label vem de skill.name
			// ----------------------------------------------------------------
			describe("ThreatData._prepareBaseSkills — freeSkill.label", () => {
				let threat;
				before(async () => { threat = await createThreat(); });
				after(async () => { await threat?.delete(); });

				it("freeSkill.label = skill.name quando nome está definido", () => {
					assert.equal(threat.system.skills.freeSkill.label, "Intimidação");
				});
			});

			// ----------------------------------------------------------------
			// elements — persistência
			// ----------------------------------------------------------------
			describe("ThreatData — elements.main e elements.others", () => {
				let threat;
				before(async () => { threat = await createThreat(); });
				after(async () => { await threat?.delete(); });

				it("elements.main persiste como 'blood'", () => {
					assert.equal(threat.system.elements.main, "blood");
				});
				it("elements.others persiste como string vazia por padrão", () => {
					assert.equal(threat.system.elements.others, "");
				});

				it("elements.main pode ser atualizado via update()", async () => {
					await threat.update({ "system.elements.main": "death" });
					assert.equal(threat.system.elements.main, "death");
				});
			});

			// ----------------------------------------------------------------
			// disturbingPresence — campos
			// ----------------------------------------------------------------
			describe("ThreatData — disturbingPresence", () => {
				let threat;
				before(async () => { threat = await createThreat(); });
				after(async () => { await threat?.delete(); });

				it("disturbingPresence.dt persiste como 14", () => {
					assert.equal(threat.system.disturbingPresence.dt, 14);
				});
				it("disturbingPresence.mentalDamage persiste como '1d6'", () => {
					assert.equal(threat.system.disturbingPresence.mentalDamage, "1d6");
				});
				it("disturbingPresence.immuneNex persiste como 25", () => {
					assert.equal(threat.system.disturbingPresence.immuneNex, 25);
				});
			});

			// ----------------------------------------------------------------
			// resistances — campos extras (vulnerable, immune)
			// ----------------------------------------------------------------
			describe("ThreatData — resistances vulnerable e immune", () => {
				let threat;
				before(async () => { threat = await createThreat(); });
				after(async () => { await threat?.delete(); });

				it("fireDamage.vulnerable persiste como true", () => {
					assert.isTrue(threat.system.resistances.fireDamage.vulnerable);
				});
				it("deathDamage.immune persiste como true", () => {
					assert.isTrue(threat.system.resistances.deathDamage.immune);
				});
				it("cuttingDamage.value persiste como 3", () => {
					assert.equal(threat.system.resistances.cuttingDamage.value, 3);
				});
			});

			// ----------------------------------------------------------------
			// applyDamage — integração com ameaça
			// ----------------------------------------------------------------
			describe("OrdemActor.applyDamage — ameaça (usa attributes.hp)", () => {
				let threat;
				before(async () => { threat = await createThreat(); });
				after(async () => { await threat?.delete(); });

				it("applyDamage reduz hp da ameaça", async () => {
					const hpBefore = threat.system.attributes.hp.value;
					await threat.applyDamage(10, { damageType: "cuttingDamage" });
					// RD cutting=3 → finalDamage=7
					assert.equal(threat.system.attributes.hp.value, hpBefore - 7);
				});

				it("applyDamage com ignoreRD=true ignora resistência", async () => {
					const hpBefore = threat.system.attributes.hp.value;
					await threat.applyDamage(5, { damageType: "cuttingDamage", ignoreRD: true });
					assert.equal(threat.system.attributes.hp.value, hpBefore - 5);
				});
			});
		},
		{ displayName: "OP | Threat: skills estendidas, elements, disturbingPresence, applyDamage" }
	);
});
