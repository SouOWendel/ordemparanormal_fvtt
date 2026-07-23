/* eslint-disable camelcase */
/**
 * Pure calculation functions extracted from OrdemActor.
 * No Foundry VTT dependencies — testable in Node.js.
 */

/**
 * @param {string} degreeLabel  'untrained'|'trained'|'veteran'|'expert'|'master'|'alfa'|'gama'|'delta'
 * @returns {number} 0, 5, 10, 15, 20, 25, 30, or 35
 */
export function calculateSkillProficiency(degreeLabel) {
	if (degreeLabel === "trained") return 5;
	if (degreeLabel === "veteran") return 10;
	if (degreeLabel === "expert") return 15;
	if (degreeLabel === "master") return 20;
	if (degreeLabel === "alfa") return 25;
	if (degreeLabel === "gama") return 30;
	if (degreeLabel === "delta") return 35;
	return 0;
}

/**
 * @param {boolean} isSurvivor
 * @param {number} rule         1=NEX, 2=nivel
 * @param {number} nexValue
 * @param {number} nivelValue
 * @param {number} stageValue
 * @returns {number}
 */
export function calculateProgress(isSurvivor, rule, nexValue, nivelValue, stageValue) {
	if (isSurvivor) return stageValue;
	if (rule === 1) return nexValue < 99 ? Math.floor(nexValue / 5) : 20;
	if (rule === 2) return nivelValue;
	return 0;
}

/**
 * Calcula o status máximo da ficha baseado nos atributos, nível atual e dados do Item de Classe.
 * * @param {number} VIG          Valor do atributo de Vitalidade
 * @param {number} PRE          Valor do atributo de Presença
 * @param {number} progress     Nível atual da ficha (resultado de calculateProgress / _progress)
 * @param {boolean} withoutSanity Se o jogo está utilizando a regra de Sanidade ou não
 * @param {object} classStats   Dados extraídos do Item de Classe (hpInitial, hpPerLevel, etc.)
 * @returns {{ PV_max: number, PE_max: number, PD_max: number, SAN_max: number }}
 */
export function calculateStatusMaxima(VIG, PRE, progress, withoutSanity, classStats) {
	// O progressAdjust representa os níveis ALÉM do 1º nível.
	const progressAdjust = Math.max(0, progress - 1);

	let PV_max = 0;
	let PE_max = 0;
	let PD_max = 0;
	let SAN_max = 0;

	// Se o Ator ainda não possuir uma Classe equipada, retorna tudo zerado (ou pode retornar apenas VIG/PRE se preferir)
	if (!classStats) {
		return { PV_max, PE_max, PD_max, SAN_max };
	}

	// Extrai os dados do Item de Classe (forçando conversão para Número para evitar erros)
	const hpInitial = Number(classStats.hpInitial) || 0;
	const hpPerLevel = Number(classStats.hpPerLevel) || 0;

	const peInitial = Number(classStats.peInitial) || 0;
	const pePerLevel = Number(classStats.pePerLevel) || 0;

	const sanInitial = Number(classStats.sanInitial) || 0;
	const sanPerLevel = Number(classStats.sanPerLevel) || 0;

	// Vida = (HP Inicial + Vitalidade) + (Níveis Seguintes * (HP por Nível + bonusSurvivorVIG))
	PV_max = hpInitial + VIG + progressAdjust * (hpPerLevel + (classStats.isSurvivor ? 0 : VIG));
	// Sanidade = Sanidade Inicial + (Níveis Seguintes * Sanidade por Nível)
	SAN_max = sanInitial + progressAdjust * sanPerLevel;

	if (withoutSanity) {
		const pdInitial = Number(classStats.pdInitial) || pdInitial;
		const pdPerLevel = Number(classStats.pdPerLevel) || pdPerLevel;
		PD_max = pdInitial + PRE + progressAdjust * (pdPerLevel + (classStats.isSurvivor ? 0 : PRE));
	} else {
		// Esforço = (PE Inicial + Presença) + (Níveis Seguintes * (PE por Nível + Presença))
		PE_max = peInitial + PRE + progressAdjust * (pePerLevel + (classStats.isSurvivor ? 0 : PRE));
	}

	return { PV_max, PE_max, PD_max, SAN_max };
}

