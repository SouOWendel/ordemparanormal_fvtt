export const ORDEMPARANORMAL_FVTT = {};

// Define constants here, such as:
ORDEMPARANORMAL_FVTT.foobar = {
	bas: 'ORDEMPARANORMAL_FVTT.bas',
	bar: 'ORDEMPARANORMAL_FVTT.bar',
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
ORDEMPARANORMAL_FVTT.base = {
	PV: 'ORDEMPARANORMAL_FVTT.PV',
	PE: 'ORDEMPARANORMAL_FVTT.PE',
	San: 'ORDEMPARANORMAL_FVTT.San',
	NEX: 'ORDEMPARANORMAL_FVTT.NEX',
};

ORDEMPARANORMAL_FVTT.attributes = {
	Agilidade: 'ORDEMPARANORMAL_FVTT.AttAgi',
	Inteligancia: 'ORDEMPARANORMAL_FVTT.AttInt',
	Vigor: 'ORDEMPARANORMAL_FVTT.AttVig',
	Presenca: 'ORDEMPARANORMAL_FVTT.AttPre',
	Forca: 'ORDEMPARANORMAL_FVTT.AttFor',
};

ORDEMPARANORMAL_FVTT.skills = {
	acrobacia: 'ORDEMPARANORMAL_FVTT.skillAcrobacia',
	adestramento: 'ORDEMPARANORMAL_FVTT.skillAdestramento',
	artes: 'ORDEMPARANORMAL_FVTT.skillArtes',
	atletismo: 'ORDEMPARANORMAL_FVTT.skillAtletismo',
	atualidades: 'ORDEMPARANORMAL_FVTT.skillAtualidades',
	ciencias: 'ORDEMPARANORMAL_FVTT.skillCiencias',
	crime: 'ORDEMPARANORMAL_FVTT.skillCrime',
	diplomacia: 'ORDEMPARANORMAL_FVTT.skillDiplomacia',
	enganacao: 'ORDEMPARANORMAL_FVTT.skillEnganacao',
	fortitude: 'ORDEMPARANORMAL_FVTT.skillFortitude',
	furtividade: 'ORDEMPARANORMAL_FVTT.skillFurtividade',
	iniciativa: 'ORDEMPARANORMAL_FVTT.skillIniciativa',
	intimidacao: 'ORDEMPARANORMAL_FVTT.skillIntimidacao',
	intuicao: 'ORDEMPARANORMAL_FVTT.skillIntuicao',
	investigacao: 'ORDEMPARANORMAL_FVTT.skillInvestigacao',
	luta: 'ORDEMPARANORMAL_FVTT.skillLuta',
	medicina: 'ORDEMPARANORMAL_FVTT.skillMedicina',
	ocultismo: 'ORDEMPARANORMAL_FVTT.skillOcultismo',
	percepcao: 'ORDEMPARANORMAL_FVTT.skillPercepcao',
	pilotagem: 'ORDEMPARANORMAL_FVTT.skillPilotagem',
	pontaria: 'ORDEMPARANORMAL_FVTT.skillPontaria',
	reflexos: 'ORDEMPARANORMAL_FVTT.skillReflexos',
	religiao: 'ORDEMPARANORMAL_FVTT.skillReligiao',
	sobrevivencia: 'ORDEMPARANORMAL_FVTT.skillSobrevivencia',
	tatica: 'ORDEMPARANORMAL_FVTT.skillTatica',
	tecnologia: 'ORDEMPARANORMAL_FVTT.skillTecnologia',
	vontade: 'ORDEMPARANORMAL_FVTT.skillVontade',
};

ORDEMPARANORMAL_FVTT.abilities = {
	str: 'ORDEMPARANORMAL_FVTT.AbilityStr',
	dex: 'ORDEMPARANORMAL_FVTT.AbilityDex',
	con: 'ORDEMPARANORMAL_FVTT.AbilityCon',
	int: 'ORDEMPARANORMAL_FVTT.AbilityInt',
	wis: 'ORDEMPARANORMAL_FVTT.AbilityWis',
	cha: 'ORDEMPARANORMAL_FVTT.AbilityCha',
};


ORDEMPARANORMAL_FVTT.abilityAbbreviations = {
	str: 'ORDEMPARANORMAL_FVTT.AbilityStrAbbr',
	dex: 'ORDEMPARANORMAL_FVTT.AbilityDexAbbr',
	con: 'ORDEMPARANORMAL_FVTT.AbilityConAbbr',
	int: 'ORDEMPARANORMAL_FVTT.AbilityIntAbbr',
	wis: 'ORDEMPARANORMAL_FVTT.AbilityWisAbbr',
	cha: 'ORDEMPARANORMAL_FVTT.AbilityChaAbbr',
};

ORDEMPARANORMAL_FVTT.dropdownDegree = {
	'Destreinado': 'ORDEMPARANORMAL_FVTT.degreeTrainingChoices.dest',
	'Treinado': 'ORDEMPARANORMAL_FVTT.degreeTrainingChoices.trei',
	'Veterano': 'ORDEMPARANORMAL_FVTT.degreeTrainingChoices.vet',
	'Expert': 'ORDEMPARANORMAL_FVTT.degreeTrainingChoices.expe'
};

ORDEMPARANORMAL_FVTT.dropdownClass = {
	'Combatente': 'ORDEMPARANORMAL_FVTT.classChoices.combatente',
	'Especialista': 'ORDEMPARANORMAL_FVTT.classChoices.especialista',
	'Ocultista': 'ORDEMPARANORMAL_FVTT.classChoices.ocultista'
};

ORDEMPARANORMAL_FVTT.dropdownTrilha = {
	Combatente: [
		{name: 'aniquilador', label: 'ORDEMPARANORMAL_FVTT.trilhas.aniquilador'},
		{name: 'comanDeCamp', label: 'ORDEMPARANORMAL_FVTT.trilhas.comandanteDeCampo'},
		{name: 'opeEspeciais', label: 'ORDEMPARANORMAL_FVTT.trilhas.operacoesEspeciais'},
		{name: 'tropaChoque', label: 'ORDEMPARANORMAL_FVTT.trilhas.tropaDeChoque'},
		{name: 'guerreiro', label: 'ORDEMPARANORMAL_FVTT.trilhas.guerreiro'},
	],
	Especialista: [
		{name: 'infiltrador', label: 'ORDEMPARANORMAL_FVTT.trilhas.infiltrador'},
		{name: 'atiradorElite', label: 'ORDEMPARANORMAL_FVTT.trilhas.atiradorDeElite'},
		{name: 'medicoCampo', label: 'ORDEMPARANORMAL_FVTT.trilhas.medicoDeCampo'},
		{name: 'negociador', label: 'ORDEMPARANORMAL_FVTT.trilhas.negociador'},
		{name: 'tecnico', label: 'ORDEMPARANORMAL_FVTT.trilhas.tecnico'},
	],
	Ocultista: [
		{name: 'conduite', label: 'ORDEMPARANORMAL_FVTT.trilhas.conduite'},
		{name: 'flagelador', label: 'ORDEMPARANORMAL_FVTT.trilhas.flagelador'},
		{name: 'graduado', label: 'ORDEMPARANORMAL_FVTT.trilhas.graduado'},
		{name: 'intuitivo', label: 'ORDEMPARANORMAL_FVTT.trilhas.intuitivo'},
		{name: 'laminaParanormal', label: 'ORDEMPARANORMAL_FVTT.trilhas.laminaParanormal'},
	]
};