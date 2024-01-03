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
	'dex': 'ordemparanormal.attDex',
	'int': 'ordemparanormal.attInt',
	'vit': 'ordemparanormal.attVit',
	'pre': 'ordemparanormal.attPre',
	'str': 'ordemparanormal.attStr',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.skills = {
	acrobatics: 'ordemparanormal.skillAcrobatics',
	animal: 'ordemparanormal.skillAnimal',
	arts: 'ordemparanormal.skillArts',
	athleticism: 'ordemparanormal.skillAthleticism',
	relevance: 'ordemparanormal.skillRelevance',
	sciences: 'ordemparanormal.skillSciences',
	crime: 'ordemparanormal.skillCrime',
	diplomacy: 'ordemparanormal.skillDiplomacy',
	deception: 'ordemparanormal.skillDeception',
	resilience: 'ordemparanormal.skillResilience',
	stealth: 'ordemparanormal.skillStealth',
	initiative: 'ordemparanormal.skillInitiative',
	intimidation: 'ordemparanormal.skillIntimidation',
	intuition: 'ordemparanormal.skillIntuition',
	investigation: 'ordemparanormal.skillInvestigation',
	fighting: 'ordemparanormal.skillFighting',
	medicine: 'ordemparanormal.skillMedicine',
	occultism: 'ordemparanormal.skillOccultism',
	perception: 'ordemparanormal.skillPerception',
	driving: 'ordemparanormal.skillDriving',
	aim: 'ordemparanormal.skillAim',
	reflexes: 'ordemparanormal.skillReflexes',
	religion: 'ordemparanormal.skillReligion',
	survival: 'ordemparanormal.skillSurvival',
	tactics: 'ordemparanormal.skillTactics',
	technology: 'ordemparanormal.skillTechnology',
	will: 'ordemparanormal.skillWill',
};

