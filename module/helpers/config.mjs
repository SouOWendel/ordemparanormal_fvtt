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
	Agilidade: 'ordemparanormal.AttAgi',
	Inteligancia: 'ordemparanormal.AttInt',
	Vigor: 'ordemparanormal.AttVig',
	Presenca: 'ordemparanormal.AttPre',
	Forca: 'ordemparanormal.AttFor',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.skills = {
	acrobacia: 'ordemparanormal.skillAcrobacia',
	adestramento: 'ordemparanormal.skillAdestramento',
	artes: 'ordemparanormal.skillArtes',
	atletismo: 'ordemparanormal.skillAtletismo',
	atualidades: 'ordemparanormal.skillAtualidades',
	ciencias: 'ordemparanormal.skillCiencias',
	crime: 'ordemparanormal.skillCrime',
	diplomacia: 'ordemparanormal.skillDiplomacia',
	enganacao: 'ordemparanormal.skillEnganacao',
	fortitude: 'ordemparanormal.skillFortitude',
	furtividade: 'ordemparanormal.skillFurtividade',
	iniciativa: 'ordemparanormal.skillIniciativa',
	intimidacao: 'ordemparanormal.skillIntimidacao',
	intuicao: 'ordemparanormal.skillIntuicao',
	investigacao: 'ordemparanormal.skillInvestigacao',
	luta: 'ordemparanormal.skillLuta',
	medicina: 'ordemparanormal.skillMedicina',
	ocultismo: 'ordemparanormal.skillOcultismo',
	percepcao: 'ordemparanormal.skillPercepcao',
	pilotagem: 'ordemparanormal.skillPilotagem',
	pontaria: 'ordemparanormal.skillPontaria',
	reflexos: 'ordemparanormal.skillReflexos',
	religiao: 'ordemparanormal.skillReligiao',
	sobrevivencia: 'ordemparanormal.skillSobrevivencia',
	tatica: 'ordemparanormal.skillTatica',
	tecnologia: 'ordemparanormal.skillTecnologia',
	vontade: 'ordemparanormal.skillVontade',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownDegree = {
	'Destreinado': 'ordemparanormal.degreeTrainingChoices.dest',
	'Treinado': 'ordemparanormal.degreeTrainingChoices.trei',
	'Veterano': 'ordemparanormal.degreeTrainingChoices.vet',
	'Expert': 'ordemparanormal.degreeTrainingChoices.expe'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownClass = {
	'Combatente': 'ordemparanormal.classChoices.combatente',
	'Especialista': 'ordemparanormal.classChoices.especialista',
	'Ocultista': 'ordemparanormal.classChoices.ocultista'
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ordemparanormal.dropdownTrilha = {
	Combatente: [
		{name: 'aniquilador', label: 'ordemparanormal.trilhas.aniquilador'},
		{name: 'comanDeCamp', label: 'ordemparanormal.trilhas.comandanteDeCampo'},
		{name: 'opeEspeciais', label: 'ordemparanormal.trilhas.operacoesEspeciais'},
		{name: 'tropaChoque', label: 'ordemparanormal.trilhas.tropaDeChoque'},
		{name: 'guerreiro', label: 'ordemparanormal.trilhas.guerreiro'},
	],
	Especialista: [
		{name: 'infiltrador', label: 'ordemparanormal.trilhas.infiltrador'},
		{name: 'atiradorElite', label: 'ordemparanormal.trilhas.atiradorDeElite'},
		{name: 'medicoCampo', label: 'ordemparanormal.trilhas.medicoDeCampo'},
		{name: 'negociador', label: 'ordemparanormal.trilhas.negociador'},
		{name: 'tecnico', label: 'ordemparanormal.trilhas.tecnico'},
	],
	Ocultista: [
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

ordemparanormal.dropdownWeaponSubType = {
	'throw': 'ordemparanormal.weaponSubTypeChoices.throw',
	'shoot': 'ordemparanormal.weaponSubTypeChoices.shoot',
	'fire': 'ordemparanormal.weaponSubTypeChoices.fire',
};

ordemparanormal.dropdownWeaponGripType = {
	'light': 'ordemparanormal.weaponGripTypeChoices.light',
	'oneHand': 'ordemparanormal.weaponGripTypeChoices.oneHand',
	'twoHands': 'ordemparanormal.weaponGripTypeChoices.twoHands',
};

ordemparanormal.dropdownWeaponAmmunition = {
	'shortBullets': 'ordemparanormal.weaponAmmunitionChoices.shortBullets',
	'longBullets': 'ordemparanormal.weaponAmmunitionChoices.longBullets',
	'fuel': 'ordemparanormal.weaponAmmunitionChoices.fuel',
	'arrows': 'ordemparanormal.weaponAmmunitionChoices.arrows',
	'rocket': 'ordemparanormal.weaponAmmunitionChoices.rocket'
};

ordemparanormal.dropdownProficiency = {
	'simpleWeapons': 'ordemparanormal.proficiencyChoices.simpleWeapons',
	'tacticalWeapons': 'ordemparanormal.proficiencyChoices.tacticalWeapons',
	'heavyWeapons': 'ordemparanormal.proficiencyChoices.heavyWeapons'
};

ordemparanormal.dropdownDamageType = {
	'cuttingDamage': 'ordemparanormal.damageTypeChoices.cuttingDamage',
	'impactDamage': 'ordemparanormal.damageTypeChoices.impactDamage',
	'piercingDamage': 'ordemparanormal.damageTypeChoices.piercingDamage',
	'ballisticDamage': 'ordemparanormal.damageTypeChoices.ballisticDamage'
};