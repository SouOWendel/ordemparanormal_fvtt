export const op = {};

// Define constants here, such as:
op.foobar = {
	bas: 'op.bas',
	bar: 'op.bar',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.base = {
	PV: 'op.PV',
	PE: 'op.PE',
	San: 'op.San',
	NEX: 'op.NEX',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.attributes = {
	dex: 'op.attDex',
	int: 'op.attInt',
	vit: 'op.attVit',
	pre: 'op.attPre',
	str: 'op.attStr',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.skills = {
	acrobatics: 'op.skill.acrobatics',
	animal: 'op.skill.animal',
	arts: 'op.skill.arts',
	athleticism: 'op.skill.athleticism',
	relevance: 'op.skill.relevance',
	sciences: 'op.skill.sciences',
	crime: 'op.skill.crime',
	diplomacy: 'op.skill.diplomacy',
	deception: 'op.skill.deception',
	resilience: 'op.skill.resilience',
	stealth: 'op.skill.stealth',
	initiative: 'op.skill.initiative',
	intimidation: 'op.skill.intimidation',
	intuition: 'op.skill.intuition',
	investigation: 'op.skill.investigation',
	fighting: 'op.skill.fighting',
	medicine: 'op.skill.medicine',
	occultism: 'op.skill.occultism',
	perception: 'op.skill.perception',
	driving: 'op.skill.driving',
	aim: 'op.skill.aim',
	reflexes: 'op.skill.reflexes',
	religion: 'op.skill.religion',
	survival: 'op.skill.survival',
	tactics: 'op.skill.tactics',
	technology: 'op.skill.technology',
	will: 'op.skill.will',
	freeSkill: 'op.skill.freeSkill'
};

op.attackSkills = {
	fighting: 'op.skill.fighting',
	aim: 'op.skill.aim',
	deception: 'op.skill.deception',
	occultism: 'op.skill.occultism',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownDegree = {
	untrained: 'op.degreeTrainingChoices.dest',
	trained: 'op.degreeTrainingChoices.trei',
	veteran: 'op.degreeTrainingChoices.vet',
	expert: 'op.degreeTrainingChoices.expe',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownClass = {
	fighter: 'op.classChoices.fighter',
	specialist: 'op.classChoices.specialist',
	occultist: 'op.classChoices.occultist',
	survivor: 'op.classChoices.survivor'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownTrilha = {
	fighter: [
		{name: 'agenteSecreto', label: 'op.trilhas.agenteSecreto'},
		{name: 'aniquilador', label: 'op.trilhas.aniquilador'},
		{name: 'cacador', label: 'op.trilhas.cacador'},
		{name: 'comanDeCamp', label: 'op.trilhas.comandanteDeCampo'},
		{name: 'guerreiro', label: 'op.trilhas.guerreiro'},
		{name: 'monstruoso', label: 'op.trilhas.monstruoso'},
		{name: 'opeEspeciais', label: 'op.trilhas.operacoesEspeciais'},
		{name: 'tropaChoque', label: 'op.trilhas.tropaDeChoque'},
	],
	specialist: [
		{name: 'atiradorElite', label: 'op.trilhas.atiradorDeElite'},
		{name: 'bibliotecario', label: 'op.trilhas.bibliotecario'},
		{name: 'infiltrador', label: 'op.trilhas.infiltrador'},
		{name: 'medicoCampo', label: 'op.trilhas.medicoDeCampo'},
		{name: 'muambeiro', label: 'op.trilhas.muambeiro'},
		{name: 'negociador', label: 'op.trilhas.negociador'},
		{name: 'perseverante', label: 'op.trilhas.perseverante'},
		{name: 'tecnico', label: 'op.trilhas.tecnico'},
	],
	occultist: [
		{name: 'conduite', label: 'op.trilhas.conduite'},
		{name: 'exorcista', label: 'op.trilhas.exorcista'},
		{name: 'flagelador', label: 'op.trilhas.flagelador'},
		{name: 'graduado', label: 'op.trilhas.graduado'},
		{name: 'intuitivo', label: 'op.trilhas.intuitivo'},
		{name: 'laminaParanormal', label: 'op.trilhas.laminaParanormal'},
		{name: 'parapsicologo', label: 'op.trilhas.parapsicologo'},
		{name: 'possuido', label: 'op.trilhas.possuido'},
	],
	survivor: [
		{name: 'durao', label: 'op.trilhas.durao'},
		{name: 'esperto', label: 'op.trilhas.esperto'},
		{name: 'esoterico', label: 'op.trilhas.esoterico'},
	],
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownOrigins = {
	academico: 'op.originsChoices.academico',
	agenteDeSaude: 'op.originsChoices.agenteDeSaude',
	amigoDosAnimais: 'op.originsChoices.amigoDosAnimais',
	amnesico: 'op.originsChoices.amnesico',
	artista: 'op.originsChoices.artista',
	astronauta: 'op.originsChoices.astronauta',
	atleta: 'op.originsChoices.atleta',
	chefDoOutroLado: 'op.originsChoices.chefDoOutroLado',
	chef: 'op.originsChoices.chef',
	colegial: 'op.originsChoices.colegial',
	cosplayer: 'op.originsChoices.cosplayer',
	criminoso: 'op.originsChoices.criminoso',
	cultistaArrependido: 'op.originsChoices.cultistaArrependido',
	desgarrado: 'op.originsChoices.desgarrado',
	diplomata: 'op.originsChoices.diplomata',
	engenheiro: 'op.originsChoices.engenheiro',
	executivo: 'op.originsChoices.executivo',
	explorador: 'op.originsChoices.explorador',
	experimento: 'op.originsChoices.experimento',
	fanaticoPorCriaturas: 'op.originsChoices.fanaticoPorCriaturas',
	fotografo: 'op.originsChoices.fotografo',
	inventorParanormal: 'op.originsChoices.inventorParanormal',
	investigador: 'op.originsChoices.investigador',
	jovemMistico: 'op.originsChoices.jovemMistico',
	legistaDoTurnoDaNoite: 'op.originsChoices.legistaDoTurnoDaNoite',
	lutador: 'op.originsChoices.lutador',
	magnata: 'op.originsChoices.magnata',
	mateiro: 'op.originsChoices.mateiro',
	mercenario: 'op.originsChoices.mercenario',
	mergulhador: 'op.originsChoices.mergulhador',
	militar: 'op.originsChoices.militar',
	motorista: 'op.originsChoices.motorista',
	nerdEntusiasta: 'op.originsChoices.nerdEntusiasta',
	operario: 'op.originsChoices.operario',
	policial: 'op.originsChoices.policial',
	profetizado: 'op.originsChoices.profetizado',
	psicologo: 'op.originsChoices.psicologo',
	religioso: 'op.originsChoices.religioso',
	reporterInvestigativo: 'op.originsChoices.reporterInvestigativo',
	servidorPublico: 'op.originsChoices.servidorPublico',
	teóricoDaConspiracao: 'op.originsChoices.teóricoDaConspiracao',
	'TI.': 'op.originsChoices.TI',
	trabalhadorRural: 'op.originsChoices.trabalhadorRural',
	trambiqueiro: 'op.originsChoices.trambiqueiro',
	universitario: 'op.originsChoices.universitario',
	vítima: 'op.originsChoices.vítima',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownWeaponType = {
	melee: 'op.weaponTypeChoices.melee',
	ranged: 'op.weaponTypeChoices.ranged',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownWeaponSubType = {
	// 'throw': 'op.weaponSubTypeChoices.throw',
	shoot: 'op.weaponSubTypeChoices.shoot',
	fire: 'op.weaponSubTypeChoices.fire',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownWeaponGripType = {
	light: 'op.weaponGripTypeChoices.light',
	oneHand: 'op.weaponGripTypeChoices.oneHand',
	twoHands: 'op.weaponGripTypeChoices.twoHands',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownWeaponAmmunition = {
	shortBullets: 'op.weaponAmmunitionChoices.shortBullets',
	longBullets: 'op.weaponAmmunitionChoices.longBullets',
	fuel: 'op.weaponAmmunitionChoices.fuel',
	arrows: 'op.weaponAmmunitionChoices.arrows',
	rocket: 'op.weaponAmmunitionChoices.rocket',
	cartridge: 'op.weaponAmmunitionChoices.cartridge',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownProficiency = {
	simpleWeapons: 'op.proficiencyChoices.simpleWeapons',
	tacticalWeapons: 'op.proficiencyChoices.tacticalWeapons',
	heavyWeapons: 'op.proficiencyChoices.heavyWeapons',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownDamageType = {
	cuttingDamage: 'op.damageTypeChoices.cuttingDamage',
	impactDamage: 'op.damageTypeChoices.impactDamage',
	piercingDamage: 'op.damageTypeChoices.piercingDamage',
	ballisticDamage: 'op.damageTypeChoices.ballisticDamage',
	bloodDamage: 'op.damageTypeChoices.bloodDamage',
	deathDamage: 'op.damageTypeChoices.deathDamage',
	knowledgeDamage: 'op.damageTypeChoices.knowledgeDamage',
	energyDamage: 'op.damageTypeChoices.energyDamage',
	fearDamage: 'op.damageTypeChoices.fearDamage'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownPowerType = {
	class: 'op.powerTypeChoices.class',
	paranormal: 'op.powerTypeChoices.paranormal',
	path: 'op.powerTypeChoices.path',
	origin: 'op.powerTypeChoices.origin',
	complication: 'op.powerTypeChoices.complication',
	ability: 'op.powerTypeChoices.ability',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.categories = { 0: '0', 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.ritualDegree = { 5: 'Outro', 1: '1', 2: '2', 3: '3', 4: '4' };

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownExecution = {
	free: 'op.executionChoices.free',
	default: 'op.executionChoices.default',
	complete: 'op.executionChoices.complete',
	reaction: 'op.executionChoices.reaction',
};

// TODO: Cogitar mudar os valores para números por conta dos nomes em inglês talvez estarem incorretos no futuro.
/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownRange = {
	personal: 'op.rangeChoices.personal',
	touch: 'op.rangeChoices.touch',
	short: 'op.rangeChoices.short',
	medium: 'op.rangeChoices.medium',
	long: 'op.rangeChoices.long',
	extreme: 'op.rangeChoices.extreme',
	unlimited: 'op.rangeChoices.unlimited',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownTarget = {
	people: 'op.targetChoices.people',
	creatures: 'op.targetChoices.creatures',
	animals: 'op.targetChoices.animals',
	weapons: 'op.targetChoices.weapons',
	equipment: 'op.targetChoices.equipment',
	area: 'op.targetChoices.area',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownArea = {
	cone: 'op.areaChoices.cone',
	cube: 'op.areaChoices.cube',
	sphere: 'op.areaChoices.sphere',
	line: 'op.areaChoices.line',
};

op.dropdownAreaType = {
	radius: 'op.areaTypeChoices.radius',
	diameter: 'op.areaTypeChoices.diameter',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
(
	op.dropdownDuration = {
		instantaneous: 'op.durationChoices.instantaneous',
		scene: 'op.durationChoices.scene',
		sustained: 'op.durationChoices.sustained',
		setDuration: 'op.durationChoices.setDuration',
		permanent: 'op.durationChoices.permanent',
	}
);

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownResistance = {
	nullifies: 'op.resistanceChoices.nullifies',
	discredits: 'op.resistanceChoices.discredits',
	partial: 'op.resistanceChoices.partial',
	reducesByHalf: 'op.resistanceChoices.reducesByHalf',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownSkillResis = {
	resilience: 'op.skill.resilience',
	reflexes: 'op.skill.reflexes',
	will: 'op.skill.will',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
op.dropdownElement = {
	blood: 'op.elementChoices.blood',
	death: 'op.elementChoices.death',
	knowledge: 'op.elementChoices.knowledge',
	energy: 'op.elementChoices.energy',
	fear: 'op.elementChoices.fear',
};
