export const ordemparanormal = {};

// Define constants here, such as:
ordemparanormal.foobar = {
	bas: 'ordemparanormal.bas',
	bar: 'ordemparanormal.bar',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.base = {
	PV: 'ordemparanormal.PV',
	PE: 'ordemparanormal.PE',
	San: 'ordemparanormal.San',
	NEX: 'ordemparanormal.NEX',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.attributes = {
	dex: 'ordemparanormal.attDex',
	int: 'ordemparanormal.attInt',
	vit: 'ordemparanormal.attVit',
	pre: 'ordemparanormal.attPre',
	str: 'ordemparanormal.attStr',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.skills = {
	acrobatics: 'ordemparanormal.skill.acrobatics',
	animal: 'ordemparanormal.skill.animal',
	arts: 'ordemparanormal.skill.arts',
	athleticism: 'ordemparanormal.skill.athleticism',
	relevance: 'ordemparanormal.skill.relevance',
	sciences: 'ordemparanormal.skill.sciences',
	crime: 'ordemparanormal.skill.crime',
	diplomacy: 'ordemparanormal.skill.diplomacy',
	deception: 'ordemparanormal.skill.deception',
	resilience: 'ordemparanormal.skill.resilience',
	stealth: 'ordemparanormal.skill.stealth',
	initiative: 'ordemparanormal.skill.initiative',
	intimidation: 'ordemparanormal.skill.intimidation',
	intuition: 'ordemparanormal.skill.intuition',
	investigation: 'ordemparanormal.skill.investigation',
	fighting: 'ordemparanormal.skill.fighting',
	medicine: 'ordemparanormal.skill.medicine',
	occultism: 'ordemparanormal.skill.occultism',
	perception: 'ordemparanormal.skill.perception',
	driving: 'ordemparanormal.skill.driving',
	aim: 'ordemparanormal.skill.aim',
	reflexes: 'ordemparanormal.skill.reflexes',
	religion: 'ordemparanormal.skill.religion',
	survival: 'ordemparanormal.skill.survival',
	tactics: 'ordemparanormal.skill.tactics',
	technology: 'ordemparanormal.skill.technology',
	will: 'ordemparanormal.skill.will',
};

ordemparanormal.attackSkills = {
	fighting: 'ordemparanormal.skill.fighting',
	aim: 'ordemparanormal.skill.aim',
	deception: 'ordemparanormal.skill.deception',
	occultism: 'ordemparanormal.skill.occultism',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownDegree = {
	untrained: 'ordemparanormal.degreeTrainingChoices.dest',
	trained: 'ordemparanormal.degreeTrainingChoices.trei',
	veteran: 'ordemparanormal.degreeTrainingChoices.vet',
	expert: 'ordemparanormal.degreeTrainingChoices.expe',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownClass = {
	fighter: 'ordemparanormal.classChoices.fighter',
	specialist: 'ordemparanormal.classChoices.specialist',
	occultist: 'ordemparanormal.classChoices.occultist',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownTrilha = {
	fighter: [
		{ name: 'aniquilador', label: 'ordemparanormal.trilhas.aniquilador' },
		{ name: 'comanDeCamp', label: 'ordemparanormal.trilhas.comandanteDeCampo' },
		{
			name: 'opeEspeciais',
			label: 'ordemparanormal.trilhas.operacoesEspeciais',
		},
		{ name: 'tropaChoque', label: 'ordemparanormal.trilhas.tropaDeChoque' },
		{ name: 'guerreiro', label: 'ordemparanormal.trilhas.guerreiro' },
	],
	specialist: [
		{ name: 'infiltrador', label: 'ordemparanormal.trilhas.infiltrador' },
		{ name: 'atiradorElite', label: 'ordemparanormal.trilhas.atiradorDeElite' },
		{ name: 'medicoCampo', label: 'ordemparanormal.trilhas.medicoDeCampo' },
		{ name: 'negociador', label: 'ordemparanormal.trilhas.negociador' },
		{ name: 'tecnico', label: 'ordemparanormal.trilhas.tecnico' },
	],
	occultist: [
		{ name: 'conduite', label: 'ordemparanormal.trilhas.conduite' },
		{ name: 'flagelador', label: 'ordemparanormal.trilhas.flagelador' },
		{ name: 'graduado', label: 'ordemparanormal.trilhas.graduado' },
		{ name: 'intuitivo', label: 'ordemparanormal.trilhas.intuitivo' },
		{
			name: 'laminaParanormal',
			label: 'ordemparanormal.trilhas.laminaParanormal',
		},
	],
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownOrigins = {
	academico: 'ordemparanormal.originsChoices.academico',
	agenteDeSaude: 'ordemparanormal.originsChoices.agenteDeSaude',
	amnesico: 'ordemparanormal.originsChoices.amnesico',
	artista: 'ordemparanormal.originsChoices.artista',
	atleta: 'ordemparanormal.originsChoices.atleta',
	chef: 'ordemparanormal.originsChoices.chef',
	criminoso: 'ordemparanormal.originsChoices.criminoso',
	cultistaArrependido: 'ordemparanormal.originsChoices.cultistaArrependido',
	desgarrado: 'ordemparanormal.originsChoices.desgarrado',
	engenheiro: 'ordemparanormal.originsChoices.engenheiro',
	executivo: 'ordemparanormal.originsChoices.executivo',
	investigador: 'ordemparanormal.originsChoices.investigador',
	lutador: 'ordemparanormal.originsChoices.lutador',
	magnata: 'ordemparanormal.originsChoices.magnata',
	mercenario: 'ordemparanormal.originsChoices.mercenario',
	militar: 'ordemparanormal.originsChoices.militar',
	operario: 'ordemparanormal.originsChoices.operario',
	policial: 'ordemparanormal.originsChoices.policial',
	religioso: 'ordemparanormal.originsChoices.religioso',
	servidorPublico: 'ordemparanormal.originsChoices.servidorPublico',
	teóricoDaConspiracao: 'ordemparanormal.originsChoices.teóricoDaConspiracao',
	'TI.': 'ordemparanormal.originsChoices.TI',
	trabalhadorRural: 'ordemparanormal.originsChoices.trabalhadorRural',
	trambiqueiro: 'ordemparanormal.originsChoices.trambiqueiro',
	universitario: 'ordemparanormal.originsChoices.universitario',
	vítima: 'ordemparanormal.originsChoices.vítima',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponType = {
	melee: 'ordemparanormal.weaponTypeChoices.melee',
	ranged: 'ordemparanormal.weaponTypeChoices.ranged',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponSubType = {
	// 'throw': 'ordemparanormal.weaponSubTypeChoices.throw',
	shoot: 'ordemparanormal.weaponSubTypeChoices.shoot',
	fire: 'ordemparanormal.weaponSubTypeChoices.fire',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponGripType = {
	light: 'ordemparanormal.weaponGripTypeChoices.light',
	oneHand: 'ordemparanormal.weaponGripTypeChoices.oneHand',
	twoHands: 'ordemparanormal.weaponGripTypeChoices.twoHands',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponAmmunition = {
	shortBullets: 'ordemparanormal.weaponAmmunitionChoices.shortBullets',
	longBullets: 'ordemparanormal.weaponAmmunitionChoices.longBullets',
	fuel: 'ordemparanormal.weaponAmmunitionChoices.fuel',
	arrows: 'ordemparanormal.weaponAmmunitionChoices.arrows',
	rocket: 'ordemparanormal.weaponAmmunitionChoices.rocket',
	cartridge: 'ordemparanormal.weaponAmmunitionChoices.cartridge',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownProficiency = {
	simpleWeapons: 'ordemparanormal.proficiencyChoices.simpleWeapons',
	tacticalWeapons: 'ordemparanormal.proficiencyChoices.tacticalWeapons',
	heavyWeapons: 'ordemparanormal.proficiencyChoices.heavyWeapons',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownDamageType = {
	cuttingDamage: 'ordemparanormal.damageTypeChoices.cuttingDamage',
	impactDamage: 'ordemparanormal.damageTypeChoices.impactDamage',
	piercingDamage: 'ordemparanormal.damageTypeChoices.piercingDamage',
	ballisticDamage: 'ordemparanormal.damageTypeChoices.ballisticDamage',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownPowerType = {
	class: 'ordemparanormal.powerTypeChoices.class',
	paranormal: 'ordemparanormal.powerTypeChoices.paranormal',
	path: 'ordemparanormal.powerTypeChoices.path',
	ability: 'ordemparanormal.powerTypeChoices.ability',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.categories = { 0: '0', 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.ritualDegree = { 5: 'Outro', 1: '1', 2: '2', 3: '3', 4: '4' };

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownExecution = {
	free: 'ordemparanormal.executionChoices.free',
	default: 'ordemparanormal.executionChoices.default',
	complete: 'ordemparanormal.executionChoices.complete',
	reaction: 'ordemparanormal.executionChoices.reaction',
};

// TODO: Cogitar mudar os valores para números por conta dos nomes em inglês talvez estarem incorretos no futuro.
/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownRange = {
	personal: 'ordemparanormal.rangeChoices.personal',
	touch: 'ordemparanormal.rangeChoices.touch',
	short: 'ordemparanormal.rangeChoices.short',
	medium: 'ordemparanormal.rangeChoices.medium',
	long: 'ordemparanormal.rangeChoices.long',
	extreme: 'ordemparanormal.rangeChoices.extreme',
	unlimited: 'ordemparanormal.rangeChoices.unlimited',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownTarget = {
	people: 'ordemparanormal.targetChoices.people',
	creatures: 'ordemparanormal.targetChoices.creatures',
	animals: 'ordemparanormal.targetChoices.animals',
	weapons: 'ordemparanormal.targetChoices.weapons',
	equipment: 'ordemparanormal.targetChoices.equipment',
	area: 'ordemparanormal.targetChoices.area',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownArea = {
	cone: 'ordemparanormal.areaChoices.cone',
	cube: 'ordemparanormal.areaChoices.cube',
	sphere: 'ordemparanormal.areaChoices.sphere',
	line: 'ordemparanormal.areaChoices.line',
};

ordemparanormal.dropdownAreaType = {
	radius: 'ordemparanormal.areaTypeChoices.radius',
	diameter: 'ordemparanormal.areaTypeChoices.diameter',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
(
	ordemparanormal.dropdownDuration = {
		instantaneous: 'ordemparanormal.durationChoices.instantaneous',
		scene: 'ordemparanormal.durationChoices.scene',
		sustained: 'ordemparanormal.durationChoices.sustained',
		setDuration: 'ordemparanormal.durationChoices.setDuration',
		permanent: 'ordemparanormal.durationChoices.permanent',
	}
);

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownResistance = {
	nullifies: 'ordemparanormal.resistanceChoices.nullifies',
	discredits: 'ordemparanormal.resistanceChoices.discredits',
	partial: 'ordemparanormal.resistanceChoices.partial',
	reducesByHalf: 'ordemparanormal.resistanceChoices.reducesByHalf',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownSkillResis = {
	resilience: 'ordemparanormal.skill.resilience',
	reflexes: 'ordemparanormal.skill.reflexes',
	will: 'ordemparanormal.skill.will',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownElement = {
	blood: 'ordemparanormal.elementChoices.blood',
	death: 'ordemparanormal.elementChoices.death',
	knowledge: 'ordemparanormal.elementChoices.knowledge',
	energy: 'ordemparanormal.elementChoices.energy',
	fear: 'ordemparanormal.elementChoices.fear',
};