/**
 * @param {boolean} isSurvivor
 * @param {number} progress
 * @param {boolean} withoutSanity
 * @returns {{ PE_perRound?: number, PD_perRound?: number }}
 */
export function calculatePerRound(isSurvivor, progress, withoutSanity) {
	if (withoutSanity) {
		return { PD_perRound: isSurvivor ? 1 : progress };
	}
	if (isSurvivor) {
		return { PD_perRound: 1 };
	}
	return { PE_perRound: progress };
}

/**
 * @param {number} prestigePoints
 * @returns {{ name: string, itemLimit1: number|null, itemLimit2: number|null, itemLimit3: number|null, itemLimit4: number|null, creditLimit: string }}
 */
export function calculatePatent(prestigePoints) {
	if (prestigePoints >= 200) {
		return {
			name: "Agente de Elite",
			itemLimit1: 3,
			itemLimit2: 3,
			itemLimit3: 3,
			itemLimit4: 2,
			creditLimit: "Ilimitado",
		};
	}
	if (prestigePoints >= 100) {
		return {
			name: "Oficial de Operações",
			itemLimit1: 3,
			itemLimit2: 3,
			itemLimit3: 2,
			itemLimit4: 1,
			creditLimit: "Alto",
		};
	}
	if (prestigePoints >= 50) {
		return {
			name: "Agente Especial",
			itemLimit1: 3,
			itemLimit2: 2,
			itemLimit3: 1,
			itemLimit4: null,
			creditLimit: "Médio",
		};
	}
	if (prestigePoints >= 20) {
		return {
			name: "Operador",
			itemLimit1: 3,
			itemLimit2: 1,
			itemLimit3: null,
			itemLimit4: null,
			creditLimit: "Médio",
		};
	}
	if (prestigePoints >= 0) {
		return {
			name: "Recruta",
			itemLimit1: 2,
			itemLimit2: null,
			itemLimit3: null,
			itemLimit4: null,
			creditLimit: "Baixo",
		};
	}
	return {
		name: "Sem Patente",
		itemLimit1: null,
		itemLimit2: null,
		itemLimit3: null,
		itemLimit4: null,
		creditLimit: "Baixo",
	};
}

/**
 * @param {boolean} isSurvivor
 * @param {number} nexValue
 * @param {number} PRE
 * @returns {number}
 */
export function calculateRitualDT(isSurvivor, progress, PRE) {
	if (isSurvivor) return 10 + PRE;
	return 10 + progress + PRE;
}

/**
 * @param {number} baseDefense
 * @param {number} AGI          dex attribute value
 * @param {number} reflexesDegree
 * @param {number} [reflexesMod=0]
 * @returns {{ value: number, dodge: number }}
 */
export function calculateDefense(baseDefense, AGI, reflexesDegree, reflexesMod = 0) {
	const value = baseDefense + AGI;
	const dodge = value + reflexesDegree + reflexesMod;
	return { value, dodge };
}

/**
 * @param {number} weight       pre-computed total weight of carried items
 * @param {number} FOR          str attribute value
 * @param {{ value: number, max: number }} bonus
 * @returns {{ value: number, max: number, pct: number, over: number, pctMax: number, isOverweight: boolean, isDoubleOverweight: boolean }}
 */
export function calculateSpaces(weight, FOR, bonus = { value: 0, max: 0 }) {
	const max = (FOR !== 0 ? FOR * 5 : 2) + (bonus.max || 0);
	const value = Number((weight + (bonus.value || 0)).toFixed(1));

	const pct = Math.min(Math.max((value * 100) / max, 0), 100);

	let over = 0;
	let pctMax = 0;
	const isOverweight = value > max;
	const isDoubleOverweight = value > max * 2;

	if (isOverweight) {
		over = value - max;
		pctMax = Math.min(Math.max((over * 100) / max, 0), 100);
	}

	return { value, max, pct, over, pctMax, isOverweight, isDoubleOverweight };
}