ordemparanormal.attackSkills = {
	fighting: 'ordemparanormal.skillFighting',
	aim: 'ordemparanormal.skillAim',
	deception: 'ordemparanormal.skillDeception',
	occultism: 'ordemparanormal.skillOccultism'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownDegree = {
	'untrained': 'ordemparanormal.degreeTrainingChoices.dest',
	'trained': 'ordemparanormal.degreeTrainingChoices.trei',
	'veteran': 'ordemparanormal.degreeTrainingChoices.vet',
	'expert': 'ordemparanormal.degreeTrainingChoices.expe'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownClass = {
	'fighter': 'ordemparanormal.classChoices.fighter',
	'specialist': 'ordemparanormal.classChoices.specialist',
	'occultist': 'ordemparanormal.classChoices.occultist'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownTrilha = {
	fighter: [
		{name: 'aniquilador', label: 'ordemparanormal.trilhas.aniquilador'},
		{name: 'comanDeCamp', label: 'ordemparanormal.trilhas.comandanteDeCampo'},
		{name: 'opeEspeciais', label: 'ordemparanormal.trilhas.operacoesEspeciais'},
		{name: 'tropaChoque', label: 'ordemparanormal.trilhas.tropaDeChoque'},
		{name: 'guerreiro', label: 'ordemparanormal.trilhas.guerreiro'},
	],
	specialist: [
		{name: 'infiltrador', label: 'ordemparanormal.trilhas.infiltrador'},
		{name: 'atiradorElite', label: 'ordemparanormal.trilhas.atiradorDeElite'},
		{name: 'medicoCampo', label: 'ordemparanormal.trilhas.medicoDeCampo'},
		{name: 'negociador', label: 'ordemparanormal.trilhas.negociador'},
		{name: 'tecnico', label: 'ordemparanormal.trilhas.tecnico'},
	],
	occultist: [
		{name: 'conduite', label: 'ordemparanormal.trilhas.conduite'},
		{name: 'flagelador', label: 'ordemparanormal.trilhas.flagelador'},
		{name: 'graduado', label: 'ordemparanormal.trilhas.graduado'},
		{name: 'intuitivo', label: 'ordemparanormal.trilhas.intuitivo'},
		{name: 'laminaParanormal', label: 'ordemparanormal.trilhas.laminaParanormal'},
	]
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownOrigins = {
	'academico': 'ordemparanormal.originsChoices.academico',
	'agenteDeSaude': 'ordemparanormal.originsChoices.agenteDeSaude',
	'amnesico': 'ordemparanormal.originsChoices.amnesico',
	'artista': 'ordemparanormal.originsChoices.artista',
	'atleta': 'ordemparanormal.originsChoices.atleta',
	'chef': 'ordemparanormal.originsChoices.chef',
	'criminoso': 'ordemparanormal.originsChoices.criminoso',
	'cultistaArrependido': 'ordemparanormal.originsChoices.cultistaArrependido',
	'desgarrado': 'ordemparanormal.originsChoices.desgarrado',
	'engenheiro': 'ordemparanormal.originsChoices.engenheiro',
	'executivo': 'ordemparanormal.originsChoices.executivo',
	'investigador': 'ordemparanormal.originsChoices.investigador',
	'lutador': 'ordemparanormal.originsChoices.lutador',
	'magnata': 'ordemparanormal.originsChoices.magnata',
	'mercenario': 'ordemparanormal.originsChoices.mercenario',
	'militar': 'ordemparanormal.originsChoices.militar',
	'operario': 'ordemparanormal.originsChoices.operario',
	'policial': 'ordemparanormal.originsChoices.policial',
	'religioso': 'ordemparanormal.originsChoices.religioso',
	'servidorPublico': 'ordemparanormal.originsChoices.servidorPublico',
	'teóricoDaConspiracao': 'ordemparanormal.originsChoices.teóricoDaConspiracao',
	'TI.': 'ordemparanormal.originsChoices.TI',
	'trabalhadorRural': 'ordemparanormal.originsChoices.trabalhadorRural',
	'trambiqueiro': 'ordemparanormal.originsChoices.trambiqueiro',
	'universitario': 'ordemparanormal.originsChoices.universitario',
	'vítima': 'ordemparanormal.originsChoices.vítima'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponType = {
	'melee': 'ordemparanormal.weaponTypeChoices.melee',
	'ranged': 'ordemparanormal.weaponTypeChoices.ranged',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponSubType = {
	// 'throw': 'ordemparanormal.weaponSubTypeChoices.throw',
	'shoot': 'ordemparanormal.weaponSubTypeChoices.shoot',
	'fire': 'ordemparanormal.weaponSubTypeChoices.fire',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponGripType = {
	'light': 'ordemparanormal.weaponGripTypeChoices.light',
	'oneHand': 'ordemparanormal.weaponGripTypeChoices.oneHand',
	'twoHands': 'ordemparanormal.weaponGripTypeChoices.twoHands',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownWeaponAmmunition = {
	'shortBullets': 'ordemparanormal.weaponAmmunitionChoices.shortBullets',
	'longBullets': 'ordemparanormal.weaponAmmunitionChoices.longBullets',
	'fuel': 'ordemparanormal.weaponAmmunitionChoices.fuel',
	'arrows': 'ordemparanormal.weaponAmmunitionChoices.arrows',
	'rocket': 'ordemparanormal.weaponAmmunitionChoices.rocket',
	'cartridge': 'ordemparanormal.weaponAmmunitionChoices.cartridge'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownProficiency = {
	'simpleWeapons': 'ordemparanormal.proficiencyChoices.simpleWeapons',
	'tacticalWeapons': 'ordemparanormal.proficiencyChoices.tacticalWeapons',
	'heavyWeapons': 'ordemparanormal.proficiencyChoices.heavyWeapons'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownDamageType = {
	'cuttingDamage': 'ordemparanormal.damageTypeChoices.cuttingDamage',
	'impactDamage': 'ordemparanormal.damageTypeChoices.impactDamage',
	'piercingDamage': 'ordemparanormal.damageTypeChoices.piercingDamage',
	'ballisticDamage': 'ordemparanormal.damageTypeChoices.ballisticDamage'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownPowerType = {
	'class': 'ordemparanormal.powerTypeChoices.class',
	'paranormal': 'ordemparanormal.powerTypeChoices.paranormal',
	'ability': 'ordemparanormal.powerTypeChoices.ability'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.categories = {
	'0': '0',
	'1': 'I',
	'2': 'II',
	'3': 'III',
	'4': 'IV'
};